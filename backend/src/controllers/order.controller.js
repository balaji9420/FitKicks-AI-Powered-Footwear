const Order = require("../models/Order.model")
const Product = require("../models/product.model")
const { AppError, asyncHandler } = require("../utils/helpers");

exports.createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
    shippingCost = 0,
    taxAmount = 0
  } = req.body

  if (!items || items.length === 0) {
    throw new AppError("No order items", 400);
  }

  // Optimized: Fetch all products in one query instead of a loop
  const productIds = items.map(item => item.product?._id || item.product);
  const products = await Product.find({ _id: { $in: productIds } });

  const formattedItems = items.map(item => {
    const productId = item.product?._id || item.product;
    const product = products.find(p => p._id.toString() === productId.toString());

    if (!product) {
      throw new AppError(`Product not found: ${productId}`, 404);
    }

    const quantity = item.quantity || 1;

    return {
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || "",
      price: product.price,
      size: item.size || "Default",
      color: item.color || "Black",
      quantity,
      subtotal: product.price * quantity
    };
  });

  const subtotal = formattedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalAmount = subtotal + shippingCost + taxAmount;

  const order = await Order.create({
    user: req.user._id,
    items: formattedItems,
    shippingAddress,
    paymentMethod,
    subtotal,
    shippingCost,
    taxAmount,
    totalAmount,
    paymentStatus:
      paymentMethod === "cod" ? "pending" : "paid"
  })

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    data: {
      order
    }
  })
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
  res.json({ success: true, orders });
});

exports.getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate("user", "firstName lastName").sort("-createdAt");
  res.json({ success: true, orders });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);
  res.json({ success: true, data: { order } });
});

exports.cancelOrder = asyncHandler(async (req, res) => { res.json({ success: true }) });
exports.requestReturn = asyncHandler(async (req, res) => { res.json({ success: true }) });
exports.updateOrderStatus = asyncHandler(async (req, res) => { res.json({ success: true }) });