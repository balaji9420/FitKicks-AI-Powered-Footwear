import { createSlice } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    mobileMenuOpen: false,
    cartOpen: false,
    searchOpen: false,
    compareList: [],
    recentlyViewed: [],
    theme: 'dark',
  },
  reducers: {
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen },
    closeMobileMenu: (state) => { state.mobileMenuOpen = false },
    toggleCart: (state) => { state.cartOpen = !state.cartOpen },
    closeCart: (state) => { state.cartOpen = false },
    toggleSearch: (state) => { state.searchOpen = !state.searchOpen },
    closeSearch: (state) => { state.searchOpen = false },
    addToCompare: (state, action) => {
      if (state.compareList.length < 3 && !state.compareList.find(p => p._id === action.payload._id)) {
        state.compareList.push(action.payload)
        toast.success('Added to compare')
      } else if (state.compareList.length >= 3) {
        toast.error('Compare up to 3 products only')
      }
    },
    removeFromCompare: (state, action) => {
      state.compareList = state.compareList.filter(p => p._id !== action.payload)
    },
    addRecentlyViewed: (state, action) => {
      state.recentlyViewed = [
        action.payload,
        ...state.recentlyViewed.filter(p => p._id !== action.payload._id),
      ].slice(0, 10)
    },
  },
})

export const {
  toggleMobileMenu, closeMobileMenu, toggleCart, closeCart,
  toggleSearch, closeSearch, addToCompare, removeFromCompare, addRecentlyViewed
} = uiSlice.actions
export const selectUI = (state) => state.ui
export default uiSlice.reducer
