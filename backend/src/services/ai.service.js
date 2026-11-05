const Product = require("../models/product.model")
const AIRecommendation = require("../models/AIRecommendation.model")
const User = require("../models/User.model")

const OCCASIONS = new Set(["casual", "formal", "gym", "party", "outdoor", "office", "sports", "beach", "travel"])
const STYLES = new Set(["casual", "formal", "streetwear", "sporty", "party", "athleisure", "business", "minimalist", "outdoor"])
const GENDERS = new Set(["men", "women", "unisex", "kids"])

const normalize = (value) => String(value || "").trim().toLowerCase()

const normalizeSelection = (value, allowed, fallback) => {
  const normalized = normalize(value)
  return allowed.has(normalized) ? normalized : fallback
}

const analyzeOutfit = ({ colorPalette = [], style, occasion, gender } = {}) => {
  let colors = colorPalette
  if (typeof colors === "string") {
    try {
      colors = JSON.parse(colors)
    } catch {
      colors = []
    }
  }
  if (!Array.isArray(colors)) colors = []

  const palette = [...new Set(colors.map(normalize).filter(Boolean))].slice(0, 5)
  const selectedStyle = normalizeSelection(style, STYLES, "casual")
  const selectedOccasion = normalizeSelection(occasion, OCCASIONS, "casual")
  const selectedGender = normalizeSelection(gender, GENDERS, "unisex")

  return {
    style: selectedStyle,
    occasion: selectedOccasion,
    fashionType: selectedStyle,
    gender: selectedGender,
    dominantColors: palette,
    colorPalette: palette,
    outfitTags: [selectedStyle, selectedOccasion],
    idealShoeStyles: [],
    description: palette.length
      ? `Local analysis found ${palette.join(", ")} tones. Matching uses your selected ${selectedStyle} style and ${selectedOccasion} occasion against shoe materials, styles, and catalog details.`
      : `Local analysis is using your selected ${selectedStyle} style and ${selectedOccasion} occasion. Add a clear outfit photo for better color matching.`,
  }
}

const STYLE_TAGS = {
  casual: ["casual", "lifestyle", "everyday", "versatile"],
  formal: ["formal", "office", "leather", "dress", "polished"],
  streetwear: ["streetwear", "skate", "retro", "basketball", "hyped", "lifestyle"],
  sporty: ["sports", "sport", "running", "training", "athletic", "performance"],
  party: ["party", "statement", "hyped", "bold"],
  athleisure: ["athleisure", "running", "training", "sport", "comfort"],
  business: ["business", "office", "formal", "leather", "polished"],
  minimalist: ["minimalist", "minimal", "clean", "classic", "simple"],
  outdoor: ["outdoor", "trail", "hiking", "rugged", "waterproof"],
}

const OCCASION_TAGS = {
  casual: ["casual", "lifestyle", "everyday"],
  formal: ["formal", "office", "leather", "dress"],
  gym: ["gym", "training", "running", "performance"],
  party: ["party", "statement", "bold"],
  outdoor: ["outdoor", "trail", "hiking", "rugged"],
  office: ["office", "business", "formal", "leather"],
  sports: ["sports", "sport", "basketball", "running", "training"],
  beach: ["beach", "sand", "water"],
  travel: ["travel", "walking", "comfort", "lifestyle"],
}

const colorFamilies = (color) => {
  const value = normalize(color)
  const families = []
  if (/black|charcoal|navy|dark/.test(value)) families.push("dark")
  if (/white|cream|ivory|beige|tan|grey|gray|silver/.test(value)) families.push("neutral")
  if (/red|orange|pink|purple|violet/.test(value)) families.push("warm")
  if (/blue|green|teal|cyan/.test(value)) families.push("cool")
  if (/brown|yellow|gold/.test(value)) families.push("earth")
  return families.length ? families : [value]
}

const includesAny = (values, terms) => values.some((value) => terms.some((term) => value.includes(term)))
const tokenize = (value) => normalize(value)
  .split(/[^a-z0-9]+/)
  .filter((token) => token.length > 2)

const productDocument = (product) => [
  product.name,
  product.description,
  product.shortDescription,
  product.material,
  product.brand?.name,
  product.category?.name,
  product.gender,
  product.shoeType,
  ...(product.tags || []),
  ...(product.aiStyleTags || []),
  ...(product.aiColorProfile || []),
  ...(product.occasion || []),
  ...(product.colors || []).map((color) => color.name),
].filter(Boolean).join(" ")

