const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  image: { url: String, publicId: String },
  icon: String, isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  totalProducts: { type: Number, default: 0 },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
}, { timestamps: true });

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  logo: { url: String, publicId: String },
  website: String, country: String,
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  totalProducts: { type: Number, default: 0 },
  displayOrder: { type: Number, default: 0 },
  tags: [String],
}, { timestamps: true });

const cartItemSchema = new mongoose.Schema({
  product:    { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  size:       { type: String, required: true },
  color:      String,
  quantity:   { type: Number, required: true, min: 1, max: 10 },
  price:      { type: Number, required: true },
  savedForLater: { type: Boolean, default: false },
  addedAt:    { type: Date, default: Date.now },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  items:         [cartItemSchema],
  savedItems:    [cartItemSchema],
  couponCode:    String,
  couponId:      { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
  couponDiscount:{ type: Number, default: 0 },
  lastUpdated:   { type: Date, default: Date.now },
}, { timestamps: true });

const wishlistSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  products: [{
    product:          { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    addedAt:          { type: Date, default: Date.now },
    notifyOnDiscount: { type: Boolean, default: false },
    notifyOnRestock:  { type: Boolean, default: false },
  }],
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  user:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
  order:   { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  title:   { type: String, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 1000 },
  images:  [{ url: String, publicId: String }],
  verified: { type: Boolean, default: false },
  helpful:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  helpfulCount: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isHidden:   { type: Boolean, default: false },
  size: String,
  fit:  { type: String, enum: ["runs_small","true_to_size","runs_large"] },
  comfort: { type: Number, min:1, max:5 }, durability: { type: Number, min:1, max:5 },
  style:   { type: Number, min:1, max:5 }, value:    { type: Number, min:1, max:5 },
  adminReply: { text: String, repliedAt: Date, repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } },
}, { timestamps: true });
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const couponSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,
  type:        { type: String, enum: ["percentage","fixed","free_shipping","buy_x_get_y"], required: true },
  value:       { type: Number, required: true, min: 0 },
  maxDiscountAmount: Number,
  minOrderAmount:    { type: Number, default: 0 },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  usageLimit:  Number,
  usageCount:  { type: Number, default: 0 },
  perUserLimit:{ type: Number, default: 1 },
  isActive:    { type: Boolean, default: true },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  applicableProducts:   [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  applicableBrands:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
  isPublic:    { type: Boolean, default: true },
  isFestive:   { type: Boolean, default: false },
  festival:    String,
  usedBy:      [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, usedAt: Date }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type:      { type: String, enum: ["order_update","promo","restock","price_drop","review_reply","loyalty","referral","system"], required: true },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  data:      mongoose.Schema.Types.Mixed,
  isRead:    { type: Boolean, default: false },
  readAt:    Date,
  actionUrl: String, imageUrl: String, expiresAt: Date,
}, { timestamps: true });

module.exports = {
  Category:     mongoose.model("Category",     categorySchema),
  Brand:        mongoose.model("Brand",        brandSchema),
  Cart:         mongoose.model("Cart",         cartSchema),
  Wishlist:     mongoose.model("Wishlist",     wishlistSchema),
  Review:       mongoose.model("Review",       reviewSchema),
  Coupon:       mongoose.model("Coupon",       couponSchema),
  Notification: mongoose.model("Notification", notificationSchema),
};
