import { Wishlist } from '../models/wishlist.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
    'items.product',
    'title price images',
  );
  if (!wishlist) {
    const newWishlist = await Wishlist.create({
      user: req.user._id,
      items: [],
    });
    return res
      .status(200)
      .json(new ApiResponse(200, newWishlist, 'Wishlist is empty'));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, 'Wishlist fetched successfully'));
});

const toggleWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new ApiError(400, 'Product ID is required');

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id });
  }

  const itemIndex = wishlist.items.findIndex((p) =>
    p.product.equals(productId),
  );
  let message = '';

  if (itemIndex > -1) {
    // Item exists, remove it
    wishlist.items.splice(itemIndex, 1);
    message = 'Item removed from wishlist';
  } else {
    // Item does not exist, add it
    wishlist.items.push({ product: productId });
    message = 'Item added to wishlist';
  }

  await wishlist.save();
  const populatedWishlist = await wishlist.populate(
    'items.product',
    'title price images',
  );
  return res.status(200).json(new ApiResponse(200, populatedWishlist, message));
});

export { getWishlist, toggleWishlistItem };
