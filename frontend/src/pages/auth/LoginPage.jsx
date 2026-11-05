import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { clearError, loginUser, selectAuth, setRegistrationPending } from '../../redux/slices/authSlice'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector(selectAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(loginUser(form))
    if (!result.error) {
      navigate('/')
    } else if (result.payload?.requiresVerification) {
      dispatch(setRegistrationPending({ userId: result.payload.userId }))
      navigate('/verify-email')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-1">Welcome back 👟</h2>
      <p className="text-gray-400 text-sm mb-8">Sign in to your FitKicks account</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
          <input type="email" value={form.email} autoComplete="username"
            onChange={e => { dispatch(clearError()); setForm(f => ({ ...f, email: e.target.value })) }}
            className="input-field" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={form.password} autoComplete="current-password"
              onChange={e => { dispatch(clearError()); setForm(f => ({ ...f, password: e.target.value })) }}
              className="input-field pr-10" placeholder="••••••••" required />
            <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline mt-1 block text-right">
            Forgot password?
          </Link>
        </div>
        {error && <p role="alert" className="text-sm text-red-400" aria-live="polite">{error}</p>}
        <button type="submit" disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
          {isLoading ? <><Loader2 size={16} className="animate-spin" />Signing in...</> : 'Sign In'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Sign up</Link>
      </p>
    </div>
  )
}
