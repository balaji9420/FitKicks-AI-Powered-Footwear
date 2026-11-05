import { useState, useEffect } from 'react'
import { AlertTriangle, Package, RefreshCw, Pencil, Save, X } from 'lucide-react'
import api from '../../services/api'

export default function AdminInventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('low')
  const [editingProduct, setEditingProduct] = useState(null)
  const [draftColors, setDraftColors] = useState([])
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/products/admin/inventory')
      .then(r => {
        let list = r.data.data.products
        if (filter === 'low') list = list.filter(p => p.totalStock < 10)
        else if (filter === 'oos') list = list.filter(p => p.totalStock === 0)
        setProducts(list)
      }).catch(() => {
        setProducts([])
        toast.error('Failed to load inventory')
      }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const startEditing = (product) => {
    setEditingProduct(product)
    setDraftColors((product.colors || []).map(color => ({
      name: color.name,
      sizeStock: (color.sizeStock || []).map(({ size, stock }) => ({ size, stock })),
    })))
  }

  const updateStock = (colorName, sizeName, stock) => {
    setDraftColors(colors => colors.map(color => color.name !== colorName ? color : {
      ...color,
      sizeStock: color.sizeStock.map(size => size.size === sizeName ? { ...size, stock } : size),
    }))
  }

  const saveInventory = async () => {
    setSaving(true)
    try {
      const res = await api.patch(`/products/admin/${editingProduct._id}/inventory`, { colors: draftColors })
      setProducts(current => current.map(product => product._id === editingProduct._id
        ? { ...product, ...res.data.data.product }
        : product))
      setEditingProduct(null)
      toast.success('Inventory updated')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update inventory')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2"><Package size={22} className="text-primary" />Inventory</h1>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-dark-200 rounded-xl">
            {[['low', 'Low Stock'], ['oos', 'Out of Stock'], ['all', 'All']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === v ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filter === 'low' && (
        <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
          <AlertTriangle size={18} className="text-orange-400 flex-shrink-0" />
          <p className="text-sm text-orange-300">Showing products with fewer than 10 units. Restock soon to avoid lost sales.</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-dark-300 border-b border-white/5">
            <tr>{['Product', 'Brand', 'Type', 'Total Stock', 'Status', 'Actions'].map(h => (
              <th key={h} className="p-3 text-left text-gray-400 font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="p-3"><div className="h-4 bg-dark-300 rounded animate-pulse" /></td>)}</tr>
            )) : products.map(p => (
              <tr key={p._id} className="hover:bg-dark-300/50 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0]?.url} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-dark-400 flex-shrink-0" />
                    <span className="font-medium truncate max-w-48">{p.name}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-400">{p.brand?.name}</td>
                <td className="p-3 text-gray-400 capitalize">{p.shoeType?.replace(/-/g, ' ')}</td>
                <td className="p-3">
                  <span className={`text-lg font-bold ${p.totalStock === 0 ? 'text-red-400' : p.totalStock < 5 ? 'text-orange-400' : 'text-green-400'}`}>
                    {p.totalStock}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`badge text-xs ${p.totalStock === 0 ? 'badge-danger' : p.totalStock < 5 ? 'badge-warning' : 'badge-success'}`}>
                    {p.totalStock === 0 ? 'Out of Stock' : p.totalStock < 5 ? 'Critical' : p.totalStock < 10 ? 'Low' : 'OK'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => startEditing(p)} title={`Edit stock for ${p.name}`} aria-label={`Edit stock for ${p.name}`}
                      className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center">
                      <Pencil size={14} />
                    </button>
                    <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer"
                      className="text-xs text-primary hover:underline">View →</a>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">No products matching this filter</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="inventory-dialog-title"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-dark-200 p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 id="inventory-dialog-title" className="text-lg font-semibold">Update Stock</h2>
                <p className="text-sm text-gray-400 mt-1">{editingProduct.name} · current total: {editingProduct.totalStock}</p>
              </div>
              <button type="button" onClick={() => setEditingProduct(null)} aria-label="Close stock editor"
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            {draftColors.length ? <div className="space-y-5">
              {draftColors.map(color => (
                <div key={color.name} className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-medium mb-3">{color.name}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {color.sizeStock.map(size => (
                      <label key={size.size} className="text-xs text-gray-400">
                        Size {size.size}
                        <input type="number" min="0" max="100000" step="1" value={size.stock}
                          onChange={event => updateStock(color.name, size.size, event.target.value)}
                          className="input-field mt-1 py-2" />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="btn-ghost px-4 py-2">Cancel</button>
                <button type="button" onClick={saveInventory} disabled={saving}
                  className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-60">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Stock'}
                </button>
              </div>
            </div> : <p className="text-sm text-gray-400">No sizes are configured for this product. Add size variants before stocking it.</p>}
          </section>
        </div>
      )}
    </div>
  )
}
