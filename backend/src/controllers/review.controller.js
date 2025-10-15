import { Review } from '../models/review.model.js';
import { Order } from '../models/order.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, body } = req.body;
  const userId = req.user._id;

  // 1. Check if the user has purchased and received the product
  const deliveredOrder = await Order.findOne({
    user: userId,
    'items.product': productId,
    status: 'DELIVERED',
  });

  if (!deliveredOrder) {
    throw new ApiError(
      403,
      'You can only review products you have purchased and received.',
    );
  }

  // 2. Check if the user has already reviewed this product
  const existingReview = await Review.findOne({
    user: userId,
    product: productId,
  });
  if (existingReview) {
    throw new ApiError(
      409,
      'You have already submitted a review for this product.',
    );
  }

  // 3. Create the review
  const review = await Review.create({
    user: userId,
    product: productId,
    rating,
    title,
    body,
  });

  // The post-save hook on the Review model will automatically update the product's average rating.

  return res
    .status(201)
    .json(new ApiResponse(201, review, 'Review submitted successfully.'));
});

const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  // TODO: Add pagination
  const reviews = await Review.find({ product: productId }).populate(
    'user',
    'fullName',
  );

  return res
    .status(200)
    .json(new ApiResponse(200, reviews, 'Reviews fetched successfully.'));
});

const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found.');

  // Check if the user is the owner of the review or an admin
  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'ADMIN'
  ) {
    throw new ApiError(403, 'You are not authorized to delete this review.');
  }

  await review.remove(); // Using .remove() to trigger the post-remove hook

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Review deleted successfully.'));
});

export { createReview, getProductReviews, deleteReview };
