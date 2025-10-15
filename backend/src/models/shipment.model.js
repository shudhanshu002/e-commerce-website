import mongoose, { Schema } from 'mongoose';

const shipmentSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    carrier: {
      type: String,
      required: true,
      trim: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    shippedAt: {
      type: Date,
      default: Date.now,
    },
    // The status here can be more granular if integrating with a real logistics API
    status: {
      type: String,
      enum: ['SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'],
      default: 'SHIPPED',
    },
  },
  { timestamps: true },
);

export const Shipment = mongoose.model('Shipment', shipmentSchema);
