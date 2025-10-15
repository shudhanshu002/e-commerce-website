import { Router } from 'express';
import {
  createReview,
  getProductReviews,
  deleteReview,
} from '../controllers/review.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Public Route ---
router.route('/product/:productId').get(getProductReviews);

// --- Protected Routes (require login) ---
router.use(verifyJWT);

router.route('/product/:productId').post(createReview);
router.route('/:reviewId').delete(deleteReview);

export default router;
