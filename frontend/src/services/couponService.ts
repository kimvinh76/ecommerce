import api from "@/lib/axios";

export interface CouponValidationResult {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
}

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponPayload {
  code: string;
  description?: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export async function validateCoupon(code: string, subtotal: number) {
  return api
    .post("/coupons/validate", { code, subtotal })
    .then((res) => res.data as { ok: boolean; coupon: CouponValidationResult });
}

// ---------------- Admin Services ----------------

export async function getAllCoupons(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) {
  return api
    .get("/coupons", { params })
    .then((res) => res.data as { data: Coupon[]; pagination: any });
}

export async function getCouponById(id: string) {
  return api.get(`/coupons/${id}`).then((res) => res.data as Coupon);
}

export async function createCoupon(data: CouponPayload) {
  return api.post("/coupons", data).then((res) => res.data as { message: string; coupon: Coupon });
}

export async function updateCoupon(id: string, data: Partial<CouponPayload>) {
  return api.put(`/coupons/${id}`, data).then((res) => res.data as { message: string; coupon: Coupon });
}

export async function deleteCoupon(id: string) {
  return api.delete(`/coupons/${id}`).then((res) => res.data as { message: string });
}
