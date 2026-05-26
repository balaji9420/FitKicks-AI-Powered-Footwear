const express = require("express");
const { protect, adminOnly, optionalAuth } = require("../middlewares/auth.middleware");
const { asyncHandler, AppError } = require("../utils/helpers");
const { Cart, Wishlist, Review, Category, Brand, Coupon, Notification } = require("../models/index.models");
const Product = require("../models/Product.model");
const User = require("../models/User.model");
const Order = require("../models/Order.model");

// ── Cart ─────────────────────────────────────────────────────────────────────
const cartRouter = express.Router();
cartRouter.use(protect);

cartRouter.get("/", asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate({ path: "items.product", select: "name price images isInStock slug brand", populate: { path: "brand", select: "name" } });
  res.json({ success: true, data: { cart: cart || { items: [], savedItems: [] } } });
}));

cartRouter.post("/add", asyncHandler(async (req, res) => {
  const { productId, size, color, quantity=1 } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new AppError("Product not found", 404);
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });
  const idx = cart.items.findIndex(i => i.product.toString()===productId && i.size===size && i.color===color);
  if (idx >= 0) cart.items[idx].quantity = Math.min(cart.items[idx].quantity+quantity, 10);
  else cart.items.push({ product: productId, size, color, quantity, price: product.price });
  cart.lastUpdated = new Date();
  await cart.save();
  await cart.populate({ path: "items.product", select: "name price images isInStock slug" });
  res.json({ success: true, message: "Added to cart", data: { cart } });
}));

cartRouter.patch("/update/:itemId", asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new AppError("Cart not found", 404);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new AppError("Item not found", 404);
  if (quantity <= 0) cart.items.pull(req.params.itemId);
  else item.quantity = Math.min(quantity, 10);
  await cart.save();
  res.json({ success: true, data: { cart } });
}));

cartRouter.delete("/remove/:itemId", asyncHandler(async (req, res) => {
  const cart = await Cart.findOneAndUpdate({ user: req.user._id }, { $pull: { items: { _id: req.params.itemId } } }, { new: true });
  res.json({ success: true, data: { cart } });
}));

cartRouter.post("/clear", asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });
  res.json({ success: true, message: "Cart cleared" });
}));

cartRouter.post("/apply-coupon", asyncHandler(async (req, res) => {
  const { code } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon || coupon.endDate < new Date()) throw new AppError("Invalid coupon", 400);
  const cart = await Cart.findOne({ user: req.user._id });
  const subtotal = (cart?.items || []).reduce((sum, i) => sum + i.price * i.quantity, 0);
  if (subtotal < coupon.minOrderAmount) throw new AppError(`Min order ₹${coupon.minOrderAmount} required`, 400);
  let discount = 0;
  if (coupon.type === "percentage") discount = Math.min(subtotal*coupon.value/100, coupon.maxDiscountAmount||Infinity);
  else if (coupon.type === "fixed") discount = Math.min(coupon.value, subtotal);
  if (cart) { cart.couponCode = coupon.code; cart.couponId = coupon._id; cart.couponDiscount = Math.round(discount); await cart.save(); }
  res.json({ success: true, message: `Coupon applied! Save ₹${Math.round(discount)}`, data: { discount: Math.round(discount) } });
}));

// ── Wishlist ──────────────────────────────────────────────────────────────────
const wishlistRouter = express.Router();
wishlistRouter.use(protect);
wishlistRouter.get("/", asyncHandler(async (req, res) => {
  const wl = await Wishlist.findOne({ user: req.user._id }).populate({ path: "products.product", select: "name price comparePrice images averageRating isInStock slug" });
  res.json({ success: true, data: { wishlist: wl || { products: [] } } });
}));
wishlistRouter.post("/toggle", asyncHandler(async (req, res) => {
  const { productId } = req.body;
  let wl = await Wishlist.findOne({ user: req.user._id });
  if (!wl) wl = new Wishlist({ user: req.user._id, products: [] });
  const idx = wl.products.findIndex(p => p.product?.toString()===productId);
  let added;
  if (idx >= 0) { wl.products.splice(idx, 1); added = false; }
  else { wl.products.push({ product: productId }); added = true; }
  await wl.save();
  res.json({ success: true, message: added ? "Added to wishlist" : "Removed from wishlist", data: { added } });
}));