const SUPPORT_POLICIES = [
  {
    title: "Shipping",
    content: "The FitKicks storefront advertises free shipping on orders above ₹999. Check the checkout page for the shipping options available to your order.",
  },
  {
    title: "Returns",
    content: "The FitKicks storefront advertises easy returns within 7 days. Check your order details or contact store support to confirm eligibility and return instructions.",
  },
  {
    title: "Product authenticity",
    content: "FitKicks states that products are verified. Review the product listing and order details for the specific item you are considering.",
  },
  {
    title: "Sizes and availability",
    content: "Product pages show the sizes available for each shoe. Size options and stock can change, so confirm the current availability on the product page before ordering.",
  },
  {
    title: "Order status",
    content: "Sign in to your FitKicks account and open My Orders to view your order history and available order-status details.",
  },
]

const SUPPORT_QUERY_EXPANSIONS = {
  shoe: ["shoes", "sneaker", "sneakers", "footwear"],
  shoes: ["shoe", "sneaker", "sneakers", "footwear"],
  delivery: ["shipping", "ship", "order"],
  shipping: ["delivery", "ship", "order"],
  return: ["returns", "refund", "exchange"],
  returns: ["return", "refund", "exchange"],
  size: ["sizes", "fit", "uk"],
  sizes: ["size", "fit", "uk"],
  cost: ["price", "prices", "budget"],
  price: ["cost", "prices", "budget"],
}

const answerSupportQuestion = async (question) => {
  const products = await Product.find({
    isActive: true,
    isInStock: true,
    totalStock: { $gt: 0 },
  })
    .populate("brand", "name")
    .populate("category", "name")
    .select("name slug description shortDescription material brand category shoeType gender tags colors price averageRating totalReviews totalStock")
    .lean()

  const normalizedQuestion = normalize(question)
  const requestedBrand = [...new Set(products.map((product) => product.brand?.name).filter(Boolean))]
    .find((brand) => normalizedQuestion.includes(normalize(brand)))
  const budgetMatch = question.match(
    /(?:under|below|less than|up to|within)\s*(?:₹|rs\.?\s*)?([\d,]+(?:\.\d+)?)\s*(k)?/i
  )
  const maximumPrice = budgetMatch
    ? Number(budgetMatch[1].replace(/,/g, "")) * (budgetMatch[2] ? 1000 : 1)
    : null
  const matchingProducts = products.filter((product) =>
    (!requestedBrand || normalize(product.brand?.name) === normalize(requestedBrand)) &&
    (maximumPrice === null || product.price <= maximumPrice)
  )

  const documents = [
    ...SUPPORT_POLICIES.map((policy) => ({
      type: "policy",
      title: policy.title,
      content: policy.content,
    })),
    ...matchingProducts.map((product) => ({
      type: "product",
      title: `${product.brand?.name || "FitKicks"} ${product.name}`,
      content: [
        productDocument(product),
        `price ${product.price}`,
        product.totalStock > 0 ? "in stock available" : "out of stock",
        ...(product.colors || []).flatMap((color) => [
          color.name,
          ...(color.sizeStock || []).filter((entry) => entry.stock > 0).map((entry) => entry.size),
        ]),
      ].filter(Boolean).join(" "),
      product,
    })),
  ]

  const queryTerms = new Set(tokenize(question))
  for (const term of [...queryTerms]) {
    for (const expansion of SUPPORT_QUERY_EXPANSIONS[term] || []) {
      tokenize(expansion).forEach((expandedTerm) => queryTerms.add(expandedTerm))
    }
  }
  const terms = [...queryTerms]
  const documentTokens = documents.map((document) => tokenize(`${document.title} ${document.content}`))
  const documentFrequency = new Map()
  documentTokens.forEach((tokens) => {
    new Set(tokens).forEach((term) => documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1))
  })
  const averageLength = documentTokens.reduce((sum, tokens) => sum + tokens.length, 0) /
    Math.max(documentTokens.length, 1)

  const ranked = documents.map((document, index) => {
    const tokenCounts = new Map()
    documentTokens[index].forEach((term) => tokenCounts.set(term, (tokenCounts.get(term) || 0) + 1))
    const score = terms.reduce((total, term) => {
      const frequency = tokenCounts.get(term) || 0
      if (!frequency) return total
      const count = documentFrequency.get(term) || 0
      const inverseFrequency = Math.log(1 + (documents.length - count + 0.5) / (count + 0.5))
      const normalizedFrequency = (frequency * 2.2) /
        (frequency + 1.2 * (0.25 + 0.75 * documentTokens[index].length / Math.max(averageLength, 1)))
      return total + inverseFrequency * normalizedFrequency
    }, 0)
    return {
      ...document,
      score,
      matchedTerms: terms.filter((term) => tokenCounts.has(term)).slice(0, 5),
    }
  }).filter((document) => document.score > 0)
    .sort((left, right) => right.score - left.score)

  if (!ranked.length) {
    return {
      answer: "I couldn't find a reliable answer in the FitKicks catalog or store information. Try asking about a shoe, its price, sizes, stock, shipping, returns, or your orders.",
      sources: [],
      products: [],
    }
  }

  const policyMatches = ranked.filter((document) => document.type === "policy").slice(0, 2)
  const productMatches = ranked.filter((document) => document.type === "product").slice(0, 3)
  const bestPolicy = policyMatches[0]
  const bestProduct = productMatches[0]
  const usePolicy = bestPolicy && (!bestProduct || bestPolicy.score >= bestProduct.score)
  const sources = usePolicy
    ? policyMatches.map(({ title, content, matchedTerms }) => ({
      type: "store",
      title,
      excerpt: content,
      matchedTerms,
    }))
    : productMatches.map(({ title, content, matchedTerms, product }) => ({
      type: "product",
      title,
      excerpt: (product.shortDescription || product.description || content).slice(0, 280),
      matchedTerms,
      slug: product.slug,
    }))

  const recommendations = usePolicy ? [] : productMatches.map(({ product }) => ({
    id: product._id,
    slug: product.slug,
    name: product.name,
    brand: product.brand?.name || "FitKicks",
    price: product.price,
    averageRating: product.averageRating || 0,
    image: product.images?.find((image) => image.isPrimary)?.url || product.images?.[0]?.url || "",
  }))

  return {
    answer: usePolicy
      ? bestPolicy.content
      : `Here are the closest in-stock catalog matches I found. Compare their listed details and availability before choosing.`,
    sources,
    products: recommendations,
  }
}

