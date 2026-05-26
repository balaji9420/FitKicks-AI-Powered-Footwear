import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { resetPassword, selectAuth } from '../../redux/slices/authSlice'

export default function ResetPasswordPage() {
  const { token }    = useParams()
  const dispatch     = useDispatch()
  const navigate     = useNavigate()
  const { isLoading } = useSelector(selectAuth)
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [show,     setShow]     = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    const result = await dispatch(resetPassword({ token, password }))
    if (!result.error) navigate('/')
  }

  const inputClass = "w-full bg-[#222] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-[#FF6B35] transition-colors"

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Reset Password 🔐</h2>
      <p className="text-gray-400 text-sm mb-8">Choose a strong new password</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">New Password</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} required minLength={8}
              className={`${inputClass} pr-10`} placeholder="Min. 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Confirm Password</label>
          <input type="password" required className={inputClass} placeholder="Repeat new password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={isLoading}
          className="w-full bg-[#FF6B35] text-white font-semibold py-3 rounded-xl hover:bg-[#e55a2b] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {isLoading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}
