import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag } from 'lucide-react'
import { fetchWishlist, toggleWishlist, selectWishlist } from '../../redux/slices/wishlistSlice'

export default function WishlistPage() {
  const dispatch = useDispatch()
  const { products } = useSelector(selectWishlist)

  useEffect(() => { dispatch(fetchWishlist()) }, [])

  if (products.length === 0) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-full bg-dark-200 flex items-center justify-center">
        <Heart size={28} className="text-gray-500" />
      </div>
      <h2 className="text-xl font-bold">Your wishlist is empty</h2>
      <Link to="/products" className="btn-primary">Browse Products</Link>
    </div>
  )

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-display font-bold">My Wishlist</h1>
          <span className="badge-primary">{products.length} items</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {products.map(({ product, _id }, i) => {
            if (!product) return null
            return (
              <motion.div key={_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="card group relative">
                <Link to={`/products/${product.slug}`} className="block">
                  <div className="relative aspect-square bg-dark-300 overflow-hidden">
                    <img src={product.images?.[0]?.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {!product.isInStock && (
                      <div className="absolute inset-0 bg-dark/70 flex items-center justify-center">
                        <span className="badge-danger">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="font-bold mt-1">₹{product.price?.toLocaleString('en-IN')}</p>
                  </div>
                </Link>
                <div className="px-4 pb-4 flex gap-2">
                  <Link to={`/products/${product.slug}`} className="btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1">
                    <ShoppingBag size={12} /> Add to Cart
                  </Link>
                  <button onClick={() => dispatch(toggleWishlist(product._id))}
                    className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center">
                    <Heart size={14} fill="currentColor" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