const retrieveCatalogEvidence = (products, analysis, user) => {
  const query = [
    analysis.style,
    analysis.occasion,
    analysis.gender,
    ...(analysis.colorPalette || []),
    ...(analysis.outfitTags || []),
    ...(STYLE_TAGS[analysis.style] || []),
    ...(OCCASION_TAGS[analysis.occasion] || []),
    ...(user?.shoePreferences?.style || []),
    ...(user?.shoePreferences?.brands || []),
  ].join(" ")
  const queryTerms = [...new Set(tokenize(query))]
  const documents = products.map((product) => {
    const terms = tokenize(productDocument(product))
    const frequencies = new Map()
    terms.forEach((term) => frequencies.set(term, (frequencies.get(term) || 0) + 1))
    return { frequencies, length: terms.length }
  })
  const documentFrequency = new Map()
  documents.forEach(({ frequencies }) => {
    frequencies.forEach((_, term) => documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1))
  })
  const averageLength = documents.reduce((sum, document) => sum + document.length, 0) / Math.max(documents.length, 1)

  return products.map((product, index) => {
    const { frequencies, length } = documents[index]
    const score = queryTerms.reduce((total, term) => {
      const frequency = frequencies.get(term) || 0
      if (!frequency) return total
      const count = documentFrequency.get(term) || 0
      const inverseFrequency = Math.log(1 + (products.length - count + 0.5) / (count + 0.5))
      const normalizedFrequency = (frequency * 2.2) /
        (frequency + 1.2 * (0.25 + 0.75 * length / Math.max(averageLength, 1)))
      return total + inverseFrequency * normalizedFrequency
    }, 0)
    const matchedTerms = queryTerms.filter((term) => frequencies.has(term)).slice(0, 6)
    return {
      score,
      matchedTerms,
      evidence: [
        `${product.brand?.name || "Unknown brand"} ${product.name}`,
        product.material && `Material: ${product.material}`,
        product.shoeType && `Style: ${product.shoeType}`,
        product.description && `Catalog: ${product.description}`,
      ].filter(Boolean),
    }
  })
}

