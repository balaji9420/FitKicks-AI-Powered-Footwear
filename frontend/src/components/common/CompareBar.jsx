// CompareBar.jsx
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { selectUI, removeFromCompare } from '../../redux/slices/uiSlice'

export function CompareBar() {
  const dispatch = useDispatch()
  const { compareList } = useSelector(selectUI)
  if (compareList.length === 0) return null

  return (
    <motion.div
      initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-dark-100/95 backdrop-blur-md border-t border-white/10 py-3 px-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm text-gray-400 whitespace-nowrap">Compare ({compareList.length}/3):</span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {compareList.map((product) => (
              <div key={product._id} className="flex items-center gap-2 bg-dark-300 rounded-xl px-3 py-1.5 flex-shrink-0">
                <img src={product.images?.[0]?.url} alt={product.name}
                  className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-xs font-medium max-w-20 truncate">{product.name}</span>
                <button onClick={() => dispatch(removeFromCompare(product._id))} className="text-gray-500 hover:text-white ml-1">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
        {compareList.length >= 2 && (
          <Link to="/compare" className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5 flex-shrink-0">
            Compare <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </motion.div>
  )
}

export default CompareBar
