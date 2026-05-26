import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart')
    return data.data.cart
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const addToCart = createAsyncThunk('cart/add', async (item, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/add', item)
    toast.success('Added to cart!')
    return data.data.cart
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to add to cart')
    return rejectWithValue(err.response?.data?.message)
  }
})

export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/cart/update/${itemId}`, { quantity })
    return data.data.cart
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const removeFromCart = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/cart/remove/${itemId}`)
    toast.success('Removed from cart')
    return data.data.cart
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const applyCoupon = createAsyncThunk('cart/applyCoupon', async (code, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/apply-coupon', { code })
    toast.success(data.message)
    return data.data
  } catch (err) {
    toast.error(err.response?.data?.message || 'Invalid coupon')
    return rejectWithValue(err.response?.data?.message)
  }
})

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    savedItems: [],
    couponCode: null,
    couponDiscount: 0,
    isLoading: false,
    isOpen: false,
  },
  reducers: {
    toggleCart: (s) => { s.isOpen = !s.isOpen },
    openCart: (s) => { s.isOpen = true },
    closeCart: (s) => { s.isOpen = false },
    clearCartLocal: (s) => { s.items = []; s.savedItems = []; s.couponCode = null; s.couponDiscount = 0 },
  },
  extraReducers: (builder) => {
    const setCart = (s, a) => {
      if (a.payload) {
        s.items = a.payload.items || []
        s.savedItems = a.payload.savedItems || []
        s.couponCode = a.payload.couponCode || null
        s.couponDiscount = a.payload.couponDiscount || 0
      }
      s.isLoading = false
    }
    builder.addCase(fetchCart.pending, (s) => { s.isLoading = true })
    builder.addCase(fetchCart.fulfilled, setCart)
    builder.addCase(fetchCart.rejected, (s) => { s.isLoading = false })
    builder.addCase(addToCart.fulfilled, setCart)
    builder.addCase(updateCartItem.fulfilled, setCart)
    builder.addCase(removeFromCart.fulfilled, setCart)
    builder.addCase(applyCoupon.fulfilled, (s, a) => {
      s.couponDiscount = a.payload.discount
    })
  },
})

export const { toggleCart, openCart, closeCart, clearCartLocal } = cartSlice.actions

export const selectCartItemCount = (state) =>
  state.cart.items.filter(i => !i.savedForLater).reduce((sum, i) => sum + i.quantity, 0)

export const selectCartSubtotal = (state) =>
  state.cart.items.filter(i => !i.savedForLater).reduce((sum, i) => sum + i.price * i.quantity, 0)
export const selectCart = (state) => state.cart

export const selectCartItems = (state) => state.cart.items || []

export const selectCartCount = (state) =>
  state.cart.items?.reduce((total, item) => total + item.quantity, 0) || 0

export default cartSlice.reducer