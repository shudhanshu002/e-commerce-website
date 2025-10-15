import mongoose from 'mongoose';
import { Cart } from '../models/cart.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { Address } from '../models/address.model.js';
import { Payment } from '../models/payment.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Shipment } from '../models/shipment.model.js';
import { Coupon } from '../models/coupon.model.js';
import sendEmail from '../utils/email.js';

// const createOrderFromCart = asyncHandler(async (req, res) => {
//   const { addressId, couponCode } = req.body;
//   if (!addressId) throw new ApiError(400, 'Shipping address ID is required');

//   const userId = req.user._id;

//   // 1. Validate Address
//   const address = await Address.findOne({ _id: addressId, user: userId });
//   if (!address)
//     throw new ApiError(404, 'Address not found or does not belong to user');

//   // 2. Get User's Cart
//   const cart = await Cart.findOne({ user: userId });
//   if (!cart || cart.items.length === 0)
//     throw new ApiError(400, 'Cart is empty');

//   let finalTotal = cart.cartTotal;
//   let discountAmount = 0;
//   let appliedCoupon = null;

//   if (couponCode) {
//     const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
//     // Re-validate the coupon at the time of order creation
//     if (
//       !coupon ||
//       !coupon.isActive ||
//       new Date() < coupon.validFrom ||
//       new Date() > coupon.validTo ||
//       coupon.timesUsed >= coupon.usageLimit ||
//       cart.cartTotal < coupon.minOrderValue
//     ) {
//       throw new ApiError(
//         400,
//         'The provided coupon is invalid or cannot be applied to this order.',
//       );
//     }

//     appliedCoupon = coupon;
//     if (coupon.discountType === 'PERCENTAGE') {
//       discountAmount = (cart.cartTotal * coupon.discountValue) / 100;
//     } else {
//       discountAmount = coupon.discountValue;
//     }
//     finalTotal = Math.max(0, cart.cartTotal - discountAmount);
//   }
//   // --- END COUPON LOGIC ---

//   // 3. Check for sufficient stock for all items
//   for (const item of cart.items) {
//     const product = await Product.findById(item.product);
//     if (!product)
//       throw new ApiError(404, `Product with ID ${item.product} not found`);
//     if (product.stock < item.quantity) {
//       throw new ApiError(
//         400,
//         `Not enough stock for ${product.title}. Available: ${product.stock}, Requested: ${item.quantity}`,
//       );
//     }
//   }

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const orderItems = cart.items.map((item) => ({
//       product: item.product,
//       quantity: item.quantity,
//       priceAtPurchase: item.price,
//     }));

//     const order = (
//       await Order.create(
//         [
//           {
//             user: userId,
//             items: orderItems,
//             shippingAddress: addressId,
//             subTotal: cart.cartTotal,
//             couponUsed: appliedCoupon ? appliedCoupon._id : null,
//             discountAmount,
//             orderTotal: finalTotal,
//           },
//         ],
//         { session },
//       )
//     )[0];

//     // If a coupon was used, increment its usage count
//     if (appliedCoupon) {
//       appliedCoupon.timesUsed += 1;
//       await appliedCoupon.save({ session });
//     }

//     cart.items = [];
//     cart.cartTotal = 0;
//     await cart.save({ session });

//     await Payment.create([{ order: order._id, amount: order.orderTotal }], {
//       session,
//     });

//     await session.commitTransaction();

//     return res
//       .status(201)
//       .json(
//         new ApiResponse(
//           201,
//           order,
//           'Order placed successfully. Please complete payment.',
//         ),
//       );
//   } catch (error) {
//     await session.abortTransaction();
//     throw new ApiError(500, 'Unable to place order. Please try again.');
//   } finally {
//     session.endSession();
//   }
// });


const createOrderFromCart = asyncHandler(async (req, res) => {
  const { addressId, couponCode } = req.body;
  if (!addressId) throw new ApiError(400, 'Shipping address ID is required');

  const userId = req.user._id;
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) throw new ApiError(404, 'Address not found for this user');

  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0)
    throw new ApiError(400, 'Your cart is empty');

  // Coupon Validation Logic...
  let finalTotal = cart.cartTotal;
  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (
      !coupon ||
      !coupon.isActive ||
      new Date() < coupon.validFrom ||
      new Date() > coupon.validTo ||
      coupon.timesUsed >= coupon.usageLimit ||
      cart.cartTotal < coupon.minOrderValue
    ) {
      throw new ApiError(
        400,
        'The provided coupon is invalid or cannot be applied.',
      );
    }

    appliedCoupon = coupon;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (cart.cartTotal * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }
    finalTotal = Math.max(0, cart.cartTotal - discountAmount);
  }

  // Stock Validation...
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product || product.stock < item.quantity) {
      throw new ApiError(
        400,
        `One or more items in your cart are out of stock. Please review your cart.`,
      );
    }
  }

  // Database Transaction...
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderItems = cart.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      priceAtPurchase: item.price,
    }));

    const order = (
      await Order.create(
        [
          {
            user: userId,
            items: orderItems,
            shippingAddress: addressId,
            subTotal: cart.cartTotal,
            couponUsed: appliedCoupon ? appliedCoupon._id : null,
            discountAmount,
            orderTotal: finalTotal,
          },
        ],
        { session },
      )
    )[0];

    if (appliedCoupon) {
      appliedCoupon.timesUsed += 1;
      await appliedCoupon.save({ session });
    }

    cart.items = [];
    cart.cartTotal = 0;
    await cart.save({ session });

    // --- THIS IS THE CORRECTED LINE ---
    await Payment.create(
      [
        {
          order: order._id,
          amount: order.orderTotal,
          paymentProvider: 'SIMULATED_GATEWAY', // We now provide the required field
        },
      ],
      { session },
    );
    // --- END OF FIX ---

    await session.commitTransaction();

    res.locals.createdObject = order;

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          order,
          'Order placed successfully. Please complete payment.',
        ),
      );
  } catch (error) {
    await session.abortTransaction();
    console.error('--- CHECKOUT TRANSACTION FAILED ---');
    console.error(error);
    throw new ApiError(500, 'Unable to place order. Please try again.');
  } finally {
    session.endSession();
  }
});

