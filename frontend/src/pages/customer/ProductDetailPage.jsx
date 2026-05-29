import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag, Star, ChevronRight, Share2, GitCompare, Truck, RefreshCw, Shield, Minus, Plus, ZoomIn } from 'lucide-react'
import { fetchProductDetail, selectProducts } from '../../redux/slices/productSlice'
import { addToCart, selectCart } from '../../redux/slices/cartSlice'
import { toggleWishlist } from '../../redux/slices/wishlistSlice'
import { selectWishlistIds } from '../../redux/slices/wishlistSlice'
import { addToCompare, addRecentlyViewed } from '../../redux/slices/uiSlice'
import { selectIsAuthenticated } from '../../redux/slices/authSlice'
import ProductCard from '../../components/common/ProductCard'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function ProductDetailPage() {
  const { identifier } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentProduct: product, isDetailLoading } = useSelector(selectProducts)
  const wishlistIds = useSelector(selectWishlistIds)
  const { isLoading: cartLoading } = useSelector(selectCart)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const [activeImage, setActiveImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('details')
  const [reviews, setReviews] = useState([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchProductDetail(identifier))
    window.scrollTo(0, 0)
  }, [identifier])

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors?.[0] || null)
      setSelectedSize(null)
      setActiveImage(0)
      dispatch(addRecentlyViewed(product))
    }
  }, [product?._id])

  useEffect(() => {
    if (product && activeTab === 'reviews') {
      loadReviews()
    }
  }, [activeTab, product])

  const loadReviews = async () => {
    if (!product) return
    setReviewLoading(true)
    try {
      const res = await api.get(`/reviews/product/${product._id}`)
      setReviews(res.data.data.reviews || [])
    } catch { }
    finally { setReviewLoading(false) }
  }

  const isWishlisted = wishlistIds.includes(product?._id)

  const handleAddToCart = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    const finalSize = selectedSize || "Default"
    const finalColor = selectedColor || "Black"
    dispatch(addToCart({
      productId: product._id,
      size: finalSize,
      color: finalColor,
      quantity,
    }))
  }

  const handleWishlist = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    dispatch(toggleWishlist(product._id))
  }

  const getSizeStock = (size) => {
    if (!selectedColor) return 0
    return selectedColor.sizeStock?.find(s => s.size === size)?.stock || 0
  }

  if (isDetailLoading) return <ProductDetailLoader />
  if (!product) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-bold mb-2">Product not found</h2>
        <Link to="/products" className="btn-primary mt-4 inline-block">Browse Products</Link>
      </div>
    </div>
  )

  const images = product.images || []
  const primaryImage = images[activeImage]?.url || '/placeholder-shoe.jpg'
  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 py-4">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-white transition-colors">Products</Link>
          <ChevronRight size={12} />
          <Link to={`/products?category=${product.category?._id}`} className="hover:text-white transition-colors capitalize">
            {product.category?.name}
          </Link>
          <ChevronRight size={12} />
          <span className="text-white truncate max-w-40">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">
          {/* ── Image Gallery ────────────────────────────────── */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square bg-dark-200 rounded-3xl overflow-hidden group cursor-zoom-in"
              onClick={() => setZoomOpen(true)}>
              <motion.img
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={primaryImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNewArrival && <span className="badge bg-accent/20 text-accent border border-accent/30 text-xs">NEW</span>}
                {product.isLimitedEdition && <span className="badge bg-purple-500/20 text-purple-400 text-xs">LIMITED</span>}
                {discount > 0 && <span className="badge-danger text-xs">{discount}% OFF</span>}
              </div>
              {/* AI badge */}
              {product.aiStyleTags?.length > 0 && (
                <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                  ✨ AI Pick
                </div>
              )}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-dark/70 backdrop-blur-sm text-white text-xs p-2 rounded-xl flex items-center gap-1">
                  <ZoomIn size={12} /> Zoom
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ─────────────────────────────────── */}
          <div className="space-y-6">
            {/* Brand & Name */}
            <div>
              <Link to={`/products?brand=${product.brand?._id}`}
                className="text-primary text-sm font-semibold hover:text-primary-300 transition-colors">
                {product.brand?.name}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-display font-bold mt-1 leading-tight">{product.name}</h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14}
                    className={i < Math.round(product.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                ))}
              </div>
              <span className="text-sm text-gray-400">
                {product.averageRating?.toFixed(1)} ({product.totalReviews} reviews)
              </span>
              <button onClick={() => setActiveTab('reviews')} className="text-xs text-primary hover:underline">
                Read reviews
              </button>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">₹{product.price?.toLocaleString('en-IN')}</span>
              {product.comparePrice > product.price && (
                <span className="text-gray-500 text-lg line-through">₹{product.comparePrice?.toLocaleString('en-IN')}</span>
              )}
              {discount > 0 && (
                <span className="badge-danger text-sm">{discount}% off</span>
              )}
            </div>

            {/* Stock */}
            <div>
              <span className="badge-success">✓ In Stock</span>
            </div>

            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Color: <span className="text-gray-400 font-normal">{selectedColor?.name}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button key={color.name} onClick={() => { setSelectedColor(color); setSelectedSize(null) }}
                      title={color.name}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor?.name === color.name ? 'border-primary scale-110' : 'border-transparent hover:border-gray-500'
                        }`}
                      style={{ background: color.hex || '#888' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {selectedColor?.sizeStock?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold">
                    Size: <span className="text-gray-400 font-normal">{selectedSize || 'Select'}</span>
                  </label>
                  <Link to="/size-guide" className="text-xs text-primary hover:underline">Size Guide</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedColor.sizeStock.map(({ size, stock }) => {
                    const oos = stock === 0
                    const lowStock = stock > 0 && stock <= 3
                    return (
                      <button key={size} disabled={oos} onClick={() => setSelectedSize(size)}
                        className={`relative px-3 py-2 rounded-xl text-sm border transition-all ${selectedSize === size
                          ? 'border-primary bg-primary/15 text-primary font-semibold'
                          : oos
                            ? 'border-white/5 text-gray-600 cursor-not-allowed line-through'
                            : 'border-white/10 text-gray-300 hover:border-primary/50 hover:text-white'
                          }`}>
                        {size}
                        {lowStock && !oos && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" />
                        )}
                      </button>
                    )
                  })}
                </div>
                {selectedSize && getSizeStock(selectedSize) <= 3 && getSizeStock(selectedSize) > 0 && (
                  <p className="text-xs text-orange-400 mt-2">⚠ Only {getSizeStock(selectedSize)} left in this size!</p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold">Qty:</label>
              <div className="flex items-center gap-0 bg-dark-300 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-dark-400 transition-colors">
                  <Minus size={12} />
                </button>
                <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(10, q + 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-dark-400 transition-colors">
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={cartLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                <ShoppingBag size={16} /> Add to Cart
              </button>
              <button onClick={handleWishlist}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${isWishlisted ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 text-gray-400 hover:border-red-500/50 hover:text-red-400'
                  }`}>
                <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => dispatch(addToCompare(product))}
                className="w-12 h-12 rounded-xl border-2 border-white/20 text-gray-400 hover:border-accent/50 hover:text-accent flex items-center justify-center transition-all">
                <GitCompare size={16} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck, label: 'Free Delivery', sub: 'Orders above ₹999' },
                { icon: RefreshCw, label: '7-day Returns', sub: 'Easy hassle-free' },
                { icon: Shield, label: '100% Authentic', sub: 'Verified products' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center p-3 rounded-xl bg-dark-200">
                  <Icon size={16} className="text-primary mb-1" />
                  <span className="text-xs font-medium">{label}</span>
                  <span className="text-[10px] text-gray-500">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="mt-12">
          <div className="flex gap-1 p-1 bg-dark-200 rounded-2xl w-fit mb-8">
            {['details', 'features', 'reviews'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                  }`}>
                {tab} {tab === 'reviews' && product.totalReviews > 0 && `(${product.totalReviews})`}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {activeTab === 'details' && (
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">{product.description}</p>
                  {product.shortDescription && (
                    <p className="text-gray-400 text-sm mt-4">{product.shortDescription}</p>
                  )}
                </div>
              )}

              {activeTab === 'features' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    ['Shoe Type', product.shoeType?.replace(/-/g, ' ')],
                    ['Gender', product.gender],
                    ['Closure', product.closure],
                    ['Sole', product.sole],
                    ['Material', product.material],
                    ['Height', product.heightType?.replace(/-/g, ' ')],
                    ['Weight', product.weight ? `${product.weight}g` : null],
                    ['Occasion', product.occasion?.join(', ')],
                  ].filter(([_, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex justify-between py-3 border-b border-white/5">
                      <span className="text-gray-500 text-sm">{label}</span>
                      <span className="text-sm font-medium capitalize">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {/* Rating summary */}
                  <div className="flex items-center gap-6 p-6 rounded-2xl bg-dark-200 mb-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary">{product.averageRating?.toFixed(1)}</div>
                      <div className="flex justify-center gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < Math.round(product.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{product.totalReviews} reviews</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((n) => {
                        const count = product.ratingDistribution?.[n] || 0
                        const pct = product.totalReviews ? (count / product.totalReviews * 100) : 0
                        return (
                          <div key={n} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-gray-500">{n}</span>
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 h-1.5 bg-dark-300 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-gray-500">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {reviewLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading reviews...</div>
                  ) : reviews.length > 0 ? (
                    reviews.map((review) => (
                      <ReviewCard key={review._id} review={review} />
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="font-medium">No reviews yet</p>
                      <p className="text-sm mt-1">Be the first to review this product</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Related products */}
        {product.relatedProducts?.length > 0 && (
          <div className="mt-16">
            <h2 className="section-title mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.relatedProducts.slice(0, 4).map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setZoomOpen(false)}>
              <img src={primaryImage} alt={product.name} className="max-w-full max-h-full rounded-2xl object-contain" />
              <button className="absolute top-4 right-4 text-white hover:text-gray-300">
                <X size={24} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
            {review.user?.firstName?.[0]}
          </div>
          <div>
            <div className="text-sm font-medium">{review.user?.firstName} {review.user?.lastName?.[0]}.</div>
            {review.verified && <span className="text-xs text-green-400">✓ Verified Purchase</span>}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
          ))}
        </div>
      </div>
      {review.title && <h4 className="font-semibold text-sm mt-3">{review.title}</h4>}
      <p className="text-gray-300 text-sm mt-2 leading-relaxed">{review.comment}</p>
      {review.size && (
        <div className="flex gap-3 mt-3 text-xs text-gray-500">
          <span>Size: {review.size}</span>
          {review.fit && <span>Fit: {review.fit?.replace(/_/g, ' ')}</span>}
        </div>
      )}
      <div className="text-xs text-gray-600 mt-3">
        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}

function ProductDetailLoader() {
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square rounded-3xl bg-dark-300" />
          <div className="space-y-4">
            <div className="h-4 bg-dark-300 rounded w-1/4" />
            <div className="h-8 bg-dark-300 rounded w-3/4" />
            <div className="h-4 bg-dark-300 rounded w-1/3" />
            <div className="h-10 bg-dark-300 rounded w-1/2" />
            <div className="h-4 bg-dark-300 rounded w-full" />
            <div className="h-4 bg-dark-300 rounded w-5/6" />
            <div className="h-12 bg-dark-300 rounded-xl w-full mt-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
