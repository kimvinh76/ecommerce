import Order from "../models/Order.js";
import crypto from "crypto";
import axios from "axios";
// import { payos } from '../config/payosconfig.js';
import OrderDetail from "../models/OrderDetail.js";
import Book from "../models/Book.js";
import {
  buildOrderCanceledMail,
  buildOrderFailedMail,
  buildOrderSuccessMail,
} from "../utils/MailTemplate.js";
import { sendMail } from "./mail.service.js";
import User from "../models/User.js";
import { updateOrderService } from "./OrderService.js";

function normalizeOrderCode(order) {
  if (order.payosOrderId) return order.payosOrderId;
  return (
    Number(
      String(order._id)
        .slice(-6)
        .replace(/[^0-9]/g, ""),
    ) || Number(String(Date.now()).slice(-6))
  );
}

function buildTransferContent(orderCode) {
  return `SUPERBOOK-${orderCode}`;
}

function isMongoObjectId(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || ""));
}

function buildVietQrUrl({
  bankBin,
  accountNumber,
  accountName,
  amount,
  content,
}) {
  const encodedContent = encodeURIComponent(content);
  const encodedName = encodeURIComponent(accountName);
  return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodedContent}&accountName=${encodedName}`;
}

function createQrTransferPayment(order) {
  const bankBin = process.env.BANK_BIN || "970422";
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER || "19036479412018";
  const accountName = process.env.BANK_ACCOUNT_NAME || "SUPER BOOKSTORE";

  const orderCode = normalizeOrderCode(order);
  const content = buildTransferContent(orderCode);
  const qrCodeUrl = buildVietQrUrl({
    bankBin,
    accountNumber,
    accountName,
    amount: order.totalAmount,
    content,
  });

  return {
    orderCode,
    content,
    qrCodeUrl,
    bank: {
      bankBin,
      accountNumber,
      accountName,
    },
  };
}

function getVnpTnxRef(order, forceNew = false) {
  if (!forceNew && order.payosOrderId) return String(order.payosOrderId);
  const raw = `${Date.now()}${Math.floor(Math.random() * 90) + 10}`;
  return raw.slice(-12);
}

function getClientIp(reqLike) {
  const forwarded = reqLike?.headers?.["x-forwarded-for"];
  let ip = "";

  if (typeof forwarded === "string" && forwarded.length > 0) {
    ip = forwarded.split(",")[0].trim();
  } else {
    ip = reqLike?.ip || reqLike?.connection?.remoteAddress || "";
  }

  if (!ip) return "127.0.0.1";

  // Express may return IPv4-mapped IPv6 format, e.g. ::ffff:127.0.0.1
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  if (ip === "::1") {
    return "127.0.0.1";
  }

  const ipv4Regex =
    /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  if (ipv4Regex.test(ip)) {
    return ip;
  }

  return "127.0.0.1";
}

// Gom cac truong can thiet de tao chu ky HMAC theo MoMo docs.
function buildMomoRawSignature(data) {
  return [
    `accessKey=${data.accessKey}`,
    `amount=${data.amount}`,
    `extraData=${data.extraData}`,
    `ipnUrl=${data.ipnUrl}`,
    `orderId=${data.orderId}`,
    `orderInfo=${data.orderInfo}`,
    `partnerCode=${data.partnerCode}`,
    `redirectUrl=${data.redirectUrl}`,
    `requestId=${data.requestId}`,
    `requestType=${data.requestType}`,
  ].join("&");
}
//loai requestType: captureWallet, payWithMethod, payWithATM
function resolveMomoRequestType(reqLike = {}) {
  const reqRequestType =
    reqLike?.query?.requestType || reqLike?.body?.requestType;
  const requestType = String(
    reqRequestType || process.env.MOMO_REQUEST_TYPE || "captureWallet",
  ).trim();

  const supportedRequestTypes = [
    "captureWallet",
    "payWithMethod",
    "payWithATM",
  ];

  if (!supportedRequestTypes.includes(requestType)) {
    throw new Error(
      `MOMO_REQUEST_TYPE khong hop le: ${requestType}. Ho tro: ${supportedRequestTypes.join(", ")}`,
    );
  }

  return requestType;
}

async function createMomoPayment(order, reqLike = {}, options = {}) {
  // Tao giao dich MoMo: build payload, ky request va goi API sandbox.
  const { forceNewOrderId = false } = options;
  const endpoint =
    process.env.MOMO_ENDPOINT ||
    "https://test-payment.momo.vn/v2/gateway/api/create";
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const defaultReturnUrl = `http://localhost:${process.env.PORTBE || 8080}${process.env.API_TAG || "/api/v1"}/payment/momo-return`;
  const defaultIpnUrl = `http://localhost:${process.env.PORTBE || 8080}${process.env.API_TAG || "/api/v1"}/payment/momo-ipn`;
  const redirectUrl = process.env.MOMO_RETURN_URL || defaultReturnUrl;
  const ipnUrl = process.env.MOMO_IPN_URL || defaultIpnUrl;

  const isPlaceholder = (value) =>
    !value || String(value).trim().startsWith("YOUR_");

  if (
    isPlaceholder(partnerCode) ||
    isPlaceholder(accessKey) ||
    isPlaceholder(secretKey)
  ) {
    throw new Error(
      "Chua cau hinh MoMo sandbox. Vui long cap nhat MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY trong backend/.env",
    );
  }

  const requestId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  const orderId = getVnpTnxRef(order, forceNewOrderId);
  const orderInfo = `Thanh toan don hang ${orderId}`;
  const requestType = resolveMomoRequestType(reqLike);
  const amount = String(Math.round(Number(order.totalAmount || 0)));
  const extraData = "";

  const rawSignature = buildMomoRawSignature({
    accessKey,
    amount,
    extraData,
    ipnUrl,
    orderId,
    orderInfo,
    partnerCode,
    redirectUrl,
    requestId,
    requestType,
  });

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const payload = {
    partnerCode,
    accessKey,
    partnerName: "Super Book",
    storeId: "SuperBookStore",
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    requestType,
    autoCapture: true,
    extraData,
    signature,
  };

  let result;
  try {
    const response = await axios.post(endpoint, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });
    result = response?.data;
  } catch (error) {
    const gatewayMessage =
      error?.response?.data?.message || error?.message || "MoMo gateway error";
    throw new Error(`Khong tao duoc giao dich MoMo: ${gatewayMessage}`);
  }

  if (!result?.payUrl) {
    if (String(result?.resultCode) !== "0") {
      throw new Error(result?.message || "MoMo tao giao dich that bai");
    }
    if (!result?.deeplink && !result?.qrCodeUrl) {
      throw new Error("MoMo did not return a usable payment URL");
    }
  }

  return {
    orderId,
    requestId,
    paymentUrl: result.payUrl || result.deeplink || result.qrCodeUrl,
    deeplink: result.deeplink,
    qrCodeUrl: result.qrCodeUrl,
    resultCode: result.resultCode,
    message: result.message,
  };
}

