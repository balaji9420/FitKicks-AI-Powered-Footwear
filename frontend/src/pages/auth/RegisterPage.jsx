import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { registerUser, selectAuth } from '../../redux/slices/authSlice'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, registrationPending } = useSelector(selectAuth)
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', phone:'', referralCode:'' })
  const [showPw, setShowPw] = useState(false)

  if (registrationPending) {
    navigate('/verify-email')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(registerUser(form))
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-1">Create Account 🎉</h2>
      <p className="text-gray-400 text-sm mb-8">Join FitKicks and discover AI-powered shoe matching</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">First Name</label>
            <input className="input-field" placeholder="John" value={form.firstName} onChange={set('firstName')} required />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Last Name</label>
            <input className="input-field" placeholder="Doe" value={form.lastName} onChange={set('lastName')} required />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
          <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Phone (optional)</label>
          <input className="input-field" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="Min. 8 characters"
              value={form.password} onChange={set('password')} required minLength={8} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Referral Code (optional)</label>
          <input className="input-field uppercase" placeholder="Enter referral code"
            value={form.referralCode} onChange={e => setForm(f => ({...f, referralCode: e.target.value.toUpperCase()}))} />
        </div>
        <button type="submit" disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
          {isLoading ? <><Loader2 size={16} className="animate-spin"/>Creating account...</> : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  )
}
