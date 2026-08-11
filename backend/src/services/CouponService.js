import Coupon from "../models/Coupon.js";

function buildCouponError(message) {
  const error = new Error(message);
  error.name = "CouponValidationError";
  return error;
}

function normalizeCode(code = "") {
  return String(code || "")
    .trim()
    .toUpperCase();
}

export function calculateCouponDiscount(coupon, subtotal) {
  const normalizedSubtotal = Math.max(0, Number(subtotal || 0));
  if (!coupon) return 0;

  let discount = 0;
  if (coupon.discountType === "percent") {
    discount = Math.floor(
      (normalizedSubtotal * Number(coupon.discountValue || 0)) / 100,
    );
  } else {
    discount = Math.floor(Number(coupon.discountValue || 0));
  }

  if (Number(coupon.maxDiscount || 0) > 0) {
    discount = Math.min(discount, Number(coupon.maxDiscount));
  }

  return Math.max(0, Math.min(discount, normalizedSubtotal));
}

export async function validateCouponService(code, subtotal) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    throw buildCouponError("Vui long nhap ma giam gia");
  }

  const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });
  if (!coupon) {
    throw buildCouponError("Ma giam gia khong ton tai hoac da ngung hoat dong");
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw buildCouponError(
      "Ma giam gia da het han hoac chua den thoi gian ap dung",
    );
  }

  if (
    Number(coupon.usageLimit || 0) > 0 &&
    Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)
  ) {
    throw buildCouponError("Ma giam gia da het luot su dung");
  }

  const normalizedSubtotal = Math.max(0, Number(subtotal || 0));
  if (normalizedSubtotal < Number(coupon.minOrderValue || 0)) {
    throw buildCouponError(
      `Don hang toi thieu ${Number(coupon.minOrderValue || 0).toLocaleString("vi-VN")}d moi duoc ap ma`,
    );
  }

  const discountAmount = calculateCouponDiscount(coupon, normalizedSubtotal);

  return {
    coupon,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
  };
}

export async function applyCouponUsageService(couponId, session) {
  if (!couponId) return;
  await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } }, { session });
}
