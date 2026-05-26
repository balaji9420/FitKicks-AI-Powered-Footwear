const { generateRecommendations, generateFallbackRecommendations } = require("../services/ai.service");
const AIRecommendation = require("../models/AIRecommendation.model");
const { AppError, asyncHandler } = require("../utils/helpers");
const { v4: uuidv4 } = require("uuid");

exports.analyzeOutfit = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("Please upload an outfit image", 400);
  const imageUrl = req.file.path;
  const userId = req.user?._id || null;
  const sessionId = req.headers["x-session-id"] || uuidv4();
  const rec = await generateRecommendations({ imageUrl, userId, sessionId });
  res.status(201).json({
    success: true, message: "Outfit analyzed!",
    data: { recommendationId: rec._id, analysis: rec.analysis, recommendations: rec.recommendations, processingTime: rec.processingTime },
  });
});

exports.getRecommendation = asyncHandler(async (req, res) => {
  const rec = await AIRecommendation.findById(req.params.id).populate({
    path: "recommendations.product",
    select: "name price comparePrice images averageRating totalReviews brand category shoeType isInStock slug discountPercentage",
    populate: [{ path: "brand", select: "name logo" }, { path: "category", select: "name slug" }],
  });
  if (!rec) throw new AppError("Recommendation not found", 404);
  if (rec.user && req.user && rec.user.toString() !== req.user._id.toString()) throw new AppError("Access denied", 403);
  res.json({ success: true, data: { recommendation: rec } });
});

exports.getMyRecommendations = asyncHandler(async (req, res) => {
  const { page=1, limit=10 } = req.query;
  const q = { user: req.user._id, status: "completed" };
  const [recs, total] = await Promise.all([
    AIRecommendation.find(q)
      .select("outfitImage analysis.style analysis.occasion recommendations createdAt processingTime")
      .sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit).lean(),
    AIRecommendation.countDocuments(q),
  ]);
  res.json({ success: true, data: { recommendations: recs, pagination: { total, page: +page, pages: Math.ceil(total/limit) } } });
});

exports.submitFeedback = asyncHandler(async (req, res) => {
  const { rating, helpful, comment } = req.body;
  const rec = await AIRecommendation.findById(req.params.id);
  if (!rec) throw new AppError("Not found", 404);
  if (rec.user?.toString() !== req.user._id.toString()) throw new AppError("Access denied", 403);
  rec.feedback = { rating, helpful, comment };
  await rec.save();
  res.json({ success: true, message: "Feedback submitted!" });
});

exports.trackInteraction = asyncHandler(async (req, res) => {
  const { productId, action } = req.body;
  const rec = await AIRecommendation.findById(req.params.id);
  if (!rec) throw new AppError("Not found", 404);
  if (action === "view" && !rec.viewedProducts.includes(productId)) rec.viewedProducts.push(productId);
  if (action === "cart" && !rec.addedToCart.includes(productId)) rec.addedToCart.push(productId);
  if (action === "purchase" && !rec.purchasedProducts.includes(productId)) rec.purchasedProducts.push(productId);
  await rec.save();
  res.json({ success: true });
});

exports.getSmartRecommendations = asyncHandler(async (req, res) => {
  const { occasion, gender, minPrice, maxPrice } = req.query;
  const recs = await generateFallbackRecommendations({
    occasion, gender,
    priceRange: minPrice || maxPrice ? { min: +minPrice||0, max: +maxPrice||999999 } : null,
  });
  res.json({ success: true, data: { recommendations: recs } });
});

exports.getAIAnalytics = asyncHandler(async (req, res) => {
  const { days=30 } = req.query;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [total, completed, convData, topStyles] = await Promise.all([
    AIRecommendation.countDocuments({ createdAt: { $gte: since } }),
    AIRecommendation.countDocuments({ createdAt: { $gte: since }, status: "completed" }),
    AIRecommendation.aggregate([
      { $match: { createdAt: { $gte: since }, status: "completed" } },
      { $project: { hasCart: { $gt: [{ $size: "$addedToCart" }, 0] }, hasBuy: { $gt: [{ $size: "$purchasedProducts" }, 0] } } },
      { $group: { _id: null, cart: { $sum: { $cond: ["$hasCart",1,0] } }, buy: { $sum: { $cond: ["$hasBuy",1,0] } }, n: { $sum: 1 } } },
    ]),
    AIRecommendation.aggregate([
      { $match: { createdAt: { $gte: since }, status: "completed" } },
      { $group: { _id: "$analysis.style", count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
    ]),
  ]);
  const c = convData[0] || { cart:0, buy:0, n:1 };
  res.json({ success: true, data: {
    totalAnalyses: total, completedAnalyses: completed,
    successRate: total ? Math.round(completed/total*100) : 0,
    cartConversionRate: c.n ? Math.round(c.cart/c.n*100) : 0,
    purchaseConversionRate: c.n ? Math.round(c.buy/c.n*100) : 0,
    topStyles,
  }});
});
