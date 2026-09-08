import express from "express";
import { auth } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/authorize.js";
import {
  validateCoupon,
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
} from "../controllers/CouponController.js";

const router = express.Router();

// Public / Customer endpoint
router.post("/validate", auth, validateCoupon);

// Admin endpoints
router.get("/", auth, authorizeRoles("admin"), getAllCoupons);
router.post("/", auth, authorizeRoles("admin"), createCoupon);
router.get("/:id", auth, authorizeRoles("admin"), getCouponById);
router.put("/:id", auth, authorizeRoles("admin"), updateCoupon);
router.delete("/:id", auth, authorizeRoles("admin"), deleteCoupon);

export default router;
