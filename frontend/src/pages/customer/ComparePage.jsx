import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { X, Star, ShoppingBag, Check, Minus } from 'lucide-react'
import { selectUI, removeFromCompare } from '../../redux/slices/uiSlice'

const COMPARE_ATTRS = [
  { label: 'Price',   key: 'price',     fmt: v => v ? `₹${v.toLocaleString('en-IN')}` : '—' },
  { label: 'Brand',   key: 'brand',     fmt: v => v?.name || '—' },
  { label: 'Rating',  key: 'averageRating', fmt: v => v ? `${v.toFixed(1)} ★` : '—' },
  { label: 'Reviews', key: 'totalReviews', fmt: v => v || '—' },
  { label: 'Shoe Type', key: 'shoeType', fmt: v => v?.replace(/-/g,' ') || '—' },
  { label: 'Gender',  key: 'gender',    fmt: v => v || '—' },
  { label: 'In Stock', key: 'isInStock', fmt: v => v ? '✓ Yes' : '✗ No' },
]

export default function ComparePage() {
  const dispatch = useDispatch()
  const { compareList } = useSelector(selectUI)

  if (compareList.length === 0) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
      <div className="text-6xl">⚖️</div>
      <h2 className="text-2xl font-bold">Nothing to compare</h2>
      <p className="text-gray-400 text-sm">Add products to compare from the product listings</p>
      <Link to="/products" className="btn-primary">Browse Products</Link>
    </div>
  )

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-display font-bold mb-8">Compare Products</h1>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-3 text-sm text-gray-500 w-32">Feature</th>
                {compareList.map(p => (
                  <th key={p._id} className="p-3 min-w-48">
                    <div className="relative card p-3">
                      <button onClick={() => dispatch(removeFromCompare(p._id))}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-dark-400 flex items-center justify-center text-gray-400 hover:text-white">
                        <X size={10} />
                      </button>
                      <Link to={`/products/${p.slug}`}>
                        <img src={p.images?.[0]?.url} alt={p.name} className="w-full aspect-square object-cover rounded-xl mb-2 bg-dark-300" />
                        <p className="text-xs font-medium line-clamp-2 hover:text-primary transition-colors">{p.name}</p>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ATTRS.map(({ label, key, fmt }) => (
                <tr key={key} className="border-t border-white/5">
                  <td className="p-3 text-sm text-gray-500">{label}</td>
                  {compareList.map(p => (
                    <td key={p._id} className="p-3 text-sm text-center font-medium">
                      {fmt(p[key])}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-white/5">
                <td className="p-3 text-sm text-gray-500">Action</td>
                {compareList.map(p => (
                  <td key={p._id} className="p-3 text-center">
                    <Link to={`/products/${p.slug}`} className="btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1 mx-auto w-fit">
                      <ShoppingBag size={12} /> View
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
