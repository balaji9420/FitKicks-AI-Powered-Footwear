import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { loginUser, selectAuth } from '../../redux/slices/authSlice'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading } = useSelector(selectAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(loginUser(form))
    if (!result.error) navigate('/')
  }

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-1">Welcome back 👟</h2>
      <p className="text-gray-400 text-sm mb-8">Sign in to your FitKicks account</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
          <input type="email" value={form.email}
            onChange={e => setForm(f => ({...f, email: e.target.value}))}
            className="input-field" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))}
              className="input-field pr-10" placeholder="••••••••" required />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline mt-1 block text-right">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
          {isLoading ? <><Loader2 size={16} className="animate-spin"/>Signing in...</> : 'Sign In'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Sign up</Link>
      </p>
    </div>
  )
}
