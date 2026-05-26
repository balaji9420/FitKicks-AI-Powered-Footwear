import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, RefreshCw, ChevronDown } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = { pending:'text-yellow-400', confirmed:'text-blue-400', processing:'text-purple-400', packed:'text-indigo-400', shipped:'text-cyan-400', out_for_delivery:'text-orange-400', delivered:'text-green-400', cancelled:'text-red-400', return_requested:'text-amber-400', refunded:'text-gray-400' }
const NEXT_STATUS  = { pending:'confirmed', confirmed:'processing', processing:'packed', packed:'shipped', shipped:'out_for_delivery', out_for_delivery:'delivered' }

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [updating, setUpdating] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 15 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/orders/admin/all', { params })
      setOrders(res.data.data.orders)
      setPagination(res.data.data.pagination)
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, statusFilter])

  const handleStatusUpdate = async (orderId, status) => {
    setUpdating(orderId)
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status })
      setOrders(os => os.map(o => o._id === orderId ? res.data.data.order : o))
      toast.success(`Order updated to ${status.replace(/_/g,' ')}`)
    } catch { toast.error('Failed to update status') }
    finally { setUpdating(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold">Orders</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && load()}
              placeholder="Search order#..." className="input-field pl-9 py-2 text-sm w-44" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-2 text-sm w-auto">
            <option value="">All Status</option>
            {['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','return_requested','refunded'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>
          <button onClick={load} className="btn-ghost py-2 px-3"><RefreshCw size={13} /></button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-300 border-b border-white/5">
              <tr>
                {['Order #','Customer','Items','Amount','Status','Payment','Date','Actions'].map(h => (
                  <th key={h} className="p-3 text-left text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(8)].map((_, j) => <td key={j} className="p-3"><div className="h-4 bg-dark-300 rounded animate-pulse" /></td>)}</tr>
              )) : orders.map(order => (
                <>
                  <motion.tr key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-dark-300/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}>
                    <td className="p-3 font-mono text-xs text-primary">{order.orderNumber}</td>
                    <td className="p-3">
                      <p className="font-medium">{order.user?.firstName} {order.user?.lastName}</p>
                      <p className="text-xs text-gray-500">{order.user?.email}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex -space-x-2">
                        {order.items?.slice(0,3).map((item,i) => (
                          <img key={i} src={item.image || item.product?.images?.[0]?.url} alt="" className="w-7 h-7 rounded-lg object-cover bg-dark-400 border border-dark-200" />
                        ))}
                        {order.items?.length > 3 && <div className="w-7 h-7 rounded-lg bg-dark-400 flex items-center justify-center text-xs text-gray-400 border border-dark-200">+{order.items.length-3}</div>}
                      </div>
                    </td>
                    <td className="p-3 font-semibold">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span className={`badge bg-white/5 text-xs capitalize ${STATUS_COLORS[order.status]||''}`}>
                        {order.status.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs ${order.paymentStatus==='paid'?'text-green-400':order.paymentStatus==='failed'?'text-red-400':'text-yellow-400'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                    <td className="p-3">
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${expandedId===order._id?'rotate-180':''}`} />
                    </td>
                  </motion.tr>
                  {expandedId === order._id && (
                    <tr className="bg-dark-300/30">
                      <td colSpan={8} className="p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Update Status</p>
                            <div className="flex gap-2 flex-wrap">
                              {NEXT_STATUS[order.status] && (
                                <button disabled={updating===order._id} onClick={() => handleStatusUpdate(order._id, NEXT_STATUS[order.status])}
                                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-60">
                                  Mark as {NEXT_STATUS[order.status].replace(/_/g,' ')} →
                                </button>
                              )}
                              {!['cancelled','delivered','refunded'].includes(order.status) && (
                                <button disabled={updating===order._id} onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                  className="text-xs py-1.5 px-3 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10">
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            <span className="text-gray-500">Ship to: </span>
                            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                          </div>
                          {order.trackingNumber && (
                            <div className="text-xs"><span className="text-gray-500">Tracking: </span><code className="text-primary">{order.trackingNumber}</code></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <span className="text-xs text-gray-500">Total: {pagination.total} orders</span>
            <div className="flex gap-1">
              <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 rounded-lg bg-dark-300 text-sm disabled:opacity-40">←</button>
              <span className="px-3 py-1.5 text-sm text-gray-400">Page {page} of {pagination.pages}</span>
              <button disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 rounded-lg bg-dark-300 text-sm disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
