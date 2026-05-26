import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await api.get('/products', { params })
    return res.data.data
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const fetchFeaturedProducts = createAsyncThunk('products/fetchFeatured', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/featured')
    return res.data.data
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const fetchProductDetail = createAsyncThunk('products/fetchOne', async (identifier, { rejectWithValue }) => {
  try {
    const res = await api.get(`/products/${identifier}`)
    return res.data.data.product
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const searchProducts = createAsyncThunk('products/search', async (q, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/search', { params: { q } })
    return res.data.data.products
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

const productSlice = createSlice({
  name: 'products',
  initialState: {
    list: [],
    pagination: null,
    featured: { trending: [], newArrivals: [], bestSellers: [], limitedEdition: [], flashSales: [] },
    currentProduct: null,
    searchResults: [],
    filters: {},
    isLoading: false,
    isDetailLoading: false,
    error: null,
  },
  reducers: {
    setFilters: (state, action) => { state.filters = action.payload },
    clearCurrentProduct: (state) => { state.currentProduct = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.isLoading = true })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false
        state.list = action.payload.products
        state.pagination = action.payload.pagination
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false; state.error = action.payload
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featured = action.payload
      })
      .addCase(fetchProductDetail.pending, (state) => { state.isDetailLoading = true })
      .addCase(fetchProductDetail.fulfilled, (state, action) => {
        state.isDetailLoading = false; state.currentProduct = action.payload
      })
      .addCase(fetchProductDetail.rejected, (state) => { state.isDetailLoading = false })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.searchResults = action.payload
      })
  },
})

export const { setFilters, clearCurrentProduct } = productSlice.actions
export const selectProducts = (state) => state.products
export default productSlice.reducer
