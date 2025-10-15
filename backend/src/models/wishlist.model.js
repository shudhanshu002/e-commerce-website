import mongoose, { Schema } from 'mongoose';

const wishlistItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
});

const wishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [wishlistItemSchema],
  },
  { timestamps: true },
);

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
