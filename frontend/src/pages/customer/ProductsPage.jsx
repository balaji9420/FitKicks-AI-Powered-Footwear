import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, ChevronDown, Grid3X3, LayoutList } from 'lucide-react'
import { fetchProducts, selectProducts } from '../../redux/slices/productSlice'
import ProductCard from '../../components/common/ProductCard'
import SectionLoader from '../../components/common/SectionLoader'

const SHOE_TYPES = ['sneakers', 'running', 'sports', 'casual', 'formal', 'high-tops', 'limited-edition', 'training', 'basketball', 'lifestyle']
const GENDERS = ['men', 'women', 'unisex', 'kids']
const OCCASIONS = ['casual', 'formal', 'gym', 'party', 'outdoor', 'office', 'sports']
const SIZES = ['UK 6', 'UK 7', 'UK 7.5', 'UK 8', 'UK 8.5', 'UK 9', 'UK 9.5', 'UK 10', 'UK 11', 'UK 12']
const SORT_OPTIONS = [
  { label: 'Newest First', value: '-createdAt' },
  { label: 'Price: Low–High', value: 'price' },
  { label: 'Price: High–Low', value: '-price' },
  { label: 'Best Rated', value: '-averageRating' },
  { label: 'Most Popular', value: '-totalSold' },
  { label: 'Most Reviewed', value: '-totalReviews' },
]

function FilterChip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors"><X size={10} /></button>
    </span>
  )
}

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/5 pb-4 mb-4">
      <button
        className="flex items-center justify-between w-full text-sm font-semibold mb-3 hover:text-primary transition-colors"
        onClick={() => setOpen(!open)}
      >
        {title}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children}
    </div>
  )
}

