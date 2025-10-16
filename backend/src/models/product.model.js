import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { Review } from './review.model.js';

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String, required: true }],
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Admin/Seller
    isActive: { type: Boolean, default: true },

    averageRating: {
      type: Number,
      default: 0,
    },
    numberOfReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);


productSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await Review.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: '$product',
        numberOfReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await this.findByIdAndUpdate(productId, {
        numberOfReviews: stats[0].numberOfReviews,
        averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to one decimal place
      });
    } else {
      await this.findByIdAndUpdate(productId, {
        numberOfReviews: 0,
        averageRating: 0,
      });
    }
  } catch (error) {
    console.error('Error updating average rating:', error);
  }
};

productSchema.index({
    title: 'text',
    description: 'text',
    brand: 'text'
});


productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model('Product', productSchema);
