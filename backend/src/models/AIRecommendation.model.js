const mongoose = require("mongoose");

const recItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  matchScore: { type: Number, min: 0, max: 100, required: true },
  matchReasons: [String],
  tier: { type: String, enum: ["premium","mid","budget"], required: true },
  rank: { type: Number, required: true },
}, { _id: false });

const aiRecSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  sessionId: { type: String, index: true },
  outfitImage: { url: { type: String, required: true }, publicId: String },
  analysis: {
    dominantColors: [String], colorPalette: [String],
    style: String, occasion: String, fashionType: String,
    gender: String, season: String, styleConfidence: Number,
    description: String, outfitTags: [String],
    whyExplanation: String,
    occasionScores: { casual: Number, formal: Number, gym: Number, party: Number, office: Number },
    idealShoeStyles: [String], colorCompatibility: { matches: [String], avoids: [String] },
  },
  recommendations: [recItemSchema],
  totalRecommendations: { type: Number, default: 0 },
  viewedProducts:    [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  purchasedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  addedToCart:       [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  aiProvider: { type: String, default: "openai" },
  aiModel:    { type: String, default: "gpt-4o" },
  processingTime: Number,
  status: { type: String, enum: ["pending","processing","completed","failed"], default: "pending" },
  errorMessage: String,
  feedback: { rating: { type: Number, min: 1, max: 5 }, helpful: Boolean, comment: String },
}, { timestamps: true });

aiRecSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model("AIRecommendation", aiRecSchema);
