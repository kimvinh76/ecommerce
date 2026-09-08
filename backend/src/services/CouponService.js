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

// ---------------- Admin CRUD Services ----------------

export async function createCouponService(data) {
  const { code } = data;
  const normalizedCode = normalizeCode(code);
  const existing = await Coupon.findOne({ code: normalizedCode });
  if (existing) {
    throw buildCouponError("Mã giảm giá đã tồn tại");
  }
  const coupon = await Coupon.create({ ...data, code: normalizedCode });
  return coupon;
}

export async function getAllCouponsService(query = {}) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }
  if (query.search) {
    filter.code = { $regex: query.search, $options: "i" };
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Coupon.countDocuments(filter),
  ]);

  return {
    data: coupons,
    pagination: {
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    },
  };
}

export async function getCouponByIdService(id) {
  const coupon = await Coupon.findById(id).lean();
  if (!coupon) throw buildCouponError("Không tìm thấy mã giảm giá");
  return coupon;
}

export async function updateCouponService(id, data) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw buildCouponError("Không tìm thấy mã giảm giá");

  if (data.code && data.code !== coupon.code) {
    const normalizedCode = normalizeCode(data.code);
    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      throw buildCouponError("Mã giảm giá mới đã tồn tại");
    }
    data.code = normalizedCode;
  }

  const updated = await Coupon.findByIdAndUpdate(id, data, { new: true }).lean();
  return updated;
}

export async function deleteCouponService(id) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw buildCouponError("Không tìm thấy mã giảm giá");
  
  await Coupon.findByIdAndDelete(id);
  return coupon;
}