// SIMULATED PAYMENT WEBHOOK
const verifyPaymentAndUpdateOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.paymentStatus === 'COMPLETED')
      throw new ApiError(
        400,
        'Payment has already been completed for this order.',
      );

    // Update Order and Payment status
    order.paymentStatus = 'COMPLETED';
    order.status = 'PROCESSING';
    await order.save({ session });
    await Payment.updateOne(
      { order: orderId },
      { status: 'SUCCESS', providerPaymentId: `sim_${Date.now()}` },
    ).session(session);

    // Decrement product stock
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: -item.quantity } },
      ).session(session);
    }

    await session.commitTransaction();
    session.endSession();

    // TODO: Send order confirmation email here
    const confirmedOrder = await Order.findById(orderId).populate(
      'user',
      'fullName email',
    );
    try {
      await sendEmail({
        email: confirmedOrder.user.email,
        subject: `Order Confirmed - #${orderId}`,
        html: `<h1>Thank You!</h1><p>Your order #${orderId} has been confirmed and is now being processed.</p>`,
      });
    } catch (emailError) {
      console.error(
        `Failed to send confirmation email for order ${orderId}:`,
        emailError,
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { orderId: order._id, status: 'SUCCESS' },
          'Payment verified and order confirmed.',
        ),
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(
      500,
      error?.message || 'Payment verification failed. Please try again.',
    );
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('items.product', 'title images')
    .populate('shippingAddress')
    .sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, orders, 'Orders retrieved successfully'));
});

const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId, user: req.user._id })
    .populate('items.product', 'title brand description images')
    .populate('shippingAddress');

  if (!order) throw new ApiError(404, 'Order not found');
  return res
    .status(200)
    .json(new ApiResponse(200, order, 'Order details retrieved'));
});

// --- ADMIN ROUTES ---
const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  // TODO: Add pagination
  const orders = await Order.find({})
    .populate('user', 'fullName email')
    .sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, orders, 'All orders retrieved'));
});

const updateOrderStatusAdmin = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  if (!['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
    throw new ApiError(400, 'Invalid status update');
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true },
  );
  if (!order) throw new ApiError(404, 'Order not found');

  // TODO: Send status update notification to user

  return res
    .status(200)
    .json(new ApiResponse(200, order, 'Order status updated'));
});

const createShipmentForOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { carrier, trackingNumber } = req.body;

  if (!carrier || !trackingNumber) {
    throw new ApiError(400, 'Carrier and tracking number are required.');
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found.');
  if (order.status !== 'PROCESSING') {
    throw new ApiError(
      400,
      `Order cannot be shipped. Current status: ${order.status}`,
    );
  }

  // Check if a shipment already exists for this order
  const existingShipment = await Shipment.findOne({ order: orderId });
  if (existingShipment) {
    throw new ApiError(409, 'A shipment already exists for this order.');
  }

  // Create shipment and update order status in a transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const shipment = (
      await Shipment.create([{ order: orderId, carrier, trackingNumber }], {
        session,
      })
    )[0];

    order.status = 'SHIPPED';
    await order.save({ session });

    await session.commitTransaction();

    const shippedOrder = await Order.findById(orderId).populate(
      'user',
      'fullName email',
    );
    try {
      await sendEmail({
        email: shippedOrder.user.email,
        subject: `Your Order #${orderId} has Shipped!`,
        html: `<h1>On Its Way!</h1><p>Your order #${orderId} has been shipped via ${carrier}.</p><p>Tracking Number: <strong>${trackingNumber}</strong></p>`,
      });
    } catch (emailError) {
      console.error(
        `Failed to send shipping email for order ${orderId}:`,
        emailError,
      );
    }

    session.endSession();

    // TODO: Send shipping notification email to user with tracking details

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { order, shipment },
          'Shipment created and order status updated.',
        ),
      );
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(500, 'Failed to create shipment. Please try again.');
  } finally {
    session.endSession();
  }
});

export {
  createOrderFromCart,
  getMyOrders,
  getOrderById,
  verifyPaymentAndUpdateOrder,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  createShipmentForOrder,
};
