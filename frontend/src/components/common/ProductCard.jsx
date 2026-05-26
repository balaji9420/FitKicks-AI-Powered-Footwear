import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, Star, Zap, GitCompare } from 'lucide-react'
import { addToCart } from '../../redux/slices/cartSlice'
import { toggleWishlist } from '../../redux/slices/wishlistSlice'
import { addToCompare } from '../../redux/slices/uiSlice'
import { selectWishlistIds } from '../../redux/slices/wishlistSlice'
import { selectIsAuthenticated } from '../../redux/slices/authSlice'
import { useNavigate } from 'react-router-dom'

export default function ProductCard({ product, showAIBadge = false, aiScore = null }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const wishlistIds = useSelector(selectWishlistIds)
  const isWishlisted = wishlistIds.includes(product._id)

  const primaryImage = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url || '/placeholder-shoe.jpg'
  const hoverImage = product.images?.[1]?.url

  const handleWishlist = (e) => {
    e.preventDefault()
    if (!isAuthenticated) { navigate('/login'); return }
    dispatch(toggleWishlist(product._id))
  }

  const handleAddToCart = (e) => {
    e.preventDefault()
    if (!isAuthenticated) { navigate('/login'); return }
    // Navigate to product page for size selection
    navigate(`/products/${product.slug}`)
  }

  const handleCompare = (e) => {
    e.preventDefault()
    dispatch(addToCompare(product))
  }

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : product.discountPercentage

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="product-card group relative"
    >
      <Link to={`/products/${product.slug}`} className="block">
        {/* Image Container */}
        <div className="relative overflow-hidden aspect-square bg-dark-300">
          <img
            src={primaryImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-opacity duration-500 ${hoverImage ? 'group-hover:opacity-0' : ''}`}
          />
          {hoverImage && (
            <img
              src={hoverImage}
              alt={product.name}
              className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNewArrival && (
              <span className="badge bg-accent/20 text-accent border border-accent/30 text-[10px]">NEW</span>
            )}
            {product.isLimitedEdition && (
              <span className="badge bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px]">LIMITED</span>
            )}
            {product.isFlashSale && (
              <span className="badge-warning text-[10px] flex items-center gap-1">
                <Zap size={10} /> SALE
              </span>
            )}
            {discount > 0 && !product.isFlashSale && (
              <span className="badge-danger text-[10px]">{discount}% OFF</span>
            )}
          </div>

          {/* AI Score badge */}
          {showAIBadge && aiScore && (
            <div className="absolute top-3 right-3">
              <div className="bg-primary rounded-xl px-2.5 py-1 text-xs font-bold text-white shadow-glow">
                {aiScore}% Match
              </div>
            </div>
          )}

          {/* Action buttons on hover */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
            <button onClick={handleWishlist}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-colors ${
                isWishlisted ? 'bg-red-500 text-white' : 'bg-dark-200/90 backdrop-blur-sm text-gray-300 hover:text-red-400'
              }`}>
              <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleCompare}
              className="w-9 h-9 rounded-xl bg-dark-200/90 backdrop-blur-sm text-gray-300 hover:text-accent flex items-center justify-center shadow-lg transition-colors">
              <GitCompare size={15} />
            </button>
          </div>

          {/* Quick Add */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button onClick={handleAddToCart}
              className="w-full bg-primary hover:bg-primary-600 text-white text-sm font-semibold py-3 flex items-center justify-center gap-2 transition-colors">
              <ShoppingBag size={14} /> Quick Add
            </button>
          </div>

          {/* Out of stock overlay */}
          {!product.isInStock && (
            <div className="absolute inset-0 bg-dark/70 flex items-center justify-center">
              <span className="badge-danger">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">{product.brand?.name}</p>
          <h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.totalReviews > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-gray-400">
                {product.averageRating?.toFixed(1)} ({product.totalReviews})
              </span>
            </div>
          )}

          {/* AI match reasons */}
          {showAIBadge && aiScore && (
            <div className="mt-2 text-xs text-primary/80 line-clamp-1">
              ✨ Matches your outfit style
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-white">₹{product.price?.toLocaleString('en-IN')}</span>
            {product.comparePrice > product.price && (
              <span className="text-xs text-gray-500 line-through">₹{product.comparePrice?.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
