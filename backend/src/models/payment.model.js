import mongoose, { Schema } from 'mongoose';

const paymentSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    paymentProvider: {
      type: String,
      required: true,
    },
    providerPaymentId: {
      // This would be the ID from Stripe, Razorpay, etc.
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
  },
  { timestamps: true },
);

export const Payment = mongoose.model('Payment', paymentSchema);