async function handleMomoResult({ orderId, resultCode }) {
  const order = await Order.findOne({
    $or: [
      { payosOrderId: Number(orderId) },
      { paymentLinkId: String(orderId) },
    ],
  });

  if (!order) {
    throw new Error("Order not found for MoMo transaction");
  }

  if (order.purchaseStatus === "canceled") {
    if (order.paymentStatus !== "failed") {
      order.paymentStatus = "failed";
      await order.save();
    }
    // Don da bi huy: khong cho chuyen sang paid, chi tra FAILED.
    console.warn("[momo] Ignore paid callback for canceled order", {
      orderId: String(order._id),
      momoOrderId: String(orderId),
    });
    return {
      orderId: order._id,
      orderCode: orderId,
      status: "FAILED",
      // Dung cho UI hien thi ly do that bai.
      reason: "ORDER_CANCELED",
    };
  }

  const isSuccess = String(resultCode) === "0";
  if (isSuccess) {
    if (order.paymentStatus !== "paid") {
      // 1. Nếu đơn đang là "Chờ xác nhận" (pending), chuẩn bị trạng thái mới là "Đang xử lý" (processing)

      const newPurchaseStatus = order.purchaseStatus === "pending" ? "processing" : order.purchaseStatus;
      await updateOrderService(order._id, order.customerId, newPurchaseStatus, "paid");
    }
    return { orderId: order._id, orderCode: orderId, status: "PAID" };
  }

  if (order.paymentStatus !== "failed") {
    // 2. GỌI HÀM UPDATE CỦA HỆ THỐNG
    await updateOrderService(order._id, order.customerId, order.purchaseStatus, "failed");
  }
  return { orderId: order._id, orderCode: orderId, status: "FAILED" };
}

