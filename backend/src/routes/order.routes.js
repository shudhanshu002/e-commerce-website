import { Router } from 'express';
import {
  createOrderFromCart,
  getMyOrders,
  getOrderById,
  verifyPaymentAndUpdateOrder,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  createShipmentForOrder
} from '../controllers/order.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// All user routes are protected
router.use(verifyJWT);

router.route('/checkout').post(createOrderFromCart);
router.route('/').get(getMyOrders);
router.route('/:orderId').get(getOrderById);

// This is our simulated webhook to confirm payment
router.route('/payment/verify/:orderId').post(verifyPaymentAndUpdateOrder);

// --- ADMIN ROUTES ---
router.route('/admin/all').get(isAdmin, getAllOrdersAdmin);
router.route('/admin/status/:orderId').patch(isAdmin, updateOrderStatusAdmin);
router.route('/admin/ship/:orderId').post(isAdmin, createShipmentForOrder);

export default router;
