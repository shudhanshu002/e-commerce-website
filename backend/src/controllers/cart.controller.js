import { Cart } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'title price images stock',
  );
  if (!cart) {
    // If no cart, create one for the user
    const newCart = await Cart.create({
      user: req.user._id,
      items: [],
      cartTotal: 0,
    });
    return res.status(200).json(new ApiResponse(200, newCart, 'Cart is empty'));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, cart, 'Cart fetched successfully'));
});

const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) throw new ApiError(400, 'Product ID is required');

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < quantity)
    throw new ApiError(400, 'Not enough stock available');

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id });
  }

  const itemIndex = cart.items.findIndex((p) => p.product.equals(productId));

  if (itemIndex > -1) {
    // Product exists in cart, update quantity
    cart.items[itemIndex].quantity += quantity;
  } else {
    // Product does not exist in cart, add new item
    cart.items.push({ product: productId, quantity, price: product.price });
  }

  // Recalculate cart total
  cart.cartTotal = cart.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0,
  );
  await cart.save();

  const populatedCart = await cart.populate(
    'items.product',
    'title price images stock',
  );
  return res
    .status(200)
    .json(new ApiResponse(200, populatedCart, 'Item added to cart'));
});

const updateItemQuantity = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity < 1) {
    throw new ApiError(400, 'Product ID and a valid quantity are required');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  const itemIndex = cart.items.findIndex((p) => p.product.equals(productId));
  if (itemIndex === -1) throw new ApiError(404, 'Item not found in cart');

  cart.items[itemIndex].quantity = quantity;
  cart.cartTotal = cart.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0,
  );
  await cart.save();

  const populatedCart = await cart.populate(
    'items.product',
    'title price images stock',
  );
  return res
    .status(200)
    .json(new ApiResponse(200, populatedCart, 'Cart updated'));
});

const removeItemFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new ApiError(400, 'Invalid Product ID');

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { items: { product: productId } } },
    { new: true },
  );

  if (!cart) throw new ApiError(404, 'Cart not found');

  cart.cartTotal = cart.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0,
  );
  await cart.save();

  const populatedCart = await cart.populate(
    'items.product',
    'title price images stock',
  );
  return res
    .status(200)
    .json(new ApiResponse(200, populatedCart, 'Item removed from cart'));
});

export { getCart, addItemToCart, updateItemQuantity, removeItemFromCart };
