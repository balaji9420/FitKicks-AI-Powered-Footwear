import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { clearError, forgotPassword, selectAuth } from '../../redux/slices/authSlice'

export default function ForgotPasswordPage() {
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector(selectAuth)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(forgotPassword({ email }))
    if (!result.error) setSent(true)
  }

  if (sent) return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/20 flex items-center justify-center mx-auto mb-5">
        <Mail size={28} className="text-[#FF6B35]" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
      <p className="text-gray-400 text-sm mb-6">
        If a FitKicks account uses <strong className="text-white">{email}</strong>, a reset link is on its way.
      </p>
      <p className="text-gray-500 text-sm mb-6">
        Check your inbox and spam folder. The link expires in 30 minutes. If it doesn’t arrive, confirm this is the email you used to register and try again.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button type="button" onClick={() => { setSent(false); dispatch(clearError()) }}
          className="inline-flex items-center justify-center gap-2 border border-white/10 text-white font-semibold px-5 py-3 rounded-xl hover:bg-white/5 transition-colors">
          <Mail size={16} /> Try again
        </button>
        <Link to="/login"
          className="inline-flex items-center justify-center gap-2 bg-[#FF6B35] text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#e55a2b] transition-colors">
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </div>
    </div>
  )

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Forgot Password?</h2>
      <p className="text-gray-400 text-sm mb-8">Enter your email and we'll send a reset link</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Email Address</label>
          <input
            type="email" required
            value={email} autoComplete="email" onChange={(e) => { dispatch(clearError()); setEmail(e.target.value) }}
            className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-[#FF6B35] transition-colors"
            placeholder="you@example.com"
          />
        </div>
        {error && <p role="alert" className="text-sm text-red-400" aria-live="polite">{error}</p>}
        <button type="submit" disabled={isLoading}
          className="w-full bg-[#FF6B35] text-white font-semibold py-3 rounded-xl hover:bg-[#e55a2b] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {isLoading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        <Link to="/login" className="text-[#FF6B35] hover:underline flex items-center justify-center gap-1">
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </p>
    </div>
  )
}
