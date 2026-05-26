import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react'
import api from '../../services/api'

export default function OrderSuccessPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data.data.order)).catch(console.error)
  }, [id])

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full mx-auto px-4 text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle size={40} className="text-green-400" />
        </motion.div>
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Order Placed! 🎉</h1>
          {order && <p className="text-gray-400">Order <span className="text-primary font-semibold">#{order.orderNumber}</span> confirmed</p>}
        </div>
        {order && (
          <div className="card p-5 text-left space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><Package size={14} className="text-primary" />Order Summary</div>
            {order.items?.slice(0, 3).map(item => (
              <div key={item._id} className="flex items-center gap-3">
                <img src={item.image || item.product?.images?.[0]?.url} alt={item.name} className="w-10 h-10 rounded-xl object-cover bg-dark-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">Size {item.size} · Qty {item.quantity}</p>
                </div>
                <span className="text-xs font-semibold">₹{item.subtotal?.toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold border-t border-white/5 pt-2">
              <span>Total Paid</span>
              <span className="text-primary">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
        <p className="text-sm text-gray-400">A confirmation email has been sent to your registered email address.</p>
        <div className="flex gap-3">
          <Link to="/orders" className="btn-outline flex-1 flex items-center justify-center gap-2">
            <Package size={14} /> Track Order
          </Link>
          <Link to="/" className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Home size={14} /> Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
