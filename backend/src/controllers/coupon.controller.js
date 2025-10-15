import { Coupon } from '../models/coupon.model.js';
import { Cart } from '../models/cart.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// --- ADMIN: Create a new coupon ---
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    minOrderValue,
    validFrom,
    validTo,
    usageLimit,
  } = req.body;

  const existingCoupon = await Coupon.findOne({ code });
  if (existingCoupon)
    throw new ApiError(409, 'Coupon with this code already exists.');

  const coupon = await Coupon.create({
    code,
    discountType,
    discountValue,
    minOrderValue,
    validFrom,
    validTo,
    usageLimit,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, coupon, 'Coupon created successfully.'));
});

// --- USER: Apply coupon to cart ---
const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;
  const userId = req.user._id;

  if (!couponCode) throw new ApiError(400, 'Coupon code is required.');

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

  // 1. Basic Validations
  if (!coupon) throw new ApiError(404, 'Invalid coupon code.');
  if (!coupon.isActive) throw new ApiError(400, 'This coupon is not active.');

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validTo) {
    throw new ApiError(400, 'This coupon has expired or is not yet valid.');
  }
  if (coupon.timesUsed >= coupon.usageLimit) {
    throw new ApiError(400, 'This coupon has reached its usage limit.');
  }

  // 2. Cart Validations
  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0)
    throw new ApiError(400, 'Your cart is empty.');
  if (cart.cartTotal < coupon.minOrderValue) {
    throw new ApiError(
      400,
      `Minimum order value of ${coupon.minOrderValue} is required to use this coupon.`,
    );
  }

  // 3. Calculate Discount
  let discountAmount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = (cart.cartTotal * coupon.discountValue) / 100;
  } else if (coupon.discountType === 'FIXED_AMOUNT') {
    discountAmount = coupon.discountValue;
  }

  // Ensure discount doesn't exceed cart total
  discountAmount = Math.min(discountAmount, cart.cartTotal);

  const finalTotal = cart.cartTotal - discountAmount;

  const response = {
    originalTotal: cart.cartTotal,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    finalTotal: parseFloat(finalTotal.toFixed(2)),
    appliedCoupon: coupon.code,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, response, 'Coupon applied successfully.'));
});

// --- ADMIN: Get all coupons ---
const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({});
  return res
    .status(200)
    .json(new ApiResponse(200, coupons, 'All coupons retrieved.'));
});

export { createCoupon, applyCoupon, getAllCoupons };
