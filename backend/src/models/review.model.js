import mongoose, { Schema } from 'mongoose';

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    body: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true },
);

// Hook to trigger the calculation after a review is saved
reviewSchema.post('save', async function () {
  // 'this.constructor' refers to the Review model
  // We need to access the Product model statically
  await mongoose.model('Product').calculateAverageRating(this.product);
});

// Hook to trigger calculation after a review is removed
reviewSchema.post('remove', async function () {
  await mongoose.model('Product').calculateAverageRating(this.product);
});

// Ensure a user can only review a product once
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
