import { Router } from 'express';
import {
  createProduct,
  getProductBySlug,
  searchProducts,
  createCategory,
  getAllCategories,
} from '../controllers/product.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Public Routes ---
router.route('/').get(searchProducts);
router.route('/category/all').get(getAllCategories);
router.route('/:slug').get(getProductBySlug);

// --- Admin Only Routes ---
router.route('/admin/create').post(verifyJWT, isAdmin, createProduct);
router.route('/admin/category/create').post(verifyJWT, isAdmin, createCategory);

export default router;
