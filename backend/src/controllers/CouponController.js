import {
  validateCouponService,
  createCouponService,
  getAllCouponsService,
  getCouponByIdService,
  updateCouponService,
  deleteCouponService,
} from "../services/CouponService.js";

export async function validateCoupon(req, res) {
  try {
    const { code, subtotal } = req.body;
    const result = await validateCouponService(code, subtotal);
    return res.status(200).json({
      ok: true,
      coupon: {
        code: result.code,
        discountType: result.discountType,
        discountValue: result.discountValue,
        discountAmount: result.discountAmount,
      },
    });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }
}

// ---------------- Admin Controllers ----------------

export async function createCoupon(req, res) {
  try {
    const coupon = await createCouponService(req.body);
    return res.status(201).json({ message: "Tạo mã giảm giá thành công", coupon });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function getAllCoupons(req, res) {
  try {
    const result = await getAllCouponsService(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getCouponById(req, res) {
  try {
    const coupon = await getCouponByIdService(req.params.id);
    return res.status(200).json(coupon);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
}

export async function updateCoupon(req, res) {
  try {
    const coupon = await updateCouponService(req.params.id, req.body);
    return res.status(200).json({ message: "Cập nhật mã giảm giá thành công", coupon });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function deleteCoupon(req, res) {
  try {
    await deleteCouponService(req.params.id);
    return res.status(200).json({ message: "Xóa mã giảm giá thành công" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}
