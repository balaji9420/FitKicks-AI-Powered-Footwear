import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { selectUI, closeCart } from '../../redux/slices/uiSlice'
import { selectCartItems, selectCartSubtotal, updateCartItem, removeFromCart } from '../../redux/slices/cartSlice'

export default function CartDrawer() {
  const dispatch = useDispatch()
  const { cartOpen } = useSelector(selectUI)
  const items = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartSubtotal)

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => dispatch(closeCart())}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-dark-100 border-l border-white/5 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-primary" />
                <h2 className="font-semibold text-lg">Your Cart</h2>
                {items.length > 0 && (
                  <span className="badge-primary">{items.length}</span>
                )}
              </div>
              <button
                onClick={() => dispatch(closeCart())}
                className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <ShoppingBag size={24} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-300">Your cart is empty</p>
                    <p className="text-sm text-gray-500 mt-1">Add some awesome shoes!</p>
                  </div>
                  <Link to="/products" onClick={() => dispatch(closeCart())} className="btn-primary text-sm py-2.5 px-5">
                    Browse Products
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="flex gap-3 p-3 rounded-2xl bg-dark-200 border border-white/5"
                  >
                    <img
                      src={item.product?.images?.[0]?.url || '/placeholder-shoe.jpg'}
                      alt={item.product?.name || item.name}
                      className="w-20 h-20 rounded-xl object-cover bg-dark-300 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight line-clamp-2">
                        {item.product?.name || item.name}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-gray-500">Size: {item.size}</span>
                        {item.color && <span className="text-xs text-gray-500">• {item.color}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold text-primary">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))}
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))}
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                          <button
                            onClick={() => dispatch(removeFromCart(item._id))}
                            className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors ml-1"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-white/5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span className={subtotal >= 999 ? 'text-green-400 font-medium' : 'font-medium'}>
                    {subtotal >= 999 ? 'FREE' : '₹99'}
                  </span>
                </div>
                {subtotal < 999 && (
                  <div className="text-xs text-gray-500 text-center bg-primary/10 rounded-lg py-2 px-3">
                    Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free shipping 🚚
                  </div>
                )}
                <Link
                  to="/checkout"
                  onClick={() => dispatch(closeCart())}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </Link>
                <Link
                  to="/cart"
                  onClick={() => dispatch(closeCart())}
                  className="btn-outline w-full text-center text-sm py-2.5 block"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
