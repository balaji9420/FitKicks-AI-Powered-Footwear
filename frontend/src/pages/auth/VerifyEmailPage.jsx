import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Loader2, Mail } from 'lucide-react'
import { verifyEmail, resendOTP, selectAuth } from '../../redux/slices/authSlice'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { isLoading, registrationPending } = useSelector(selectAuth)

  const [otp,     setOtp]     = useState(['', '', '', '', '', ''])
  const [resending, setResending] = useState(false)
  const inputRefs = [
    useRef(null), useRef(null), useRef(null),
    useRef(null), useRef(null), useRef(null),
  ]

  useEffect(() => {
    inputRefs[0].current?.focus()
  }, [])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) inputRefs[index + 1].current?.focus()
    // Auto-submit when all 6 filled
    if (value && index === 5) {
      const code = [...next].join('')
      if (code.length === 6) handleSubmit(code)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const next = pasted.split('')
      setOtp(next)
      inputRefs[5].current?.focus()
      handleSubmit(pasted)
    }
  }

  const handleSubmit = async (code) => {
    const finalCode = code || otp.join('')
    if (finalCode.length < 6) { toast.error('Enter all 6 digits'); return }
    if (!registrationPending?.userId) { toast.error('Session expired. Please register again.'); navigate('/register'); return }
    const result = await dispatch(verifyEmail({ userId: registrationPending.userId, otp: finalCode }))
    if (!result.error) navigate('/')
  }

  const handleResend = async () => {
    if (!registrationPending?.userId) return
    setResending(true)
    await dispatch(resendOTP({ userId: registrationPending.userId }))
    setResending(false)
    setOtp(['', '', '', '', '', ''])
    inputRefs[0].current?.focus()
  }

  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/20 flex items-center justify-center mb-5">
        <Mail size={24} className="text-[#FF6B35]" />
      </div>
      <h2 className="text-2xl font-bold mb-1">Verify Your Email</h2>
      <p className="text-gray-400 text-sm mb-8">
        Enter the 6-digit OTP sent to your email address
      </p>

      <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={inputRefs[i]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-11 h-14 text-center text-xl font-bold bg-[#222] border-2 rounded-xl outline-none
              border-white/10 focus:border-[#FF6B35] transition-colors text-white"
          />
        ))}
      </div>

      <button
        onClick={() => handleSubmit()}
        disabled={isLoading || otp.join('').length < 6}
        className="w-full bg-[#FF6B35] text-white font-semibold py-3 rounded-xl
          hover:bg-[#e55a2b] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isLoading
          ? <><Loader2 size={16} className="animate-spin" /> Verifying...</>
          : 'Verify Email'
        }
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        Didn't receive it?{' '}
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-[#FF6B35] hover:underline disabled:opacity-60"
        >
          {resending ? 'Sending...' : 'Resend OTP'}
        </button>
      </p>
    </div>
  )
}
