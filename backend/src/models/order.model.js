import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  // Price at the time of purchase to prevent changes from affecting past orders
  priceAtPurchase: {
    type: Number,
    required: true,
  },
});

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    subTotal: {
        type: Number,
        required: true
    },
    couponUsed: {
        type: Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    orderTotal: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentId: {
      type: String, // Will be populated by our simulated payment system
    },
    paymentProvider: {
      type: String,
      default: 'SIMULATED_GATEWAY',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
  },
  { timestamps: true },
);

orderSchema.plugin(mongooseAggregatePaginate);

export const Order = mongoose.model('Order', orderSchema);
