// SearchOverlay.jsx
import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { selectUI, closeSearch } from '../../redux/slices/uiSlice'
import { searchProducts } from '../../redux/slices/productSlice'

const trendingSearches = ['Nike Air Max', 'Adidas Ultraboost', 'Jordan 1', 'Yeezy 350', 'New Balance 550']

export function SearchOverlay() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const dispatch = useDispatch()
  const { searchOpen } = useSelector(selectUI)
  const inputRef = useRef(null)

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 100)
    else { setQuery(''); setResults([]) }
  }, [searchOpen])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      const result = await dispatch(searchProducts(query))
      if (result.payload) setResults(result.payload.slice(0, 6))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <AnimatePresence>
      {searchOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            onClick={() => dispatch(closeSearch())}
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 bg-dark-100 border-b border-white/10 p-4 sm:p-6"
          >
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                <Search size={20} className="text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for shoes, brands, styles..."
                  className="flex-1 bg-transparent text-lg outline-none placeholder-gray-500"
                />
                <button onClick={() => dispatch(closeSearch())} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Results or trending */}
              <div className="mt-4">
                {results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map((product) => (
                      <Link key={product._id} to={`/products/${product.slug}`}
                        onClick={() => dispatch(closeSearch())}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <img src={product.images?.[0]?.url} alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-dark-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.brand?.name}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary">₹{product.price?.toLocaleString('en-IN')}</span>
                        <ArrowRight size={14} className="text-gray-500" />
                      </Link>
                    ))}
                    <Link to={`/products?search=${query}`} onClick={() => dispatch(closeSearch())}
                      className="flex items-center justify-center gap-2 p-3 text-sm text-primary hover:bg-primary/10 rounded-xl transition-colors mt-2">
                      View all results for "{query}" <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5"><TrendingUp size={12} /> Trending Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {trendingSearches.map((term) => (
                        <button key={term} onClick={() => setQuery(term)}
                          className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-sm transition-colors">
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SearchOverlay
