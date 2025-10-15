import mongoose, { Schema } from 'mongoose';

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      // Total number of times this coupon can be used
      type: Number,
      default: 1,
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const Coupon = mongoose.model('Coupon', couponSchema);
