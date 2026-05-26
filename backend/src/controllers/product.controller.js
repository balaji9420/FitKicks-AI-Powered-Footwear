const Product = require("../models/Product.model");
const { AppError, asyncHandler } = require("../utils/helpers");

exports.getProducts = asyncHandler(async (req, res) => {
  const { page=1, limit=20, sort="-createdAt", category, brand, gender, shoeType, occasion,
          minPrice, maxPrice, minRating, size, isTrending, isNewArrival, isBestSeller,
          isLimitedEdition, isFlashSale, search } = req.query;

  const q = { isActive: true };
  if (category)  q.category  = category;
  if (brand)     q.brand     = brand;
  if (gender)    q.gender    = gender;
  if (shoeType)  q.shoeType  = shoeType;
  if (occasion)  q.occasion  = { $in: Array.isArray(occasion) ? occasion : [occasion] };
  if (minPrice || maxPrice) {
    q.price = {};
    if (minPrice) q.price.$gte = parseFloat(minPrice);
    if (maxPrice) q.price.$lte = parseFloat(maxPrice);
  }
  if (minRating)       q.averageRating = { $gte: parseFloat(minRating) };
  if (isTrending === "true")       q.isTrending = true;
  if (isNewArrival === "true")     q.isNewArrival = true;
  if (isBestSeller === "true")     q.isBestSeller = true;
  if (isLimitedEdition === "true") q.isLimitedEdition = true;
  if (isFlashSale === "true")      { q.isFlashSale = true; q.flashSaleEndsAt = { $gt: new Date() }; }
  if (size) q["colors.sizeStock"] = { $elemMatch: { size, stock: { $gt: 0 } } };
  if (search) q.$text = { $search: search };

  const pg = parseInt(page);
  const lm = Math.min(parseInt(limit), 50);
  const [products, total] = await Promise.all([
    Product.find(q)
      .select("-colors.sizeStock -costPrice -metaTitle -metaDescription")
      .populate("category", "name slug").populate("brand", "name logo")
      .sort(sort).skip((pg-1)*lm).limit(lm).lean(),
    Product.countDocuments(q),
  ]);
  res.json({ success: true, data: { products, pagination: { total, page: pg, limit: lm, pages: Math.ceil(total/lm), hasNext: pg*lm<total, hasPrev: pg>1 } } });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  const q = identifier.match(/^[0-9a-fA-F]{24}$/) ? { _id: identifier } : { slug: identifier };
  const product = await Product.findOne({ ...q, isActive: true })
    .populate("category","name slug").populate("brand","name logo website")
    .populate("relatedProducts","name price images averageRating slug");
  if (!product) throw new AppError("Product not found", 404);
  await Product.findByIdAndUpdate(product._id, { $inc: { totalViews: 1 } });
  res.json({ success: true, data: { product } });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.user._id };
  if (req.files?.length > 0) {
    data.images = req.files.map((f, i) => ({ url: f.path, publicId: f.filename, isPrimary: i===0 }));
  }
  const product = await Product.create(data);
  await product.populate("category brand");
  res.status(201).json({ success: true, message: "Product created", data: { product } });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  const updates = { ...req.body };
  if (req.files?.length > 0) {
    const newImgs = req.files.map((f,i) => ({ url: f.path, publicId: f.filename, isPrimary: product.images.length===0&&i===0 }));
    updates.images = [...product.images, ...newImgs];
  }
  const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("category brand");
  res.json({ success: true, message: "Product updated", data: { product: updated } });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: "Product deactivated" });
});

exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const sel = "name price comparePrice images averageRating totalReviews slug brand discountPercentage";
  const populate = { path: "brand", select: "name" };
  const base = { isActive: true, isInStock: true };

  const [trending, newArrivals, bestSellers, limitedEdition, flashSales] = await Promise.all([
    Product.find({ ...base, isTrending: true }).limit(8).select(sel).populate(populate).lean(),
    Product.find({ ...base, isNewArrival: true }).sort({ createdAt: -1 }).limit(8).select(sel).populate(populate).lean(),
    Product.find({ ...base, isBestSeller: true }).sort({ totalSold: -1 }).limit(8).select(sel).populate(populate).lean(),
    Product.find({ ...base, isLimitedEdition: true }).limit(4).select(sel).populate(populate).lean(),
    Product.find({ ...base, isFlashSale: true, flashSaleEndsAt: { $gt: new Date() } }).limit(6).select(`${sel} flashSaleEndsAt`).populate(populate).lean(),
  ]);
  res.json({ success: true, data: { trending, newArrivals, bestSellers, limitedEdition, flashSales } });
});

exports.searchProducts = asyncHandler(async (req, res) => {
  const { q, limit=10 } = req.query;
  if (!q || q.length < 2) throw new AppError("Query too short", 400);
  const products = await Product.find({ isActive: true, $text: { $search: q } }, { score: { $meta: "textScore" } })
    .select("name price images averageRating slug brand").populate("brand","name")
    .sort({ score: { $meta: "textScore" } }).limit(parseInt(limit)).lean();
  res.json({ success: true, data: { products, total: products.length } });
});

exports.bulkUpdate = asyncHandler(async (req, res) => {
  const { productIds, updates } = req.body;
  if (!productIds?.length) throw new AppError("No product IDs", 400);
  const allowed = ["isActive","isTrending","isNewArrival","isBestSeller","isFlashSale"];
  const safe = {};
  Object.keys(updates).forEach(k => { if (allowed.includes(k)) safe[k] = updates[k]; });
  const result = await Product.updateMany({ _id: { $in: productIds } }, { $set: safe });
  res.json({ success: true, message: `${result.modifiedCount} products updated`, data: { modifiedCount: result.modifiedCount } });
});
