import { useState, useEffect } from 'react'
import { AlertTriangle, Package, RefreshCw } from 'lucide-react'
import api from '../../services/api'

export default function AdminInventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('low')

  useEffect(() => {
    setLoading(true)
    const params = { limit: 50, sort: 'totalStock' }
    if (filter === 'low') { params.maxPrice = 999999 }
    api.get('/products', { params: { ...params, isActive: 'true' } })
      .then(r => {
        let list = r.data.data.products
        if (filter === 'low') list = list.filter(p => p.totalStock < 10)
        else if (filter === 'oos') list = list.filter(p => p.totalStock === 0)
        setProducts(list)
      }).finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2"><Package size={22} className="text-primary" />Inventory</h1>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-dark-200 rounded-xl">
            {[['low','Low Stock'],['oos','Out of Stock'],['all','All']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter===v?'bg-primary text-white':'text-gray-400 hover:text-white'}`}>
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
            <tr>{['Product','Brand','Type','Total Stock','Status','Actions'].map(h => (
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
                <td className="p-3 text-gray-400 capitalize">{p.shoeType?.replace(/-/g,' ')}</td>
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
                  <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer"
                    className="text-xs text-primary hover:underline">View →</a>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">No products matching this filter</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