export async function createPaymentService(orderId, customerId, reqLike = {}) {
  // Ham dieu phoi chinh: kiem tra don, chon dung luong thanh toan theo paymentMethod.
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error(`Order with id ${orderId} not found`);
  }

  if (order.customerId.toString() !== customerId.toString()) {
    throw new Error("You are not authorize to create payment for this order");
  }

  if (!["PAYOS", "MOMO"].includes(order.paymentMethod)) {
    throw new Error("This order does not use online payment method");
  }

  if (order.paymentStatus === "paid") {
    return {
      orderId: order._id,
      orderCode: order.payosOrderId,
      alreadyPaid: true,
      message: "Order is already paid",
    };
  }

  if (order.paymentMethod === "MOMO") {
    // MoMo: neu da co link con hop le thi dung lai, tranh tao giao dich trung lap.
    const clientIp = getClientIp(reqLike);

    // Nếu đơn chưa failed và đã có link, reuse link cũ để tránh tạo giao dịch trùng.
    const canReusePaymentLink =
      order.paymentStatus !== "failed" &&
      order.paymentStatus !== "paid" &&
      Boolean(order.paymentLink && order.paymentLinkId);

    if (canReusePaymentLink) {
      return {
        orderId: order._id,
        orderCode: String(order.payosOrderId || order.paymentLinkId),
        amount: order.totalAmount,
        paymentUrl: order.paymentLink,
        deeplink: undefined,
        qrCodeUrl: undefined,
      };
    }

    // Đơn failed thì tạo orderId gateway mới để thanh toán lại.
    const shouldForceNewMomoOrderId = order.paymentStatus === "failed";
    const { paymentUrl, orderId, requestId, deeplink, qrCodeUrl } =
      await createMomoPayment(order, reqLike, {
        forceNewOrderId: shouldForceNewMomoOrderId,
      });

    console.log("[momo] create payment", {
      orderId: String(order._id),
      momoOrderId: orderId,
      requestId,
      amount: order.totalAmount,
      clientIp,
      requestType: resolveMomoRequestType(reqLike),
      returnUrl: process.env.MOMO_RETURN_URL,
      partnerCode: process.env.MOMO_PARTNER_CODE,
    });

    order.payosOrderId = Number(orderId);
    order.paymentLink = paymentUrl;
    order.paymentLinkId = requestId;
    await order.save();

    return {
      orderId: order._id,
      orderCode: orderId,
      amount: order.totalAmount,
      paymentUrl,
      deeplink,
      qrCodeUrl,
    };
  }
  const { orderCode, content, qrCodeUrl, bank } =
    createQrTransferPayment(order);

  order.payosOrderId = orderCode;
  order.paymentLink = qrCodeUrl;
  order.paymentLinkId = content;
  await order.save();

  return {
    orderId: order._id,
    orderCode,
    amount: order.totalAmount,
    qrCodeUrl,
    transferContent: content,
    bank,
  };
}