const addLearnedSignal = (signals, product, value) => {
  if (!product || !value) return
  const brand = normalize(product.brand?.name)
  if (brand) signals.brands.set(brand, (signals.brands.get(brand) || 0) + value)
  const tags = [
    ...(product.tags || []),
    ...(product.aiStyleTags || []),
    product.shoeType,
    product.material,
  ].map(normalize).filter(Boolean)
  tags.forEach((tag) => signals.tags.set(tag, (signals.tags.get(tag) || 0) + value))
}

const calculateCollaborativeScores = (userRecords, peerRecords) => {
  const productId = (product) => String(product?._id || product || "")
  const addInteractions = (profile, record) => {
    for (const product of record.addedToCart || []) {
      const id = productId(product)
      if (id) profile.set(id, (profile.get(id) || 0) + 0.5)
    }
    for (const product of record.purchasedProducts || []) {
      const id = productId(product)
      if (id) profile.set(id, (profile.get(id) || 0) + 1)
    }
  }

  const userProfile = new Map()
  userRecords.forEach((record) => addInteractions(userProfile, record))
  if (!userProfile.size) return new Map()

  const peerProfiles = new Map()
  peerRecords.forEach((record) => {
    const userId = String(record.user || "")
    if (!userId) return
    if (!peerProfiles.has(userId)) peerProfiles.set(userId, new Map())
    addInteractions(peerProfiles.get(userId), record)
  })

  const productScores = new Map()
  const peerWeightTotals = new Map()
  for (const profile of peerProfiles.values()) {
    let dotProduct = 0
    let userNorm = 0
    let peerNorm = 0
    for (const weight of userProfile.values()) userNorm += weight * weight
    for (const weight of profile.values()) peerNorm += weight * weight
    for (const [id, weight] of userProfile) {
      dotProduct += weight * (profile.get(id) || 0)
    }
    const similarity = dotProduct / (Math.sqrt(userNorm) * Math.sqrt(peerNorm))
    if (!similarity) continue

    for (const [id, weight] of profile) {
      if (userProfile.has(id)) continue
      productScores.set(id, (productScores.get(id) || 0) + similarity * weight)
      peerWeightTotals.set(id, (peerWeightTotals.get(id) || 0) + similarity)
    }
  }

  const normalizedScores = new Map()
  let maximumScore = 0
  for (const [id, score] of productScores) {
    const normalizedScore = score / peerWeightTotals.get(id)
    normalizedScores.set(id, normalizedScore)
    maximumScore = Math.max(maximumScore, normalizedScore)
  }
  if (!maximumScore) return new Map()
  for (const [id, score] of normalizedScores) {
    normalizedScores.set(id, score / maximumScore)
  }
  return normalizedScores
}

const learnFromFeedback = async (userId) => {
  const signals = { brands: new Map(), tags: new Map(), collaborative: new Map() }
  if (!userId) return signals

  const history = await AIRecommendation.find({
    user: userId,
    $or: [
      { feedback: { $exists: true } },
      { purchasedProducts: { $ne: [] } },
      { addedToCart: { $ne: [] } },
    ],
  })
    .select("feedback recommendations.product purchasedProducts addedToCart")
    .sort({ updatedAt: -1 })
    .limit(200)
    .populate({ path: "recommendations.product", select: "brand tags aiStyleTags shoeType material", populate: { path: "brand", select: "name" } })
    .populate({ path: "purchasedProducts", select: "brand tags aiStyleTags shoeType material", populate: { path: "brand", select: "name" } })
    .populate({ path: "addedToCart", select: "brand tags aiStyleTags shoeType material", populate: { path: "brand", select: "name" } })
    .lean()

  history.forEach((record) => {
    const rating = Number(record.feedback?.rating) || 3
    const overallSignal = Math.max(-1, Math.min(1, (rating - 3) / 2)) +
      (record.feedback?.helpful === true ? 0.25 : record.feedback?.helpful === false ? -0.25 : 0)
    const recommendations = record.recommendations || []
    recommendations.forEach((item) => addLearnedSignal(signals, item.product, overallSignal * 0.12))
    for (const product of record.purchasedProducts || []) addLearnedSignal(signals, product, 0.8)
    for (const product of record.addedToCart || []) addLearnedSignal(signals, product, 0.45)
  })

  const currentInteractions = history.filter((record) =>
    record.addedToCart?.length || record.purchasedProducts?.length
  )
  if (currentInteractions.length) {
    const peerHistory = await AIRecommendation.find({
      user: { $exists: true, $ne: userId },
      updatedAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
      $or: [
        { addedToCart: { $ne: [] } },
        { purchasedProducts: { $ne: [] } },
      ],
    })
      .select("user addedToCart purchasedProducts")
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean()
    signals.collaborative = calculateCollaborativeScores(currentInteractions, peerHistory)
  }

  return signals
}

