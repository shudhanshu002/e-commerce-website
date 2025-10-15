import { Router } from 'express';
import {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
} from '../controllers/cart.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes are protected
router.use(verifyJWT);

router.route('/').get(getCart);
router.route('/add').post(addItemToCart);
router.route('/update').put(updateItemQuantity);
router.route('/remove/:productId').delete(removeItemFromCart);

export default router;
