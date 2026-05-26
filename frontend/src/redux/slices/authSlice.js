import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── Async Thunks ──────────────────────────────────────────────────────────────
export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed')
  }
})

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data)
    if (res.data.accessToken) localStorage.setItem('fk_token', res.data.accessToken)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const verifyEmail = createAsyncThunk('auth/verifyEmail', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/verify-email', data)
    if (res.data.accessToken) localStorage.setItem('fk_token', res.data.accessToken)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Verification failed')
  }
})

export const resendOTP = createAsyncThunk('auth/resendOTP', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/resend-otp', data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to resend OTP')
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout') } catch {}
  localStorage.removeItem('fk_token')
  return null
})

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me')
    return res.data.user
  } catch (err) {
    localStorage.removeItem('fk_token')
    return rejectWithValue('Session expired')
  }
})

// Alias for backwards compatibility
export const fetchMe = fetchCurrentUser

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await api.put('/users/profile', data)
    return res.data.data.user
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed')
  }
})

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/forgot-password', data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed')
  }
})

export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ token, password }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/auth/reset-password/${token}`, { password })
    if (res.data.accessToken) localStorage.setItem('fk_token', res.data.accessToken)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Reset failed')
  }
})

// ─── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: localStorage.getItem('fk_token') || null,
    isLoading: false,
    isInitialized: false,
    error: null,
    registrationPending: null,
  },
  reducers: {
    clearError:  (state) => { state.error = null },
    setToken:    (state, action) => {
      state.accessToken = action.payload
      if (action.payload) localStorage.setItem('fk_token', action.payload)
    },
    updateUser:  (state, action) => { state.user = { ...state.user, ...action.payload } },
  },
  extraReducers: (builder) => {
    const loading = (state)          => { state.isLoading = true; state.error = null }
    const failed  = (state, action)  => { state.isLoading = false; state.error = action.payload }

    builder
      // Register
      .addCase(registerUser.pending,   loading)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.registrationPending = { userId: action.payload.userId }
        toast.success('OTP sent to your email!')
      })
      .addCase(registerUser.rejected,  (state, action) => { failed(state, action); toast.error(action.payload) })

      // Verify Email
      .addCase(verifyEmail.pending,   loading)
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.registrationPending = null
        toast.success('Email verified! Welcome to FitKicks 🎉')
      })
      .addCase(verifyEmail.rejected,  (state, action) => { failed(state, action); toast.error(action.payload) })

      // Login
      .addCase(loginUser.pending,   loading)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        toast.success(`Welcome back, ${action.payload.user?.firstName || 'there'}! 👟`)
      })
      .addCase(loginUser.rejected,  (state, action) => { failed(state, action); toast.error(action.payload) })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null; state.accessToken = null
        toast.success('Logged out successfully')
      })

      // Fetch Current User
      .addCase(fetchCurrentUser.pending, (state) => { state.isLoading = true })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false; state.isInitialized = true; state.user = action.payload
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false; state.isInitialized = true
        state.user = null; state.accessToken = null
      })

      // Update Profile
      .addCase(updateProfile.pending,   loading)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false; state.user = action.payload
        toast.success('Profile updated!')
      })
      .addCase(updateProfile.rejected,  (state, action) => { failed(state, action); toast.error(action.payload) })

      // Forgot Password
      .addCase(forgotPassword.pending,   loading)
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false
        toast.success('Reset link sent! Check your email.')
      })
      .addCase(forgotPassword.rejected,  (state, action) => { failed(state, action); toast.error(action.payload) })

      // Reset Password
      .addCase(resetPassword.pending,   loading)
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        toast.success('Password reset successful!')
      })
      .addCase(resetPassword.rejected,  (state, action) => { failed(state, action); toast.error(action.payload) })
  },
})

export const { clearError, setToken, updateUser } = authSlice.actions

// Selectors
export const selectAuth            = (state) => state.auth
export const selectUser            = (state) => state.auth.user
export const selectIsAuthenticated = (state) => !!state.auth.user
export const selectIsAdmin         = (state) => state.auth.user?.role === 'admin'

export default authSlice.reducer