const getPriceTier = (price, prices) => {
  if (prices.length < 3) return "mid"
  const position = prices.filter((value) => value <= price).length / prices.length
  return position > 0.66 ? "premium" : position > 0.33 ? "mid" : "budget"
}

const buildReview = (product, reasons, analysis, occasionMatch, evidence) => {
  const verdict = reasons.length
    ? `Straight verdict: ${reasons.join("; ")}.`
    : "Verdict: a versatile option, but the catalog has limited details to confirm a close match."
  const materials = product.material ? ` Listed materials: ${product.material}.` : ""
  const description = product.shortDescription || product.description
  const catalogueNote = description ? ` Catalog note: ${description.trim().slice(0, 240)}` : ""
  const occasionNote = occasionMatch
    ? ` Its catalog tags support ${analysis.occasion} wear.`
    : ` The catalog does not specifically tag it for ${analysis.occasion}, so this is a less certain occasion match.`

  const evidenceNote = evidence.matchedTerms.length
    ? ` Retrieved catalog details matching: ${evidence.matchedTerms.join(", ")}.`
    : " The catalog had no strong keyword overlap, so this is a lower-confidence suggestion."
  return `${verdict}${occasionNote}${materials}${catalogueNote}${evidenceNote} This is an automated catalog-based style review, not a customer review.`
}