export default function ProductsPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { list: products, pagination, isLoading } = useSelector(selectProducts)
  const [filterOpen, setFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState('grid')

  // Local filter state (mirrors URL params)
  const [filters, setFilters] = useState({
    shoeType: searchParams.get('shoeType') || '',
    gender: searchParams.get('gender') || '',
    occasion: searchParams.get('occasion') || '',
    size: searchParams.get('size') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    isTrending: searchParams.get('isTrending') || '',
    isNewArrival: searchParams.get('isNewArrival') || '',
    isBestSeller: searchParams.get('isBestSeller') || '',
    isLimitedEdition: searchParams.get('isLimitedEdition') || '',
    isFlashSale: searchParams.get('isFlashSale') || '',
  })
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt')
  const [page, setPage] = useState(1)

  const buildParams = useCallback(() => {
    const p = { sort, page, limit: 20 }
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v })
    const search = searchParams.get('search')
    if (search) p.search = search
    return p
  }, [filters, sort, page, searchParams])

  useEffect(() => {
    const params = buildParams()
    dispatch(fetchProducts(params))
    // Sync URL
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v && k !== 'limit') sp.set(k, v) })
    setSearchParams(sp, { replace: true })
  }, [filters, sort, page])

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }))
    setPage(1)
  }

  const clearAllFilters = () => {
    setFilters({ shoeType: '', gender: '', occasion: '', size: '', minPrice: '', maxPrice: '', minRating: '', isTrending: '', isNewArrival: '', isBestSeller: '', isLimitedEdition: '', isFlashSale: '' })
    setPage(1)
  }

  const activeFilters = Object.entries(filters).filter(([_, v]) => v)

  const FilterPanel = () => (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-6">
        <span className="font-semibold">Filters</span>
        {activeFilters.length > 0 && (
          <button onClick={clearAllFilters} className="text-xs text-primary hover:text-primary-300 transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Quick flags */}
      <FilterSection title="Quick Filters">
        <div className="space-y-2">
          {[
            { key: 'isTrending', label: '🔥 Trending' },
            { key: 'isNewArrival', label: '✨ New Arrivals' },
            { key: 'isBestSeller', label: '⭐ Best Sellers' },
            { key: 'isLimitedEdition', label: '💎 Limited Edition' },
            { key: 'isFlashSale', label: '⚡ Flash Sale' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={!!filters[key]}
                onChange={() => updateFilter(key, filters[key] ? '' : 'true')}
                className="accent-primary rounded" />
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Shoe Type */}
      <FilterSection title="Shoe Type">
        <div className="space-y-1.5">
          {SHOE_TYPES.map((type) => (
            <button key={type} onClick={() => updateFilter('shoeType', type)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm capitalize transition-colors ${filters.shoeType === type ? 'bg-primary/15 text-primary font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
              {type.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Gender */}
      <FilterSection title="Gender">
        <div className="grid grid-cols-2 gap-2">
          {GENDERS.map((g) => (
            <button key={g} onClick={() => updateFilter('gender', g)}
              className={`py-2 rounded-xl text-sm capitalize transition-colors border ${filters.gender === g ? 'border-primary bg-primary/15 text-primary' : 'border-white/10 text-gray-400 hover:border-primary/40 hover:text-white'
                }`}>
              {g}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Occasion */}
      <FilterSection title="Occasion">
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((occ) => (
            <button key={occ} onClick={() => updateFilter('occasion', occ)}
              className={`px-3 py-1.5 rounded-full text-xs capitalize transition-colors ${filters.occasion === occ ? 'bg-primary text-white' : 'bg-dark-300 text-gray-400 hover:text-white'
                }`}>
              {occ}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size">
        <div className="grid grid-cols-3 gap-1.5">
          {SIZES.map((sz) => (
            <button key={sz} onClick={() => updateFilter('size', sz)}
              className={`py-1.5 rounded-lg text-xs transition-colors border ${filters.size === sz ? 'border-primary bg-primary/15 text-primary font-medium' : 'border-white/10 text-gray-500 hover:border-primary/40 hover:text-white'
                }`}>
              {sz}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Min" value={filters.minPrice}
            onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))}
            onBlur={() => setPage(1)}
            className="input-field py-2 text-sm" />
          <span className="text-gray-500 flex-shrink-0">–</span>
          <input type="number" placeholder="Max" value={filters.maxPrice}
            onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
            onBlur={() => setPage(1)}
            className="input-field py-2 text-sm" />
        </div>
      </FilterSection>

      {/* Min Rating */}
      <FilterSection title="Minimum Rating">
        <div className="flex gap-2">
          {[3, 3.5, 4, 4.5].map((r) => (
            <button key={r} onClick={() => updateFilter('minRating', String(r))}
              className={`flex-1 py-2 rounded-xl text-xs transition-colors border ${filters.minRating === String(r) ? 'border-primary bg-primary/15 text-primary' : 'border-white/10 text-gray-400 hover:border-primary/40'
                }`}>
              {r}★+
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  )

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header row */}
        <div className="flex items-center justify-between py-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold">All Products</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {pagination?.total ?? '...'} shoes found
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}
              className="input-field py-2 text-sm w-44">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {/* View toggle */}
            <div className="flex gap-1 p-1 bg-dark-200 rounded-xl">
              <button onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                <Grid3X3 size={14} />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                <LayoutList size={14} />
              </button>
            </div>
            {/* Filter toggle mobile */}
            <button onClick={() => setFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 btn-outline py-2 px-3 text-sm">
              <SlidersHorizontal size={14} /> Filters
              {activeFilters.length > 0 && (
                <span className="w-4 h-4 bg-primary rounded-full text-white text-[10px] flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-4">
            {activeFilters.map(([key, value]) => (
              <FilterChip key={key}
                label={`${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}`}
                onRemove={() => updateFilter(key, '')}
              />
            ))}
            <button onClick={clearAllFilters} className="text-xs text-gray-500 hover:text-white transition-colors px-2">
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar – desktop */}
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
            <FilterPanel />
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(12)].map((_, i) => <SectionLoader key={i} />)}
              </div>
            ) : products.length > 0 ? (
              <>
                <motion.div
                  layout
                  className={`grid gap-4 sm:gap-5 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}
                >
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </motion.div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                      className="px-4 py-2 rounded-xl bg-dark-200 text-sm disabled:opacity-40 hover:bg-dark-300 transition-colors">
                      ← Prev
                    </button>
                    {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                      const p = i + 1
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-xl text-sm transition-colors ${page === p ? 'bg-primary text-white' : 'bg-dark-200 text-gray-400 hover:bg-dark-300 hover:text-white'
                            }`}>
                          {p}
                        </button>
                      )
                    })}
                    <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                      className="px-4 py-2 rounded-xl bg-dark-200 text-sm disabled:opacity-40 hover:bg-dark-300 transition-colors">
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-6xl mb-4">👟</div>
                <h3 className="font-semibold text-lg mb-2">No shoes found</h3>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your filters</p>
                <button onClick={clearAllFilters} className="btn-outline text-sm py-2 px-4">Clear Filters</button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {filterOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50 lg:hidden"
                onClick={() => setFilterOpen(false)} />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30 }}
                className="fixed left-0 top-0 h-full w-80 bg-dark-100 border-r border-white/5 z-50 overflow-y-auto p-5 lg:hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">Filters</span>
                  <button onClick={() => setFilterOpen(false)}>
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>
                <FilterPanel />
                <button onClick={() => setFilterOpen(false)} className="btn-primary w-full mt-4">
                  Show {pagination?.total ?? ''} Results
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
