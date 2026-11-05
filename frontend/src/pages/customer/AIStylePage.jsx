import { useState, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Upload, Sparkles, X, ChevronRight, Star, Loader2, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { analyzeOutfit, setUploadPreview, clearAnalysis, selectAI } from '../../redux/slices/aiSlice'
import { selectIsAuthenticated } from '../../redux/slices/authSlice'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STYLE_COLORS = {
  casual: '#FF6B35', formal: '#4A90D9', streetwear: '#9B59B6',
  sporty: '#27AE60', party: '#E74C3C', athleisure: '#F39C12',
  business: '#2C3E50', minimalist: '#7F8C8D',
}

const detectDominantColors = (file) => new Promise((resolve, reject) => {
  const image = new Image()
  const objectUrl = URL.createObjectURL(file)
  image.onload = () => {
    try {
      const canvas = document.createElement('canvas')
      const size = 64
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('Image color analysis is unavailable in this browser')
      context.drawImage(image, 0, 0, size, size)
      const pixels = context.getImageData(0, 0, size, size).data
      const counts = new Map()

      for (let index = 0; index < pixels.length; index += 16) {
        const red = pixels[index]
        const green = pixels[index + 1]
        const blue = pixels[index + 2]
        const max = Math.max(red, green, blue)
        const min = Math.min(red, green, blue)
        const brightness = max / 255
        let name

        if (brightness < 0.18) name = 'black'
        else if (max - min < 24) name = brightness > 0.82 ? 'white' : 'gray'
        else {
          let hue
          if (max === red) hue = ((green - blue) / (max - min) + (green < blue ? 6 : 0)) * 60
          else if (max === green) hue = ((blue - red) / (max - min) + 2) * 60
          else hue = ((red - green) / (max - min) + 4) * 60

          if (hue < 15 || hue >= 345) name = 'red'
          else if (hue < 40) name = 'orange'
          else if (hue < 70) name = 'yellow'
          else if (hue < 165) name = 'green'
          else if (hue < 195) name = 'teal'
          else if (hue < 255) name = 'blue'
          else if (hue < 290) name = 'purple'
          else name = 'pink'
        }

        counts.set(name, (counts.get(name) || 0) + 1)
      }

      resolve([...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name))
    } catch (error) {
      reject(error)
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    reject(new Error('Could not read the selected outfit image'))
  }
  image.src = objectUrl
})

export default function AIStylePage() {
  const dispatch = useDispatch()
  const { currentAnalysis, isAnalyzing, uploadPreview, error } = useSelector(selectAI)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // all | premium | mid | budget
  const [colorPalette, setColorPalette] = useState([])
  const [style, setStyle] = useState('casual')
  const [occasion, setOccasion] = useState('casual')
  const [gender, setGender] = useState('unisex')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setSelectedFile(file)
    detectDominantColors(file).then(setColorPalette).catch(() => setColorPalette([]))
    const reader = new FileReader()
    reader.onloadend = () => dispatch(setUploadPreview(reader.result))
    reader.readAsDataURL(file)
  }, [dispatch])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleAnalyze = async () => {
    if (!selectedFile) return
    let detectedColors
    try {
      detectedColors = await detectDominantColors(selectedFile)
      setColorPalette(detectedColors)
    } catch (colorError) {
      toast.error(colorError.message || 'Could not analyze the outfit image.')
      return
    }

    dispatch(analyzeOutfit({
      colorPalette: detectedColors,
      style,
      occasion,
      gender,
    }))
  }

  const handleReset = () => {
    dispatch(clearAnalysis())
    setSelectedFile(null)
    setColorPalette([])
    setFeedbackSubmitted(false)
  }

  const handleFeedback = async (helpful) => {
    if (!currentAnalysis?.recommendationId || !isAuthenticated || isSubmittingFeedback) return
    setIsSubmittingFeedback(true)
    try {
      await api.post(`/ai/${currentAnalysis.recommendationId}/feedback`, {
        helpful,
        rating: helpful ? 5 : 2,
      })
      setFeedbackSubmitted(true)
      toast.success('Thanks — your feedback will improve your future matches.')
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not save your feedback.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  const recommendations = currentAnalysis?.recommendations || []
  const filteredRecs = activeTab === 'all' ? recommendations : recommendations.filter(r => r.tier === activeTab)
  const analysis = currentAnalysis?.analysis

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="badge-primary inline-flex mb-4">
            <Sparkles size={12} /> Local RAG Style Matching
          </div>
          <h1 className="section-title mb-4">
            AI Outfit → <span className="text-primary">Perfect Shoes</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Colors are analyzed on your device. Choose the look and occasion to retrieve matching shoes from our catalog — no paid AI API or image upload service is used.
          </p>
        </div>

        {!currentAnalysis ? (
          <div className="max-w-xl mx-auto">
            {/* Upload Zone */}
            <motion.div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploadPreview && fileInputRef.current?.click()}
              animate={{ borderColor: dragOver ? '#FF6B35' : uploadPreview ? '#FF6B35' : '#333' }}
              className={`
                relative border-2 border-dashed rounded-3xl overflow-hidden transition-all duration-300
                ${!uploadPreview ? 'cursor-pointer hover:border-primary/60 hover:bg-primary/5' : ''}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files[0])}
                className="hidden"
              />

              {uploadPreview ? (
                <div className="relative">
                  <img src={uploadPreview} alt="Your outfit" className="w-full max-h-[500px] object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset() }}
                    className="absolute top-3 right-3 w-8 h-8 bg-dark/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-dark transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-dark to-transparent p-6">
                    <p className="text-sm text-gray-300 text-center">Image stays in your browser. We analyze its color palette locally. 👟</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors ${dragOver ? 'bg-primary/20' : 'bg-dark-300'}`}>
                    <Upload size={28} className={dragOver ? 'text-primary' : 'text-gray-500'} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Drop your outfit photo here</h3>
                  <p className="text-gray-500 text-sm mb-4">or click to browse</p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-600">
                    {['Full body shot', 'Outfit flat lay', 'Selfie with outfit', 'JPEG / PNG / WebP'].map(h => (
                      <span key={h} className="px-2 py-1 bg-dark-300 rounded-full">{h}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {uploadPreview && (
              <div className="mt-5 grid sm:grid-cols-3 gap-3">
                {[
                  { label: 'Style', value: style, setValue: setStyle, options: ['casual', 'formal', 'streetwear', 'sporty', 'party', 'athleisure', 'business', 'minimalist', 'outdoor'] },
                  { label: 'Occasion', value: occasion, setValue: setOccasion, options: ['casual', 'formal', 'gym', 'party', 'outdoor', 'office', 'sports', 'beach', 'travel'] },
                  { label: 'Fit preference', value: gender, setValue: setGender, options: ['unisex', 'men', 'women', 'kids'] },
                ].map(({ label, value, setValue, options }) => (
                  <label key={label} className="text-xs text-gray-400">
                    {label}
                    <select
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-dark-200 px-3 py-2.5 text-sm text-white capitalize"
                    >
                      {options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            )}

            {/* Analyze button */}
            {uploadPreview && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg disabled:opacity-60"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Analyzing your outfit...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Find My Perfect Shoes
                    </>
                  )}
                </button>
                {isAnalyzing && (
                  <div className="mt-4 space-y-2">
                    {['Reading the photo color palette locally...', 'Preparing your style and occasion search...', 'Retrieving and ranking every in-stock catalog match...'].map((step, i) => (
                      <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 1.2 }}
                        className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 size={12} className="animate-spin text-primary" />
                        {step}
                      </motion.div>
                    ))}
                  </div>
                )}
                {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
              </motion.div>
            )}

            {/* How it works */}
            <div className="mt-12 grid grid-cols-3 gap-4">
              {[
                { step: '1', icon: '📸', title: 'Choose Photo', desc: 'Analyzed in your browser' },
                { step: '2', icon: '🎨', title: 'Set Your Look', desc: 'Style, occasion & fit' },
                { step: '3', icon: '👟', title: 'Get Every Match', desc: 'Catalog retrieval + ranking' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="text-center p-4 rounded-2xl bg-dark-200 border border-white/5">
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-sm font-semibold mb-1">{title}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── Results ── */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Uploaded image + analysis */}
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <img src={uploadPreview} alt="Your outfit" className="w-full object-cover max-h-64" />
                </div>

                {/* Analysis card */}
                {analysis && (
                  <div className="card p-5 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles size={14} className="text-primary" /> Outfit Analysis
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Style</span>
                        <div className="mt-1">
                          <span
                            className="badge"
                            style={{ background: `${STYLE_COLORS[analysis.style] || '#FF6B35'}20`, color: STYLE_COLORS[analysis.style] || '#FF6B35' }}
                          >
                            {analysis.style}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Occasion</span>
                        <p className="text-sm mt-1 capitalize">{analysis.occasion}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Detected outfit colors</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {analysis.colorPalette?.slice(0, 5).map((color) => (
                            <span key={color} className="text-xs px-2 py-1 bg-dark-300 rounded-full capitalize">{color}</span>
                          ))}
                        </div>
                      </div>
                      {analysis.description && (
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Local analysis</span>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{analysis.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button onClick={handleReset} className="btn-outline w-full flex items-center justify-center gap-2 text-sm">
                  <RefreshCw size={14} /> Try Another Outfit
                </button>
              </div>

              {/* Recommendations */}
              <div className="lg:col-span-2 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-2xl">
                    {recommendations.length} In-Stock Matches Found
                  </h2>
                  {/* Tier filter */}
                  <div className="flex gap-1 p-1 bg-dark-200 rounded-xl">
                    {['all', 'premium', 'mid', 'budget'].map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                          activeTab === tab ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                        }`}>
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredRecs.length > 0 ? filteredRecs.map((rec, index) => (
                    <AIRecommendationCard key={rec.product?._id || index} rec={rec} rank={index + 1} />
                  )) : (
                    <div className="text-center py-12 text-gray-500">No {activeTab} recommendations found</div>
                  )}
                </div>

                {currentAnalysis?.recommendationId && (
                  <div className="rounded-2xl border border-white/10 bg-dark-200 p-5">
                    <p className="font-medium">Was this set of suggestions useful?</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Your feedback adjusts future local rankings; it does not train an external model.
                    </p>
                    {isAuthenticated ? (
                      feedbackSubmitted ? (
                        <p className="mt-3 text-sm text-green-400">Thanks. Your preference has been recorded.</p>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleFeedback(true)}
                            disabled={isSubmittingFeedback}
                            className="btn-outline flex items-center gap-2 text-sm disabled:opacity-50"
                          >
                            <ThumbsUp size={14} /> Helpful
                          </button>
                          <button
                            onClick={() => handleFeedback(false)}
                            disabled={isSubmittingFeedback}
                            className="btn-outline flex items-center gap-2 text-sm disabled:opacity-50"
                          >
                            <ThumbsDown size={14} /> Not for me
                          </button>
                        </div>
                      )
                    ) : (
                      <Link to="/login" className="mt-3 inline-block text-sm text-primary hover:underline">
                        Sign in to improve future recommendations
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function AIRecommendationCard({ rec, rank }) {
  const dispatch = useDispatch()
  const product = rec.product
  if (!product) return null

  const primaryImage = product.images?.[0]?.url || '/placeholder-shoe.jpg'
  const scoreColor = rec.matchScore >= 80 ? '#27AE60' : rec.matchScore >= 60 ? '#FF6B35' : '#7F8C8D'

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="card p-4 flex gap-4 group"
    >
      {/* Rank */}
      <div className="w-6 h-6 rounded-full bg-dark-300 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 mt-1">
        {rank}
      </div>

      {/* Image */}
      <Link to={`/products/${product.slug}`} className="flex-shrink-0">
        <img src={primaryImage} alt={product.name}
          className="w-24 h-24 rounded-2xl object-cover bg-dark-300 group-hover:scale-105 transition-transform duration-300" />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-gray-500">{product.brand?.name}</p>
            <Link to={`/products/${product.slug}`}>
              <h3 className="font-semibold text-sm leading-tight hover:text-primary transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>
          </div>
          {/* Match score */}
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-bold" style={{ color: scoreColor }}>{rec.matchScore}%</div>
            <div className="text-xs text-gray-500">match</div>
          </div>
        </div>

        {/* Match reasons */}
        {rec.matchReasons?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {rec.matchReasons.map((reason) => (
              <span key={reason} className="text-xs px-2 py-0.5 bg-primary/10 text-primary/80 rounded-full">
                ✓ {reason}
              </span>
            ))}
          </div>
        )}

        {rec.review && (
          <div className="mt-3 rounded-xl border border-white/5 bg-dark-200/70 p-3">
            <p className="text-xs font-semibold text-gray-300">Straight style review</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-400">{rec.review}</p>
            {rec.retrievalEvidence?.length > 0 && (
              <details className="mt-2 text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-300">Catalog evidence used</summary>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {rec.retrievalEvidence.map((evidence) => <li key={evidence}>{evidence}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Price & actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="font-bold">₹{product.price?.toLocaleString('en-IN')}</span>
            {product.comparePrice > product.price && (
              <span className="text-xs text-gray-500 line-through">₹{product.comparePrice?.toLocaleString('en-IN')}</span>
            )}
            {product.averageRating > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                {product.averageRating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Link to={`/products/${product.slug}`}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-300 transition-colors font-medium">
              View <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
