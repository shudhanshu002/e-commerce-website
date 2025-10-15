import { Router } from 'express';
import {
  createCoupon,
  applyCoupon,
  getAllCoupons,
} from '../controllers/coupon.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- User Route (Protected) ---
router.route('/apply').post(verifyJWT, applyCoupon);

// --- Admin Routes (Protected by isAdmin) ---
router.route('/admin/create').post(verifyJWT, isAdmin, createCoupon);
router.route('/admin/all').get(verifyJWT, isAdmin, getAllCoupons);

export default router;
