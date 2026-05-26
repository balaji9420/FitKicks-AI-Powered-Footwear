import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Heart, Search, User, Menu, X, Sparkles, ChevronDown, LogOut, Package, Settings } from 'lucide-react'
import { selectUser, selectIsAuthenticated, logoutUser } from '../../redux/slices/authSlice'
import { selectCartCount } from '../../redux/slices/cartSlice'
import { toggleCart, toggleSearch } from '../../redux/slices/uiSlice'

const categories = [
  { label: 'Sneakers', href: '/products?shoeType=sneakers' },
  { label: 'Running', href: '/products?shoeType=running' },
  { label: 'Sports', href: '/products?shoeType=sports' },
  { label: 'Casual', href: '/products?shoeType=casual' },
  { label: 'Formal', href: '/products?shoeType=formal' },
  { label: 'Limited Edition', href: '/products?shoeType=limited-edition' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [shopMenuOpen, setShopMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const cartCount = useSelector(selectCartCount)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await dispatch(logoutUser())
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-dark/95 backdrop-blur-md border-b border-white/5 shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 lg:h-18">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-display font-bold text-lg shadow-glow">
              F
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:block">FitKicks</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <NavLink to="/" end className={({ isActive }) => `nav-link text-sm ${isActive ? 'text-white' : ''}`}>
              Home
            </NavLink>

            {/* Shop dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShopMenuOpen(true)}
              onMouseLeave={() => setShopMenuOpen(false)}
            >
              <button className="nav-link text-sm flex items-center gap-1">
                Shop <ChevronDown size={14} className={`transition-transform ${shopMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {shopMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute top-full left-0 mt-2 w-52 bg-dark-200 border border-white/10 rounded-2xl p-2 shadow-card"
                  >
                    {categories.map((cat) => (
                      <Link
                        key={cat.label}
                        to={cat.href}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        {cat.label}
                      </Link>
                    ))}
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <Link
                        to="/products"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-primary hover:bg-primary/10 transition-colors font-medium"
                      >
                        View All Products →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NavLink to="/ai-style" className={({ isActive }) => `nav-link text-sm flex items-center gap-1.5 ${isActive ? 'text-white' : ''}`}>
              <Sparkles size={14} className="text-primary" />
              AI Style Match
            </NavLink>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <button
              onClick={() => dispatch(toggleSearch())}
              className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <Search size={18} />
            </button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link to="/wishlist" className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                <Heart size={18} />
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={() => dispatch(toggleCart())}
              className="relative p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-white text-xs flex items-center justify-center font-bold"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </motion.span>
              )}
            </button>

            {/* User */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-dark-200 border border-white/10 rounded-2xl p-2 shadow-card"
                    >
                      <div className="px-3 py-2 border-b border-white/5 mb-1">
                        <div className="text-sm font-medium">{user?.firstName} {user?.lastName}</div>
                        <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                      </div>
                      {[
                        { to: '/profile', icon: Settings, label: 'My Profile' },
                        { to: '/orders', icon: Package, label: 'My Orders' },
                        { to: '/wishlist', icon: Heart, label: 'Wishlist' },
                      ].map(({ to, icon: Icon, label }) => (
                        <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                          <Icon size={14} />
                          {label}
                        </Link>
                      ))}
                      {user?.role === 'admin' && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-primary hover:bg-primary/10 transition-colors">
                          <Settings size={14} />
                          Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-white/5 mt-1 pt-1">
                        <button onClick={handleLogout}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full">
                          <LogOut size={14} />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:flex items-center gap-1.5 btn-primary py-2 px-4 text-sm">
                <User size={14} />
                Sign In
              </Link>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-dark-100 border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              <Link to="/" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm hover:bg-white/5 transition-colors">Home</Link>
              <Link to="/products" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm hover:bg-white/5 transition-colors">All Products</Link>
              {categories.map((cat) => (
                <Link key={cat.label} to={cat.href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors pl-6">
                  {cat.label}
                </Link>
              ))}
              <Link to="/ai-style" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-primary hover:bg-primary/10 transition-colors">
                <Sparkles size={14} /> AI Style Match
              </Link>
              {!isAuthenticated && (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full text-center mt-2">
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
