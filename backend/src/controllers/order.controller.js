const Order = require("../models/Order.model");
const { Cart, Coupon } = require("../models/index.models");
const Product = require("../models/Product.model");
const User = require("../models/User.model");
const { AppError, asyncHandler } = require("../utils/helpers");
const { sendEmail } = require("../services/email.service");

exports.createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, couponCode, loyaltyPointsToUse, items } = req.body;
  const userId = req.user._id;
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) throw new AppError(`Product ${item.product} not found`, 404);
    const color = product.colors.find(c => c.name === item.color);
    const sizeVar = color?.sizeStock.find(s => s.size === item.size);
    if (!sizeVar || sizeVar.stock < item.quantity) throw new AppError(`${product.name} (${item.size}) out of stock`, 400);
    const sub = product.price * item.quantity;
    subtotal += sub;
    validatedItems.push({ product: product._id, name: product.name, image: product.images[0]?.url||"", price: product.price, size: item.size, color: item.color, quantity: item.quantity, sku: sizeVar.sku||"", subtotal: sub });
  }

  const shippingCost = subtotal >= 999 ? 0 : 99;
  const taxAmount = Math.round(subtotal * 0.18);
  let couponDiscount = 0; let couponId = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && coupon.endDate > new Date() && subtotal >= coupon.minOrderAmount) {
      if (coupon.type === "percentage") couponDiscount = Math.min(subtotal*coupon.value/100, coupon.maxDiscountAmount||Infinity);
      else if (coupon.type === "fixed") couponDiscount = Math.min(coupon.value, subtotal);
      else if (coupon.type === "free_shipping") couponDiscount = shippingCost;
      couponId = coupon._id;
    }
  }

  const user = await User.findById(userId);
  let loyaltyDiscount = 0; let pointsUsed = 0;
  if (loyaltyPointsToUse && user.loyaltyPoints >= loyaltyPointsToUse) {
    pointsUsed = Math.min(loyaltyPointsToUse, 500);
    loyaltyDiscount = pointsUsed;
  }

  const totalAmount = Math.max(0, subtotal + shippingCost + taxAmount - couponDiscount - loyaltyDiscount);

  const order = await Order.create({
    user: userId, items: validatedItems, shippingAddress,
    subtotal, shippingCost: couponDiscount===shippingCost?0:shippingCost, taxAmount, taxRate: 0.18,
    couponDiscount: Math.round(couponDiscount), couponCode: couponCode?.toUpperCase(), couponId,
    loyaltyPointsUsed: pointsUsed, loyaltyPointsDiscount: loyaltyDiscount, totalAmount,
    paymentMethod, paymentStatus: "pending", status: "pending",
  });

  for (const item of validatedItems) {
    await Product.updateOne(
      { _id: item.product, "colors.name": item.color, "colors.sizeStock.size": item.size },
      { $inc: { "colors.$[c].sizeStock.$[s].stock": -item.quantity, totalSold: item.quantity } },
      { arrayFilters: [{ "c.name": item.color }, { "s.size": item.size }] }
    );
  }

  const earned = Math.floor(totalAmount / 100);
  await User.findByIdAndUpdate(userId, { $inc: { totalOrders: 1, totalSpent: totalAmount, loyaltyPoints: -pointsUsed+earned } });
  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

  sendEmail({ to: user.email, template: "orderConfirmation", data: { name: user.firstName, orderNumber: order.orderNumber, totalAmount } }).catch(console.error);

  const populated = await Order.findById(order._id).populate("items.product","name images slug");
  res.status(201).json({ success: true, message: "Order placed successfully!", data: { order: populated, earnedPoints: earned } });
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const { page=1, limit=10, status } = req.query;
  const q = { user: req.user._id };
  if (status) q.status = status;
  const [orders, total] = await Promise.all([
    Order.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit).populate("items.product","name images slug").lean(),
    Order.countDocuments(q),
  ]);
  res.json({ success: true, data: { orders, pagination: { total, page: +page, pages: Math.ceil(total/limit) } } });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate("items.product","name images slug brand");
  if (!order) throw new AppError("Order not found", 404);
  res.json({ success: true, data: { order } });
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new AppError("Order not found", 404);
  if (!["pending","confirmed","processing"].includes(order.status)) throw new AppError("Cannot cancel at this stage", 400);
  order.status = "cancelled"; order.cancelReason = req.body.reason; order.cancelledBy = req.user._id;
  for (const item of order.items) {
    await Product.updateOne({ _id: item.product, "colors.name": item.color, "colors.sizeStock.size": item.size }, { $inc: { "colors.$[c].sizeStock.$[s].stock": item.quantity } }, { arrayFilters: [{"c.name":item.color},{"s.size":item.size}] });
  }
  await order.save();
  res.json({ success: true, message: "Order cancelled", data: { order } });
});

exports.requestReturn = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new AppError("Order not found", 404);
  if (order.status !== "delivered") throw new AppError("Only delivered orders can be returned", 400);
  if ((Date.now() - order.actualDelivery) / (1000*60*60*24) > 7) throw new AppError("Return window expired", 400);
  order.status = "return_requested"; order.returnReason = req.body.reason; order.returnRequestedAt = new Date();
  await order.save();
  res.json({ success: true, message: "Return requested", data: { order } });
});

exports.getAllOrders = asyncHandler(async (req, res) => {
  const { page=1, limit=20, status, search } = req.query;
  const q = {};
  if (status) q.status = status;
  if (search) q.orderNumber = { $regex: search, $options: "i" };
  const [orders, total] = await Promise.all([
    Order.find(q).populate("user","firstName lastName email").populate("items.product","name images").sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit).lean(),
    Order.countDocuments(q),
  ]);
  res.json({ success: true, data: { orders, pagination: { total, page: +page, pages: Math.ceil(total/limit) } } });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber, trackingUrl, shippingPartner, message } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);
  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;
  if (shippingPartner) order.shippingPartner = shippingPartner;
  if (status === "delivered") order.actualDelivery = new Date();
  order.trackingHistory.push({ status, message: message || `Order ${status.replace(/_/g," ")}`, timestamp: new Date(), updatedBy: req.user._id });
  await order.save();
  const user = await User.findById(order.user);
  if (user) sendEmail({ to: user.email, template: "orderStatusUpdate", data: { name: user.firstName, orderNumber: order.orderNumber, status } }).catch(console.error);
  res.json({ success: true, message: "Status updated", data: { order } });
});