// ── Reviews ───────────────────────────────────────────────────────────────────
const reviewRouter = express.Router();
reviewRouter.get("/product/:productId", asyncHandler(async (req, res) => {
  const { page=1, limit=10 } = req.query;
  const [reviews, total] = await Promise.all([
    Review.find({ product: req.params.productId, isApproved: true, isHidden: false }).populate("user","firstName lastName avatar").sort("-createdAt").skip((page-1)*limit).limit(+limit).lean(),
    Review.countDocuments({ product: req.params.productId, isApproved: true }),
  ]);
  res.json({ success: true, data: { reviews, pagination: { total, page: +page, pages: Math.ceil(total/limit) } } });
}));
reviewRouter.post("/", protect, asyncHandler(async (req, res) => {
  const { product, rating, title, comment, size, fit, comfort, durability, style, value } = req.body;
  if (await Review.findOne({ product, user: req.user._id })) throw new AppError("Already reviewed", 409);
  const review = await Review.create({ product, user: req.user._id, rating, title, comment, size, fit, comfort, durability, style, value });
  const stats = await Review.aggregate([{ $match: { product: review.product } }, { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } }]);
  if (stats[0]) await Product.findByIdAndUpdate(product, { averageRating: Math.round(stats[0].avg*10)/10, totalReviews: stats[0].count });
  await review.populate("user","firstName lastName avatar");
  res.status(201).json({ success: true, data: { review } });
}));

// ── Categories ────────────────────────────────────────────────────────────────
const categoryRouter = express.Router();
categoryRouter.get("/", asyncHandler(async (req, res) => { const cats = await Category.find({ isActive: true }).sort({ displayOrder: 1 }).lean(); res.json({ success: true, data: { categories: cats } }); }));
categoryRouter.post("/", protect, adminOnly, asyncHandler(async (req, res) => { const cat = await Category.create(req.body); res.status(201).json({ success: true, data: { category: cat } }); }));
categoryRouter.put("/:id", protect, adminOnly, asyncHandler(async (req, res) => { const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, data: { category: cat } }); }));
categoryRouter.delete("/:id", protect, adminOnly, asyncHandler(async (req, res) => { await Category.findByIdAndUpdate(req.params.id, { isActive: false }); res.json({ success: true, message: "Category deactivated" }); }));

// ── Brands ────────────────────────────────────────────────────────────────────
const brandRouter = express.Router();
brandRouter.get("/", asyncHandler(async (req, res) => { const brands = await Brand.find({ isActive: true }).sort({ displayOrder: 1 }).lean(); res.json({ success: true, data: { brands } }); }));
brandRouter.post("/", protect, adminOnly, asyncHandler(async (req, res) => { const b = await Brand.create(req.body); res.status(201).json({ success: true, data: { brand: b } }); }));
brandRouter.put("/:id", protect, adminOnly, asyncHandler(async (req, res) => { const b = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, data: { brand: b } }); }));

// ── Coupons ───────────────────────────────────────────────────────────────────
const couponRouter = express.Router();
couponRouter.get("/validate/:code", protect, asyncHandler(async (req, res) => {
  const c = await Coupon.findOne({ code: req.params.code.toUpperCase(), isActive: true });
  if (!c || c.endDate < new Date()) throw new AppError("Invalid or expired coupon", 400);
  res.json({ success: true, data: { coupon: { code: c.code, type: c.type, value: c.value, minOrderAmount: c.minOrderAmount } } });
}));
couponRouter.get("/admin/all", protect, adminOnly, asyncHandler(async (req, res) => { const coupons = await Coupon.find().sort({ createdAt: -1 }); res.json({ success: true, data: { coupons } }); }));
couponRouter.post("/", protect, adminOnly, asyncHandler(async (req, res) => { const c = await Coupon.create({ ...req.body, createdBy: req.user._id }); res.status(201).json({ success: true, data: { coupon: c } }); }));
couponRouter.put("/:id", protect, adminOnly, asyncHandler(async (req, res) => { const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, data: { coupon: c } }); }));
couponRouter.delete("/:id", protect, adminOnly, asyncHandler(async (req, res) => { await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }); res.json({ success: true, message: "Coupon deactivated" }); }));

