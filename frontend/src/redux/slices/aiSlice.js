import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const analyzeOutfit = createAsyncThunk('ai/analyze', async (formData, { rejectWithValue }) => {
  try {
    const res = await api.post('/ai/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'AI analysis failed')
  }
})

export const fetchAIHistory = createAsyncThunk('ai/fetchHistory', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/ai/history')
    return res.data.data
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    currentAnalysis: null,
    history: [],
    isAnalyzing: false,
    error: null,
    uploadPreview: null,
  },
  reducers: {
    setUploadPreview: (state, action) => { state.uploadPreview = action.payload },
    clearAnalysis: (state) => {
      state.currentAnalysis = null; state.uploadPreview = null; state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeOutfit.pending, (state) => { state.isAnalyzing = true; state.error = null })
      .addCase(analyzeOutfit.fulfilled, (state, action) => {
        state.isAnalyzing = false; state.currentAnalysis = action.payload
        toast.success('Outfit analyzed! Here are your matches 👟')
      })
      .addCase(analyzeOutfit.rejected, (state, action) => {
        state.isAnalyzing = false; state.error = action.payload
        toast.error(action.payload || 'Analysis failed')
      })
      .addCase(fetchAIHistory.fulfilled, (state, action) => {
        state.history = action.payload.recommendations || []
      })
  },
})

export const { setUploadPreview, clearAnalysis } = aiSlice.actions
export const selectAI = (state) => state.ai
export default aiSlice.reducer
