import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  logoutUser,
  googleAuthCallback,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import passport from 'passport';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per window for these sensitive routes
  standardHeaders: true,
  legacyHeaders: false,
  message:
    'Too many requests from this IP for this action, please try again after 15 minutes.',
});

router.use(authLimiter);

// --- Core Auth & Verification ---
router.route('/register').post(registerUser);
router.route('/verify-email').post(verifyEmail);
router.route('/login').post(loginUser);

// --- Protected Routes ---
router.route('/logout').post(verifyJWT, logoutUser);

// --- Google OAuth ---
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  googleAuthCallback,
);

// --- Password Management ---
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').post(resetPassword);

export default router;