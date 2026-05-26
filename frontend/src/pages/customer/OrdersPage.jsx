import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ChevronRight, Clock } from 'lucide-react'
import api from '../../services/api'

const STATUS_STYLES = {
  pending:          'bg-yellow-500/15 text-yellow-400',
  confirmed:        'bg-blue-500/15 text-blue-400',
  processing:       'bg-purple-500/15 text-purple-400',
  shipped:          'bg-cyan-500/15 text-cyan-400',
  out_for_delivery: 'bg-orange-500/15 text-orange-400',
  delivered:        'bg-green-500/15 text-green-400',
  cancelled:        'bg-red-500/15 text-red-400',
  return_requested: 'bg-amber-500/15 text-amber-400',
  refunded:         'bg-gray-500/15 text-gray-400',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const params = filter !== 'all' ? `?status=${filter}` : ''
    api.get(`/orders/my-orders${params}`)
      .then(r => setOrders(r.data.data.orders || []))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-display font-bold mb-6">My Orders</h1>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-dark-200 rounded-xl mb-6 overflow-x-auto no-scrollbar">
          {['all','pending','confirmed','shipped','delivered','cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize transition-colors ${filter === s ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="text-gray-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No orders found</h3>
            <Link to="/products" className="btn-primary mt-4 inline-block">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/orders/${order._id}`} className="card p-5 block hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Order #{order.orderNumber}</p>
                      <div className="flex items-center gap-2">
                        <span className={`badge text-xs ${STATUS_STYLES[order.status] || 'bg-gray-500/15 text-gray-400'}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-primary">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-0.5">
                        <Clock size={10} /> {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {order.items?.slice(0, 4).map((item, j) => (
                        <img key={j} src={item.image || item.product?.images?.[0]?.url} alt=""
                          className="w-9 h-9 rounded-xl object-cover bg-dark-300 border-2 border-dark-100" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 flex-1">
                      {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight size={14} className="text-gray-500" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
