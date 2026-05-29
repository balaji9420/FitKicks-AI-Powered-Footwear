import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye, TrendingUp, Star, RefreshCw, Upload } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AdminProductForm from "./AdminProductForm";

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState({ isActive: '', shoeType: '', sort: '-createdAt' })
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 15, sort: filter.sort }
      if (search) params.search = search
      if (filter.isActive !== '') params.isActive = filter.isActive
      if (filter.shoeType) params.shoeType = filter.shoeType
      const res = await api.get('/products', { params })
      setProducts(res.data.data.products)
      setPagination(res.data.data.pagination)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, filter, search])

  const handleToggle = async (id, field) => {
    try {
      const p = products.find(p => p._id === id)
      await api.put(`/products/${id}`, { [field]: !p[field] })
      setProducts(ps => ps.map(p => p._id === id ? { ...p, [field]: !p[field] } : p))
      toast.success('Updated')
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(ps => ps.filter(p => p._id !== id))
      toast.success('Product deactivated')
    } catch { toast.error('Failed') }
  }

  const handleBulkToggle = async (field, value) => {
    if (selected.length === 0) { toast.error('Select products first'); return }
    try {
      await api.patch('/products/admin/bulk-update', { productIds: selected, updates: { [field]: value } })
      load(); setSelected([])
      toast.success(`${selected.length} products updated`)
    } catch { toast.error('Bulk update failed') }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold">Products</h1>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <div className="flex gap-2">
              <button onClick={() => handleBulkToggle('isTrending', true)} className="btn-outline text-xs py-2 px-3 flex items-center gap-1">
                <TrendingUp size={12} /> Set Trending
              </button>
              <button onClick={() => handleBulkToggle('isActive', false)} className="text-xs py-2 px-3 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors">
                Deactivate ({selected.length})
              </button>
            </div>
          )}
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="input-field pl-9 py-2 text-sm w-full" />
        </div>
        {[
          { label: 'Type', key: 'shoeType', opts: [['', 'All Types'], ['sneakers', 'Sneakers'], ['running', 'Running'], ['sports', 'Sports'], ['casual', 'Casual'], ['formal', 'Formal'], ['limited-edition', 'Limited Edition']] },
          { label: 'Status', key: 'isActive', opts: [['', 'All'], ['true', 'Active'], ['false', 'Inactive']] },
          { label: 'Sort', key: 'sort', opts: [['-createdAt', 'Newest'], ['-totalSold', 'Top Selling'], ['-averageRating', 'Top Rated'], ['price', 'Price ↑'], ['-price', 'Price ↓']] },
        ].map(({ label, key, opts }) => (
          <select key={key} value={filter[key]} onChange={e => setFilter(p => ({ ...p, [key]: e.target.value }))}
            className="input-field py-2 text-sm w-auto">
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <button onClick={load} className="btn-ghost text-sm py-2 px-3 flex items-center gap-1"><RefreshCw size={13} /></button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-300 border-b border-white/5">
              <tr>
                <th className="p-3 text-left">
                  <input type="checkbox" checked={selected.length === products.length && products.length > 0}
                    onChange={e => setSelected(e.target.checked ? products.map(p => p._id) : [])}
                    className="accent-primary" />
                </th>
                <th className="p-3 text-left text-gray-400 font-medium">Product</th>
                <th className="p-3 text-left text-gray-400 font-medium">Type</th>
                <th className="p-3 text-left text-gray-400 font-medium">Price</th>
                <th className="p-3 text-left text-gray-400 font-medium">Stock</th>
                <th className="p-3 text-left text-gray-400 font-medium">Rating</th>
                <th className="p-3 text-left text-gray-400 font-medium">Flags</th>
                <th className="p-3 text-left text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(8)].map((_, j) => <td key={j} className="p-3"><div className="h-4 bg-dark-300 rounded" /></td>)}
                </tr>
              )) : products.map((product) => (
                <motion.tr key={product._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="hover:bg-dark-300/50 transition-colors">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.includes(product._id)}
                      onChange={e => setSelected(ps => e.target.checked ? [...ps, product._id] : ps.filter(id => id !== product._id))}
                      className="accent-primary" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={product.images?.[0]?.url} alt={product.name} className="w-10 h-10 rounded-xl object-cover bg-dark-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-40">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.brand?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 capitalize text-gray-400">{product.shoeType?.replace(/-/g, ' ')}</td>
                  <td className="p-3 font-semibold">₹{product.price?.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <span className={`badge text-xs ${product.totalStock === 0 ? 'badge-danger' : product.totalStock < 5 ? 'badge-warning' : 'badge-success'}`}>
                      {product.totalStock}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-1 text-yellow-400 text-xs">
                      <Star size={10} fill="currentColor" /> {product.averageRating?.toFixed(1) || '—'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {product.isTrending && <span className="badge bg-orange-500/20 text-orange-400 text-[10px]">🔥</span>}
                      {product.isNewArrival && <span className="badge bg-blue-500/20 text-blue-400 text-[10px]">NEW</span>}
                      {product.isBestSeller && <span className="badge bg-yellow-500/20 text-yellow-400 text-[10px]">⭐</span>}
                      {product.isFlashSale && <span className="badge bg-red-500/20 text-red-400 text-[10px]">⚡</span>}
                      {!product.isActive && <span className="badge-danger text-[10px]">OFF</span>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleToggle(product._id, 'isTrending')} title="Toggle Trending"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${product.isTrending ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-500 hover:text-orange-400'}`}>
                        <TrendingUp size={11} />
                      </button>
                      <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer"
                        className="w-7 h-7 rounded-lg bg-white/5 text-gray-500 hover:text-white flex items-center justify-center transition-colors">
                        <Eye size={11} />
                      </a>
                      <button onClick={() => handleDelete(product._id)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <span className="text-xs text-gray-500">Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-dark-300 text-sm disabled:opacity-40">←</button>
              {[...Array(Math.min(pagination.pages, 5))].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm ${page === i + 1 ? 'bg-primary text-white' : 'bg-dark-300 text-gray-400 hover:bg-dark-400'}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-dark-300 text-sm disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>
      {showForm && (
        <AdminProductForm
          onClose={() => setShowForm(false)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
