import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import productRouter from './product.routes.js';
import cartRouter from './cart.routes.js';
import wishlistRouter from './wishlist.routes.js';
import orderRouter from './order.routes.js'; 
import reviewRouter from './review.routes.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import couponRouter from './coupon.routes.js';

const router = Router();
router.get('/health-check', (_, res) =>
  res
    .status(200)
    .json(new ApiResponse(200, { status: 'OK' }, 'Server is healthy')),
);

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/cart', cartRouter);
router.use('/wishlist', wishlistRouter);
router.use('/orders', orderRouter); 
router.use('/reviews', reviewRouter);
router.use('/coupons', couponRouter);

export default router;
