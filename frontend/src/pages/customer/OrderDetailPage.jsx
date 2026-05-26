import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Package, MapPin, CreditCard, Clock, X, Loader2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_STEPS = ['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered']
const STATUS_STYLES = { pending:'text-yellow-400', confirmed:'text-blue-400', processing:'text-purple-400', shipped:'text-cyan-400', out_for_delivery:'text-orange-400', delivered:'text-green-400', cancelled:'text-red-400' }

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data.data.order)).finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return
    setCancelling(true)
    try {
      const r = await api.patch(`/orders/${id}/cancel`, { reason: 'Customer requested cancellation' })
      setOrder(r.data.data.order)
      toast.success('Order cancelled')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel') }
    finally { setCancelling(false) }
  }

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
  if (!order) return <div className="min-h-screen pt-24 text-center"><p className="text-gray-400">Order not found</p></div>

  const currentStep = STATUS_STEPS.indexOf(order.status)
  const canCancel = ['pending','confirmed','processing'].includes(order.status)

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/orders" className="text-gray-400 hover:text-white"><ChevronLeft size={20} /></Link>
          <h1 className="text-xl font-bold">Order #{order.orderNumber}</h1>
          <span className={`badge text-xs ${STATUS_STYLES[order.status] || ''} bg-white/5`}>
            {order.status.replace(/_/g,' ')}
          </span>
        </div>

        <div className="space-y-5">
          {/* Tracking progress */}
          {!['cancelled','refunded'].includes(order.status) && (
            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Package size={14} className="text-primary" />Tracking</h3>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2">
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-1 flex-shrink-0">
                    <div className={`flex flex-col items-center gap-1 ${i <= currentStep ? 'text-primary' : 'text-gray-600'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${i <= currentStep ? 'bg-primary border-primary text-white' : 'border-gray-600'}`}>
                        {i < currentStep ? '✓' : i+1}
                      </div>
                      <span className="text-[10px] capitalize text-center max-w-12 leading-tight">{s.replace(/_/g,' ')}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`h-0.5 w-6 flex-shrink-0 ${i < currentStep ? 'bg-primary' : 'bg-gray-700'}`} />
                    )}
                  </div>
                ))}
              </div>
              {order.trackingNumber && (
                <div className="mt-3 text-xs text-gray-400 bg-dark-300 rounded-xl p-3">
                  Tracking: <span className="text-white font-mono">{order.trackingNumber}</span>
                  {order.shippingPartner && ` · ${order.shippingPartner}`}
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Items Ordered</h3>
            <div className="space-y-3">
              {order.items?.map(item => (
                <div key={item._id} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover bg-dark-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">Size {item.size} · Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0">₹{item.subtotal?.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment */}
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><MapPin size={14} className="text-primary" />Delivery Address</h3>
              <p className="text-sm text-gray-300">{order.shippingAddress?.fullName}</p>
              <p className="text-sm text-gray-400">{order.shippingAddress?.phone}</p>
              <p className="text-sm text-gray-400 mt-1">{order.shippingAddress?.street},<br/>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><CreditCard size={14} className="text-primary" />Payment</h3>
              <p className="text-sm capitalize text-gray-300">{order.paymentMethod.replace(/_/g,' ')}</p>
              <p className={`text-xs mt-1 capitalize ${order.paymentStatus === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>{order.paymentStatus}</p>
              <div className="mt-3 space-y-1 text-xs text-gray-400">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{order.shippingCost === 0 ? 'FREE' : `₹${order.shippingCost}`}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>₹{order.taxAmount?.toLocaleString('en-IN')}</span></div>
                {order.couponDiscount > 0 && <div className="flex justify-between text-green-400"><span>Coupon</span><span>-₹{order.couponDiscount}</span></div>}
                <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-white/5"><span>Total</span><span className="text-primary">₹{order.totalAmount?.toLocaleString('en-IN')}</span></div>
              </div>
            </div>
          </div>

          {canCancel && (
            <button onClick={handleCancel} disabled={cancelling}
              className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {cancelling ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
