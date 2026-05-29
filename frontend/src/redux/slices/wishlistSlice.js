import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/wishlist')
    return res.data.data.wishlist
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId, { rejectWithValue }) => {
  try {
    const res = await api.post('/wishlist/toggle', { productId })
    return { ...res.data.data, productId }
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { products: [], isLoading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.products = action.payload?.products || []
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        const { added, productId } = action.payload
        if (added) {
          state.products.push({ product: { _id: productId }, addedAt: new Date() })
          toast.success('Added to wishlist ❤️')
        } else {
          state.products = state.products.filter(p =>
            (p.product?._id || p.product) !== productId
          )
          toast.success('Removed from wishlist')
        }
      })
      .addCase(toggleWishlist.rejected, (_, action) => { toast.error(action.payload) })
  },
})

export const selectWishlistIds = (state) =>
  state.wishlist.products?.map(i => i.product?._id || i.product) || []
export default wishlistSlice.reducer