const generateRecommendations = async ({ analysis, userId, sessionId, persist = true }) => {
  const [products, user, learnedSignals] = await Promise.all([
    Product.find({ isActive: true, isInStock: true, totalStock: { $gt: 0 } })
      .populate("brand", "name")
      .populate("category", "name")
      .lean(),
    userId ? User.findById(userId).select("shoePreferences").lean() : null,
    learnFromFeedback(userId),
  ])

  const catalogEvidence = retrieveCatalogEvidence(products, analysis, user)
  const outfitColors = (analysis.colorPalette || []).flatMap(colorFamilies)
  const styleTerms = STYLE_TAGS[analysis.style] || STYLE_TAGS.casual
  const occasionTerms = OCCASION_TAGS[analysis.occasion] || OCCASION_TAGS.casual
  const preferredStyles = (user?.shoePreferences?.style || []).map(normalize)
  const preferredBrands = (user?.shoePreferences?.brands || []).map(normalize)
  const preferredPriceRange = user?.shoePreferences?.priceRange

  const rankedProducts = products
    .map((product, index) => {
      const evidence = catalogEvidence[index]
      const productColors = [
        ...(product.aiColorProfile || []),
        ...(product.colors || []).map((color) => color.name),
        ...(product.tags || []),
      ]
      const productColorFamilies = productColors.flatMap(colorFamilies)
      const tags = [
        ...(product.aiStyleTags || []),
        ...(product.tags || []),
        product.shoeType,
        product.material,
        product.category?.name,
      ].map(normalize).filter(Boolean)
      const colorMatch = outfitColors.find((color) => productColorFamilies.includes(color))
      const styleMatch = includesAny(tags, styleTerms)
      const occasionMatch = includesAny(tags, occasionTerms) ||
        (product.occasion || []).includes(analysis.occasion) ||
        (product.aiOccasionScore?.[analysis.occasion] || 0) >= 60
      const genderMatch = analysis.gender === "unisex" ||
        product.gender === "unisex" ||
        product.gender === analysis.gender
      const preferenceMatch = preferredStyles.some((style) => includesAny(tags, [style]))
      const brandName = normalize(product.brand?.name)
      const brandMatch = brandName && preferredBrands.includes(brandName)
      const learnedTagBoost = tags.reduce((boost, tag) => boost + (learnedSignals.tags.get(tag) || 0), 0)
      const learnedBrandBoost = learnedSignals.brands.get(brandName) || 0
      const feedbackBoost = Math.max(-12, Math.min(12, learnedTagBoost * 2 + learnedBrandBoost * 3))
      const collaborativeScore = learnedSignals.collaborative.get(String(product._id)) || 0
      const collaborativeBoost = collaborativeScore * 8
      const inPreferredPriceRange = !preferredPriceRange || (
        product.price >= (preferredPriceRange.min || 0) &&
        product.price <= (preferredPriceRange.max || Number.MAX_SAFE_INTEGER)
      )
      const reasons = []
      if (colorMatch) reasons.push(`Coordinates with your ${colorMatch} outfit tones`)
      else if (outfitColors.length && productColors.length) reasons.push("Offers a contrasting color rather than an exact color match")
      if (styleMatch) reasons.push(`Fits a ${analysis.style} look`)
      if (occasionMatch) reasons.push(`Catalog details support ${analysis.occasion} wear`)
      if (genderMatch && analysis.gender !== "unisex") reasons.push(`Matches your ${analysis.gender} fit preference`)
      else if (!genderMatch) reasons.push(`May not match your ${analysis.gender} fit preference`)
      if (preferenceMatch || brandMatch) reasons.push("Matches your saved preferences")
      if (evidence.matchedTerms.length) reasons.push(`Retrieved relevant catalog details: ${evidence.matchedTerms.slice(0, 3).join(", ")}`)
      if (feedbackBoost > 1) reasons.push("Ranked higher based on your past feedback and shopping choices")
      if (collaborativeScore > 0) reasons.push("Popular with shoppers who have similar purchase history")
      if (!inPreferredPriceRange) reasons.push("Outside your saved price range")

      const rating = Math.min(5, Math.max(0, Number(product.averageRating) || 0))
      const reviewCount = Math.max(0, Number(product.totalReviews) || 0)
      const ratingConfidence = reviewCount ? Math.min(1, reviewCount / 20) : 0
      const score = Math.max(25, Math.min(98, Math.round(
        45 +
        (colorMatch ? 18 : outfitColors.length ? 0 : 8) +
        (styleMatch ? 16 : 0) +
        (occasionMatch ? 14 : 0) +
        (genderMatch ? 5 : -8) +
        (preferenceMatch ? 5 : 0) +
        (brandMatch ? 4 : 0) +
        (rating ? (rating / 5) * 5 * ratingConfidence : 0) -
        (!inPreferredPriceRange ? 12 : 0) +
        feedbackBoost +
        collaborativeBoost +
        Math.min(evidence.score * 2, 8)
      )))

      return {
        product,
        score,
        reasons,
        review: buildReview(product, reasons, analysis, occasionMatch, evidence),
        retrievalScore: evidence.score,
        retrievalEvidence: evidence.evidence,
        feedbackBoost,
        collaborativeBoost,
      }
    })
    .sort((a, b) => b.score - a.score ||
      b.retrievalScore - a.retrievalScore ||
      (Number(b.product.averageRating) || 0) - (Number(a.product.averageRating) || 0) ||
      (Number(b.product.totalSold) || 0) - (Number(a.product.totalSold) || 0))

  const prices = rankedProducts.map(({ product }) => product.price).sort((a, b) => a - b)
  const recommendations = rankedProducts.map(({ product, score, reasons, review, retrievalScore, retrievalEvidence, feedbackBoost, collaborativeBoost }, index) => ({
    product,
    matchScore: score,
    matchReasons: reasons,
    review,
    retrievalScore,
    retrievalEvidence,
    localFeedbackBoost: feedbackBoost,
    collaborativeBoost,
    tier: getPriceTier(product.price, prices),
    rank: index + 1,
  }))

  if (!persist) return recommendations

  const record = await AIRecommendation.create({
    user: userId || null,
    sessionId: sessionId || null,
    analysis,
    recommendations: recommendations.map((recommendation) => ({
      ...recommendation,
      product: recommendation.product._id,
    })),
    totalRecommendations: recommendations.length,
    status: "completed",
    aiProvider: "local",
    aiModel: "catalog-style-matcher",
    processingTime: 0,
  })

  return AIRecommendation.findById(record._id).populate({
    path: "recommendations.product",
    select: "name description shortDescription material price comparePrice images slug brand averageRating totalReviews gender shoeType isInStock totalStock",
    populate: { path: "brand", select: "name" },
  })
}

const generateFallbackRecommendations = async ({ occasion, gender, priceRange } = {}) => {
  const analysis = analyzeOutfit({ occasion, gender })
  let ranked = await generateRecommendations({ analysis, persist: false })
  if (priceRange) {
    ranked = ranked.filter(({ product }) =>
      product.price >= priceRange.min && product.price <= priceRange.max
    )
  }
  return ranked
}

module.exports = {
  analyzeOutfit,
  generateRecommendations,
  generateFallbackRecommendations,
  answerSupportQuestion,
  calculateCollaborativeScores,
}
