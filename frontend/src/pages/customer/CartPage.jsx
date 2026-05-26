import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Trash2, Plus, Minus, Tag, ArrowRight, ChevronLeft, Sparkles } from 'lucide-react'
import { fetchCart, removeFromCart, updateCartItem, applyCoupon, selectCart, selectCartItems, selectCartSubtotal } from '../../redux/slices/cartSlice'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function CartPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, couponCode, couponDiscount } = useSelector(selectCart)
  const items = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartSubtotal)
  const [couponInput, setCouponInput] = useState('')

  useEffect(() => { dispatch(fetchCart()) }, [])

  const shippingCost = subtotal > 0 && subtotal < 999 ? 99 : 0
  const taxAmount = Math.round(subtotal * 0.18)
  const total = subtotal + shippingCost + taxAmount - (couponDiscount || 0)

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) { toast.error('Enter a coupon code'); return }
    dispatch(applyCoupon(couponInput.trim()))
  }

  if (!isLoading && items.length === 0) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-20 h-20 rounded-full bg-dark-200 flex items-center justify-center">
        <ShoppingBag size={32} className="text-gray-500" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-400">Add some awesome shoes to get started!</p>
      </div>
      <Link to="/products" className="btn-primary flex items-center gap-2">
        <ShoppingBag size={16} /> Browse Products
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/products" className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-2xl font-display font-bold">Shopping Cart</h1>
          <span className="badge-primary">{items.length} items</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div key={item._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 50 }}
                  className="card p-4 flex gap-4">
                  <Link to={`/products/${item.product?.slug}`} className="flex-shrink-0">
                    <img src={item.product?.images?.[0]?.url || '/placeholder.jpg'} alt={item.name}
                      className="w-24 h-24 rounded-2xl object-cover bg-dark-300" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product?.slug}`}>
                      <p className="text-xs text-gray-500 mb-0.5">{item.product?.brand?.name}</p>
                      <h3 className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2">{item.name}</h3>
                    </Link>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>Size: {item.size}</span>
                      {item.color && <span>• Color: {item.color}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-white text-lg">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0 bg-dark-300 rounded-xl overflow-hidden">
                          <button onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-dark-400 transition-colors">
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-dark-400 transition-colors">
                            <Plus size={12} />
                          </button>
                        </div>
                        <button onClick={() => dispatch(removeFromCart(item._id))}
                          className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* AI Upsell Banner */}
            <div className="card p-4 bg-gradient-to-r from-primary/10 to-accent/5 border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Get AI-matched accessories!</p>
                  <p className="text-xs text-gray-400">Upload your outfit to find more items that complete your look</p>
                </div>
                <Link to="/ai-style" className="btn-primary text-xs py-2 px-3 flex-shrink-0">Try AI</Link>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-lg">Order Summary</h2>

              {/* Coupon */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Coupon Code</label>
                {couponCode ? (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <Tag size={14} className="text-green-400" />
                    <span className="text-sm text-green-400 font-medium flex-1">{couponCode} applied!</span>
                    <span className="text-sm text-green-400 font-bold">-₹{couponDiscount}</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE" className="input-field py-2 text-sm uppercase flex-1" />
                    <button onClick={handleApplyCoupon} className="btn-outline py-2 px-3 text-sm flex-shrink-0">Apply</button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm border-t border-white/5 pt-4">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({items.length} items)</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? 'text-green-400 font-medium' : ''}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>GST (18%)</span>
                  <span>₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                {subtotal > 0 && subtotal < 999 && (
                  <p className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                    Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free shipping!
                  </p>
                )}
              </div>

              <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-3">
                <span>Total</span>
                <span className="text-primary">₹{Math.max(0, total).toLocaleString('en-IN')}</span>
              </div>

              <button onClick={() => navigate('/checkout')} className="btn-primary w-full flex items-center justify-center gap-2">
                Proceed to Checkout <ArrowRight size={16} />
              </button>
              <Link to="/products" className="block text-center text-sm text-gray-400 hover:text-white transition-colors">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
