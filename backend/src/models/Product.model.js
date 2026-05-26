const mongoose = require("mongoose");
const slugify = require("slugify");

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true }, publicId: String, alt: String, isPrimary: { type: Boolean, default: false }, color: String
}, { _id: true });

const sizeStockSchema = new mongoose.Schema({ size: String, stock: { type: Number, default: 0, min: 0 }, sku: String }, { _id: false });

const productSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  slug:             { type: String, unique: true, lowercase: true },
  description:      { type: String, required: true },
  shortDescription: { type: String },
  price:            { type: Number, required: true, min: 0 },
  comparePrice:     { type: Number, min: 0 },
  costPrice:        { type: Number, min: 0 },
  discountPercentage: { type: Number, default: 0 },
  category:  { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
  brand:     { type: mongoose.Schema.Types.ObjectId, ref: "Brand",    required: true, index: true },
  tags:      [{ type: String, lowercase: true }],
  shoeType:  { type: String, enum: ["sneakers","running","sports","casual","formal","high-tops","limited-edition","training","basketball","football","cricket","lifestyle"], required: true },
  gender:    { type: String, enum: ["men","women","unisex","kids"], required: true },
  occasion:  [{ type: String, enum: ["casual","formal","gym","party","outdoor","office","sports","beach","travel"] }],
  closure:   { type: String, enum: ["lace-up","slip-on","velcro","zipper","buckle"] },
  sole: String, material: String, weight: Number,
  heightType: { type: String, enum: ["low-top","mid-top","high-top"] },
  colors: [{
    name: { type: String, required: true }, hex: String,
    images: [imageSchema], sizeStock: [sizeStockSchema], isAvailable: { type: Boolean, default: true }
  }],
  images: [imageSchema],
  totalStock:        { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  isInStock: { type: Boolean, default: true },
  isActive:         { type: Boolean, default: true },
  isFeatured:       { type: Boolean, default: false },
  isTrending:       { type: Boolean, default: false },
  isNewArrival:     { type: Boolean, default: false },
  isBestSeller:     { type: Boolean, default: false },
  isLimitedEdition: { type: Boolean, default: false },
  isFlashSale:      { type: Boolean, default: false },
  flashSaleEndsAt:  { type: Date },
  averageRating:    { type: Number, default: 0, min: 0, max: 5 },
  totalReviews:     { type: Number, default: 0 },
  ratingDistribution: { 1:{type:Number,default:0}, 2:{type:Number,default:0}, 3:{type:Number,default:0}, 4:{type:Number,default:0}, 5:{type:Number,default:0} },
  totalSold:     { type: Number, default: 0 },
  totalViews:    { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  aiStyleTags:    [String],
  aiColorProfile: [String],
  aiOccasionScore: { casual:{type:Number,default:0}, formal:{type:Number,default:0}, gym:{type:Number,default:0}, party:{type:Number,default:0}, office:{type:Number,default:0} },
  metaTitle: String, metaDescription: String, metaKeywords: [String],
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

productSchema.index({ slug: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ isTrending: 1, isActive: 1 });
productSchema.index({ isNewArrival: 1, isActive: 1 });
productSchema.index({ isBestSeller: 1, isActive: 1 });
productSchema.index({ "$**": "text" }, { weights: { name: 10, description: 5, tags: 8 } });

productSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) this.slug = slugify(this.name, { lower: true, strict: true });
  if (this.comparePrice > this.price) this.discountPercentage = Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  if (this.colors?.length > 0) this.totalStock = this.colors.reduce((t, c) => t + c.sizeStock.reduce((s, z) => s + z.stock, 0), 0);
  this.isInStock = this.totalStock > 0;
  next();
});

module.exports = mongoose.model("Product", productSchema);