// ── Notifications ─────────────────────────────────────────────────────────────
const notifRouter = express.Router();
notifRouter.use(protect);
notifRouter.get("/", asyncHandler(async (req, res) => { const notifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20).lean(); res.json({ success: true, data: { notifications: notifs } }); }));
notifRouter.patch("/read-all", asyncHandler(async (req, res) => { await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true, readAt: new Date() }); res.json({ success: true }); }));

// ── Analytics (Admin) ─────────────────────────────────────────────────────────
const analyticsRouter = express.Router();
analyticsRouter.use(protect, adminOnly);
analyticsRouter.get("/dashboard", asyncHandler(async (req, res) => {
  const { days=30 } = req.query;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [totalRevenue, totalOrders, pendingOrders, newUsers, revenueByDay, topProducts, ordersByStatus, lowStock] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: "paid", createdAt: { $gte: since } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    Order.countDocuments({ createdAt: { $gte: since } }),
    Order.countDocuments({ status: "pending" }),
    User.countDocuments({ createdAt: { $gte: since }, role: "customer" }),
    Order.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: since } } }, { $unwind: "$items" }, { $group: { _id: "$items.product", totalSold: { $sum: "$items.quantity" }, revenue: { $sum: "$items.subtotal" } } }, { $sort: { totalSold: -1 } }, { $limit: 10 }, { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } }, { $unwind: "$product" }, { $project: { "product.name": 1, "product.images": { $slice: ["$product.images", 1] }, totalSold: 1, revenue: 1 } }]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Product.find({ isActive: true, totalStock: { $lt: 10 } }).select("name totalStock images").limit(10).lean(),
  ]);
  res.json({ success: true, data: { summary: { totalRevenue: totalRevenue[0]?.total||0, totalOrders, pendingOrders, newUsers }, revenueByDay, topProducts, ordersByStatus, lowStockProducts: lowStock } });
}));

// ── Upload ────────────────────────────────────────────────────────────────────
const uploadRouter = express.Router();
const { uploadAvatar } = require("../config/cloudinary");
uploadRouter.post("/avatar", protect, uploadAvatar.single("avatar"), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("No image uploaded", 400);
  await User.findByIdAndUpdate(req.user._id, { avatar: { url: req.file.path, publicId: req.file.filename } });
  res.json({ success: true, data: { url: req.file.path } });
}));

// ── Payment ───────────────────────────────────────────────────────────────────
const paymentRouter = express.Router();
paymentRouter.use(protect);
paymentRouter.post("/create-razorpay-order", asyncHandler(async (req, res) => {
  const Razorpay = require("razorpay");
  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  const order = await razorpay.orders.create({ amount: req.body.amount * 100, currency: "INR", receipt: `fk_${Date.now()}` });
  res.json({ success: true, data: { order, key: process.env.RAZORPAY_KEY_ID } });
}));
paymentRouter.post("/verify-razorpay", asyncHandler(async (req, res) => {
  const crypto = require("crypto");
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  if (hmac.digest("hex") !== razorpay_signature) throw new AppError("Payment verification failed", 400);
  res.json({ success: true, message: "Payment verified", data: { paymentId: razorpay_payment_id } });
}));

// ── Admin ─────────────────────────────────────────────────────────────────────
const adminRouter = express.Router();
adminRouter.use(protect, adminOnly);
adminRouter.get("/stats", asyncHandler(async (req, res) => { res.json({ success: true, message: "Use /analytics/dashboard" }); }));

module.exports = { cartRouter, wishlistRouter, reviewRouter, categoryRouter, brandRouter, couponRouter, notifRouter, analyticsRouter, uploadRouter, paymentRouter, adminRouter };
