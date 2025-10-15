import mongoose, { Schema } from 'mongoose';

const cartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity can not be less than 1.'],
    default: 1,
  },
  price: {
    // Storing price at the time of adding to handle price fluctuations
    type: Number,
    required: true,
  },
});

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Each user has only one cart
    },
    items: [cartItemSchema],
    cartTotal: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const Cart = mongoose.model('Cart', cartSchema);