export async function confirmPaymentService(orderId, customerId) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error(`Order with id ${orderId} not found`);
  }

  if (order.purchaseStatus === "canceled") {
    throw new Error("Order was canceled and cannot be paid");
  }

  if (order.customerId.toString() !== customerId.toString()) {
    throw new Error("You are not authorize to confirm this payment");
  }

  if (!["PAYOS", "MOMO"].includes(order.paymentMethod)) {
    throw new Error("Order is not QR transfer payment method");
  }

  if (order.paymentStatus === "paid") {
    return order;
  }

  const newPurchaseStatus = order.purchaseStatus === "pending" ? "processing" : order.purchaseStatus;
  await updateOrderService(order._id, order.customerId, newPurchaseStatus, "paid");

  return Order.findById(order._id);
}

export async function cancelPaymentService(orderId, customerId) {
  let order = null;

  // Avoid CastError when orderId is actually orderCode (number string).
  if (isMongoObjectId(orderId)) {
    order = await Order.findById(orderId);
  }

  if (!order) {
    const numericOrderCode = Number(orderId);
    if (Number.isFinite(numericOrderCode)) {
      order = await Order.findOne({ payosOrderId: numericOrderCode });
    }
  }

  if (!order) {
    // Fallback for cases where caller passes MoMo requestId.
    order = await Order.findOne({ paymentLinkId: String(orderId) });
  }

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }
  if (order.customerId.toString() !== customerId.toString()) {
    throw new Error(`You are not authorize to cancel this order`);
  }

  // MoMo/PayOS trả về cancel chỉ nên đánh dấu thanh toán thất bại,
  // không khóa đơn để khách còn có thể thanh toán lại.
  const isOnlinePayment = ["MOMO", "PAYOS"].includes(order.paymentMethod);
  const isUnpaid = order.paymentStatus !== "paid";
  if (isOnlinePayment && isUnpaid) {
    order.paymentStatus = "failed";
    if (order.purchaseStatus === "canceled") {
      order.purchaseStatus = "pending";
    }
    await order.save();
    return order;
  }

  if (order.purchaseStatus === "canceled") {
    return order;
  }
  await updateOrderService(order._id, order.customerId, "canceled", "failed");
  return Order.findById(order._id);
}

export async function handleMomoReturnService(query) {
  const orderId = query.orderId;
  const resultCode = query.resultCode;

  if (!orderId) {
    throw new Error("Missing MoMo orderId");
  }

  return handleMomoResult({ orderId, resultCode });
}

export async function handleMomoIpnService(payload) {
  const orderId = payload.orderId;
  const resultCode = payload.resultCode;

  if (!orderId) {
    throw new Error("Missing MoMo orderId");
  }

  return handleMomoResult({ orderId, resultCode });
}

async function notifyAdminAndUser(order, subject, html) {
  try {
    await sendMail(process.env.MAIL_ADMIN, subject, html);
  } catch (err) {
    console.error("Không gửi được mail cho admin:", err.message);
  }

  try {
    const user = await User.findById(order.customerId);
    if (user?.email) {
      await sendMail(user.email, subject, html);
    }
  } catch (err) {
    console.error("Không gửi được mail cho khách hàng:", err.message);
  }
}
// tra ve frontend
// code = 00 success
// paymentLinkId = a9a4dcc03f794fb29af9ec8e53eb50e1 // tim hoa don theo id nay xong set status = PAID va purchaseStatus la delivery
// cancel = false
// status = PAID
// orderCode = 340793
//http://localhost:3000/payment/return?code=00&id=a9a4dcc03f794fb29af9ec8e53eb50e1&cancel=false&status=PAID&orderCode=340793
//cancel
// http://localhost:3000/payment/cancel?code=00&id=16b1651d3e18422c801651f54375e122&cancel=true&status=CANCELLED&orderCode=604838
