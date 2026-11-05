const OpenAI = require("openai");
const Product = require("../models/product.model");
const AIRecommendation = require("../models/AIRecommendation.model");
const { logger } = require("../utils/logger");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const analyzeOutfit = async (imageUrl) => {
  const prompt = `You are a professional fashion stylist. Analyze this outfit image and respond ONLY with valid JSON (no markdown):
{
  "dominantColors": ["#hex1","#hex2"],
  "colorPalette": ["navy blue","white"],
  "style": "streetwear",
  "occasion": "casual",
  "fashionType": "minimalist",
  "gender": "men",
  "season": "all-season",
  "styleConfidence": 87,
  "description": "Clean minimalist streetwear...",
  "outfitTags": ["minimalist","urban","clean"],
  "idealShoeStyles": ["white sneakers","low-top","chunky"],
  "colorCompatibility": { "matches": ["white","grey"], "avoids": ["neon"] },
  "occasionScores": { "casual": 90, "formal": 10, "gym": 20, "party": 40, "office": 30 }
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{
      role: "user", content: [
        { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
        { type: "text", text: prompt },
      ]
    }],
    max_tokens: 800, temperature: 0.3,
  });

  const raw = response.choices[0].message.content;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned invalid JSON");
  return JSON.parse(match[0]);
};

const scoreProduct = (product, analysis) => {
  let score = 0;
  const reasons = [];
  const { occasionScores, occasion, outfitTags, colorCompatibility, gender, idealShoeStyles } = analysis;

  // Occasion (0-30)
  if (product.occasion?.includes(occasion)) {
    score += Math.min(30, (occasionScores?.[occasion] || 50) * 0.3);
    reasons.push(`Perfect for ${occasion} occasions`);
  }
  // Style tags (0-25)
  const tagHits = (outfitTags || []).filter(t => (product.aiStyleTags || []).some(pt => pt.toLowerCase().includes(t) || t.includes(pt)));
  if (tagHits.length > 0) { score += Math.min(25, tagHits.length * 8); reasons.push(`Matches your ${tagHits[0]} aesthetic`); }
  // Color (0-20)
  const compatible = colorCompatibility?.matches || [];
  const avoid = colorCompatibility?.avoids || [];
  const colorHits = (product.aiColorProfile || []).filter(c => compatible.some(m => c.toLowerCase().includes(m.toLowerCase())));
  const colorMiss = (product.aiColorProfile || []).filter(c => avoid.some(a => c.toLowerCase().includes(a.toLowerCase())));
  if (colorHits.length > 0) { score += Math.min(20, colorHits.length * 7); reasons.push("Color profile complements your outfit"); }
  score -= colorMiss.length * 5;
  // Gender (0-15)
  if (product.gender === gender || product.gender === "unisex") score += 15;
  // Shoe type (0-10)
  const styleMap = { sneakers: ["sneaker", "casual", "street"], running: ["runner", "athletic", "gym"], sports: ["sport", "active", "gym"], casual: ["casual", "everyday"], formal: ["formal", "office"] };
  const kws = styleMap[product.shoeType] || [];
  if ((idealShoeStyles || []).some(s => kws.some(k => s.toLowerCase().includes(k)))) { score += 10; reasons.push("Shoe style aligns with your look"); }
  // Rating boost
  if (product.averageRating >= 4.5) { score += 3; reasons.push("Highly rated by customers"); }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons: reasons.slice(0, 3) };
};

const generateRecommendations = async ({ imageUrl, userId, sessionId }) => {
  const record = await AIRecommendation.create({
    user: userId || null, sessionId: sessionId || null,
    outfitImage: { url: imageUrl }, status: "processing",
  });

  try {
    const startTime = Date.now();
    const analysis = await analyzeOutfit(imageUrl);

    const query = { isActive: true, isInStock: true };
    if (analysis.occasion) query.occasion = { $in: [analysis.occasion, "casual"] };
    if (analysis.gender && analysis.gender !== "unisex") query.gender = { $in: [analysis.gender, "unisex"] };

    const candidates = await Product.find(query)
      .select("name price comparePrice images aiStyleTags aiColorProfile occasion gender shoeType averageRating totalSold brand category slug discountPercentage")
      .populate("brand", "name").populate("category", "name")
      .limit(50).lean();

    const scored = candidates.map(p => ({ product: p, ...scoreProduct(p, analysis) }))
      .sort((a, b) => b.score - a.score).slice(0, 15);

    const recommendations = scored.map((item, i) => ({
      product: item.product._id,
      matchScore: item.score,
      matchReasons: item.reasons,
      tier: i < 3 ? "premium" : i < 8 ? "mid" : "budget",
      rank: i + 1,
    }));

    // Generate why explanation
    let whyExplanation = null;
    if (scored.length > 0) {
      try {
        const top = scored[0].product;
        const expRes = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Outfit style: ${analysis.style}, Colors: ${analysis.colorPalette?.join(", ")}, Occasion: ${analysis.occasion}. Top recommended shoe: "${top.name}". Write a 2-sentence enthusiastic explanation of why this shoe matches the outfit. Be specific about colors and occasion. Max 70 words.` }],
          max_tokens: 120, temperature: 0.7,
        });
        whyExplanation = expRes.choices[0].message.content;
      } catch { }
    }

    record.analysis = { ...analysis, whyExplanation };
    record.recommendations = recommendations;
    record.totalRecommendations = recommendations.length;
    record.status = "completed";
    record.processingTime = Date.now() - startTime;
    await record.save();

    const populated = await AIRecommendation.findById(record._id).populate({
      path: "recommendations.product",
      select: "name price comparePrice images averageRating totalReviews brand category shoeType isInStock slug discountPercentage",
      populate: [{ path: "brand", select: "name logo" }, { path: "category", select: "name slug" }],
    });

    return populated;
  } catch (err) {
    logger.error("AI error:", err);
    record.status = "failed"; record.errorMessage = err.message;
    await record.save();
    throw err;
  }
};

const generateFallbackRecommendations = async ({ occasion = "casual", gender = "unisex", priceRange }) => {
  const q = { isActive: true, isInStock: true, averageRating: { $gte: 3.5 } };
  if (occasion) q.occasion = { $in: [occasion] };
  if (gender && gender !== "unisex") q.gender = { $in: [gender, "unisex"] };
  if (priceRange) q.price = { $gte: priceRange.min || 0, $lte: priceRange.max || 999999 };

  const products = await Product.find(q).sort({ averageRating: -1, totalSold: -1 }).limit(12)
    .populate("brand", "name").lean();

  return products.map((p, i) => ({
    product: p, matchScore: 85 - i * 5,
    matchReasons: ["Popular choice", "Highly rated", `Great for ${occasion}`],
    tier: i < 3 ? "premium" : i < 7 ? "mid" : "budget", rank: i + 1,
  }));
};

module.exports = { generateRecommendations, generateFallbackRecommendations, analyzeOutfit };
