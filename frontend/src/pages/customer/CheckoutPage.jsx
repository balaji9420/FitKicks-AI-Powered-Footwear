import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, CreditCard, Truck, CheckCircle, Plus, Loader2, Shield } from 'lucide-react'
import { selectUser } from '../../redux/slices/authSlice'
import { selectCartItems, selectCartSubtotal, selectCart, fetchCart } from '../../redux/slices/cartSlice'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STEPS = ['address', 'payment', 'review']

export default function CheckoutPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const items = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartSubtotal)
  const { couponDiscount, couponCode } = useSelector(selectCart)

  const [step, setStep] = useState(0)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [isPlacing, setIsPlacing] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({ label:'Home', fullName:'', phone:'', street:'', city:'', state:'', pincode:'', country:'India' })

  const shippingCost = subtotal >= 999 ? 0 : 99
  const taxAmount = Math.round(subtotal * 0.18)
  const total = subtotal + shippingCost + taxAmount - (couponDiscount || 0)

  useEffect(() => {
    dispatch(fetchCart())
    if (user?.addresses?.length > 0) {
      const def = user.addresses.find(a => a.isDefault) || user.addresses[0]
      setSelectedAddress(def)
    }
  }, [])

  useEffect(() => { if (items.length === 0) navigate('/cart') }, [items])

  const handleAddAddress = async () => {
    try {
      const res = await api.post('/users/addresses', newAddress)
      toast.success('Address saved!')
      setShowAddAddress(false)
      setSelectedAddress(res.data.data.addresses[res.data.data.addresses.length - 1])
    } catch { toast.error('Failed to save address') }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Select a delivery address'); return }
    setIsPlacing(true)
    try {
      const orderItems = items.map(i => ({
        product: i.product?._id, size: i.size, color: i.color, quantity: i.quantity
      }))

      if (paymentMethod === 'razorpay') {
        const rpRes = await api.post('/payments/create-razorpay-order', { amount: total })
        const rpOrder = rpRes.data.data.order
        const options = {
          key: rpRes.data.data.key,
          amount: rpOrder.amount,
          currency: 'INR',
          name: 'FitKicks',
          description: 'Premium Footwear',
          order_id: rpOrder.id,
          handler: async (response) => {
            await api.post('/payments/verify-razorpay', response)
            const orderRes = await api.post('/orders', {
              shippingAddress: selectedAddress, paymentMethod,
              items: orderItems, couponCode,
              paymentId: response.razorpay_payment_id,
            })
            navigate(`/order-success/${orderRes.data.data.order._id}`)
          },
          prefill: { name: `${user.firstName} ${user.lastName}`, email: user.email, contact: user.phone || '' },
          theme: { color: '#FF6B35' },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        const res = await api.post('/orders', { shippingAddress: selectedAddress, paymentMethod: 'cod', items: orderItems, couponCode })
        navigate(`/order-success/${res.data.data.order._id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed')
    } finally { setIsPlacing(false) }
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-display font-bold mb-8">Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {['Delivery', 'Payment', 'Review'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                i === step ? 'bg-primary text-white' : i < step ? 'bg-green-500/20 text-green-400' : 'bg-dark-300 text-gray-500'
              }`}>
                {i < step ? <CheckCircle size={14} /> : <span className="w-4 h-4 flex items-center justify-center text-xs">{i+1}</span>}
                {label}
              </div>
              {i < 2 && <div className="h-px w-8 bg-white/10 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Step 0: Address */}
            {step === 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h2 className="font-semibold flex items-center gap-2"><MapPin size={16} className="text-primary" />Delivery Address</h2>
                {user?.addresses?.length > 0 ? (
                  <div className="space-y-3">
                    {user.addresses.map((addr) => (
                      <div key={addr._id} onClick={() => setSelectedAddress(addr)}
                        className={`card p-4 cursor-pointer transition-all ${selectedAddress?._id === addr._id ? 'border-primary/50 bg-primary/5' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${selectedAddress?._id === addr._id ? 'bg-primary border-primary' : 'border-gray-500'}`} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{addr.fullName}</span>
                                <span className="badge-primary text-xs">{addr.label}</span>
                                {addr.isDefault && <span className="text-xs text-gray-500">Default</span>}
                              </div>
                              <p className="text-sm text-gray-400 leading-relaxed">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                              <p className="text-sm text-gray-500 mt-1">{addr.phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-sm">No saved addresses. Add one below.</p>}

                {!showAddAddress ? (
                  <button onClick={() => setShowAddAddress(true)} className="flex items-center gap-2 text-primary text-sm hover:text-primary-300 transition-colors">
                    <Plus size={14} /> Add New Address
                  </button>
                ) : (
                  <div className="card p-5 space-y-3">
                    <h3 className="font-medium text-sm">New Address</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[['fullName','Full Name'],['phone','Phone'],['street','Street Address'],['city','City'],['state','State'],['pincode','Pincode']].map(([key, label]) => (
                        <div key={key} className={key === 'street' ? 'col-span-2' : ''}>
                          <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                          <input className="input-field py-2 text-sm" value={newAddress[key]}
                            onChange={e => setNewAddress(p => ({...p, [key]: e.target.value}))} placeholder={label} />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddAddress} className="btn-primary text-sm py-2 px-4">Save Address</button>
                      <button onClick={() => setShowAddAddress(false)} className="btn-ghost text-sm py-2 px-4">Cancel</button>
                    </div>
                  </div>
                )}

                <button disabled={!selectedAddress} onClick={() => setStep(1)}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  Continue to Payment
                </button>
              </motion.div>
            )}

            {/* Step 1: Payment */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h2 className="font-semibold flex items-center gap-2"><CreditCard size={16} className="text-primary" />Payment Method</h2>
                {[
                  { id: 'razorpay', label: 'Online Payment', sub: 'Credit/Debit, UPI, Net Banking', icon: '💳' },
                  { id: 'cod',      label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: '💵' },
                ].map(({ id, label, sub, icon }) => (
                  <div key={id} onClick={() => setPaymentMethod(id)}
                    className={`card p-4 cursor-pointer flex items-center gap-4 transition-all ${paymentMethod === id ? 'border-primary/50 bg-primary/5' : ''}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${paymentMethod === id ? 'bg-primary border-primary' : 'border-gray-500'}`} />
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                    {id === 'razorpay' && <div className="ml-auto flex items-center gap-1 text-xs text-green-400"><Shield size={12} /> Secure</div>}
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(0)} className="btn-ghost flex-1">← Back</button>
                  <button onClick={() => setStep(2)} className="btn-primary flex-1">Review Order</button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h2 className="font-semibold flex items-center gap-2"><CheckCircle size={16} className="text-primary" />Review Order</h2>
                <div className="card p-4 space-y-3">
                  {items.map(item => (
                    <div key={item._id} className="flex items-center gap-3">
                      <img src={item.product?.images?.[0]?.url} alt={item.name} className="w-14 h-14 rounded-xl object-cover bg-dark-300 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-400">Size {item.size} · Qty {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
                <div className="card p-4 text-sm space-y-1.5">
                  <p className="font-medium mb-2 flex items-center gap-2"><MapPin size={13} className="text-primary" />Delivering to</p>
                  <p className="text-gray-400">{selectedAddress?.fullName} · {selectedAddress?.phone}</p>
                  <p className="text-gray-400">{selectedAddress?.street}, {selectedAddress?.city} - {selectedAddress?.pincode}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-ghost flex-1">← Back</button>
                  <button onClick={handlePlaceOrder} disabled={isPlacing}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                    {isPlacing ? <><Loader2 size={16} className="animate-spin" />Placing...</> : `Place Order · ₹${total.toLocaleString('en-IN')}`}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Price Summary sidebar */}
          <div className="card p-5 space-y-3 h-fit sticky top-24">
            <h3 className="font-semibold border-b border-white/5 pb-3">Price Summary</h3>
            {[
              ['Subtotal', `₹${subtotal.toLocaleString('en-IN')}`],
              ['Shipping', shippingCost === 0 ? 'FREE' : `₹${shippingCost}`],
              ['GST (18%)', `₹${taxAmount.toLocaleString('en-IN')}`],
              ...(couponDiscount ? [['Coupon', `-₹${couponDiscount}`]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-400">{k}</span>
                <span className={k === 'Shipping' && shippingCost === 0 ? 'text-green-400 font-medium' : k === 'Coupon' ? 'text-green-400' : ''}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-3">
              <span>Total</span>
              <span className="text-primary">₹{Math.max(0, total).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
