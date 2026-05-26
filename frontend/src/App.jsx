import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCurrentUser, selectAuth } from './redux/slices/authSlice'

// Layouts
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout    from './layouts/AdminLayout'
import AuthLayout     from './layouts/AuthLayout'

// ── Customer Pages (lazy-loaded) ───────────────────────────────────────────────
const HomePage          = lazy(() => import('./pages/customer/HomePage'))
const ProductsPage      = lazy(() => import('./pages/customer/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage'))
const CartPage          = lazy(() => import('./pages/customer/CartPage'))
const CheckoutPage      = lazy(() => import('./pages/customer/CheckoutPage'))
const OrderSuccessPage  = lazy(() => import('./pages/customer/OrderSuccessPage'))
const WishlistPage      = lazy(() => import('./pages/customer/WishlistPage'))
const AIStylePage       = lazy(() => import('./pages/customer/AIStylePage'))
const ProfilePage       = lazy(() => import('./pages/customer/ProfilePage'))
const OrdersPage        = lazy(() => import('./pages/customer/OrdersPage'))
const OrderDetailPage   = lazy(() => import('./pages/customer/OrderDetailPage'))
const ComparePage       = lazy(() => import('./pages/customer/ComparePage'))

// ── Auth Pages ─────────────────────────────────────────────────────────────────
const LoginPage          = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage       = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('./pages/auth/ResetPasswordPage'))
const VerifyEmailPage    = lazy(() => import('./pages/auth/VerifyEmailPage'))

// ── Admin Pages ────────────────────────────────────────────────────────────────
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProducts     = lazy(() => import('./pages/admin/AdminProducts'))
const AdminOrders       = lazy(() => import('./pages/admin/AdminOrders'))
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'))
const AdminAnalytics    = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminAIAnalytics  = lazy(() => import('./pages/admin/AdminAIAnalytics'))
const AdminCoupons      = lazy(() => import('./pages/admin/AdminCoupons'))
const AdminInventory    = lazy(() => import('./pages/admin/AdminInventory'))

// ── Loader ─────────────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 border-4 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
      <span className="text-gray-400 text-sm tracking-wide">Loading FitKicks...</span>
    </div>
  </div>
)

// ── Route Guards ───────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, isInitialized } = useSelector(selectAuth)
  if (!isInitialized) return <PageLoader />
  return user ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }) => {
  const { user, isInitialized } = useSelector(selectAuth)
  if (!isInitialized) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

const GuestRoute = ({ children }) => {
  const { user } = useSelector(selectAuth)
  return user ? <Navigate to="/" replace /> : children
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const dispatch = useDispatch()
  const { accessToken, isInitialized } = useSelector(selectAuth)

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchCurrentUser())
    } else {
      // No token — mark as initialized so guards don't block forever
      dispatch({ type: 'auth/fetchCurrentUser/rejected' })
    }
  }, [])  // eslint-disable-line

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Customer ────────────────────────────────────── */}
        <Route element={<CustomerLayout />}>
          <Route path="/"                   element={<HomePage />} />
          <Route path="/products"           element={<ProductsPage />} />
          <Route path="/products/:identifier" element={<ProductDetailPage />} />
          <Route path="/ai-style"           element={<AIStylePage />} />
          <Route path="/compare"            element={<ComparePage />} />

          <Route path="/cart"       element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/checkout"   element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
          <Route path="/wishlist"   element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/orders"     element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        </Route>

        {/* ── Auth ────────────────────────────────────────── */}
        <Route element={<AuthLayout />}>
          <Route path="/login"            element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register"         element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/verify-email"     element={<VerifyEmailPage />} />
          <Route path="/forgot-password"  element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        </Route>

        {/* ── Admin ───────────────────────────────────────── */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index               element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"    element={<AdminDashboard />} />
          <Route path="products"     element={<AdminProducts />} />
          <Route path="orders"       element={<AdminOrders />} />
          <Route path="users"        element={<AdminUsers />} />
          <Route path="analytics"    element={<AdminAnalytics />} />
          <Route path="ai-analytics" element={<AdminAIAnalytics />} />
          <Route path="coupons"      element={<AdminCoupons />} />
          <Route path="inventory"    element={<AdminInventory />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Suspense>
  )
}
