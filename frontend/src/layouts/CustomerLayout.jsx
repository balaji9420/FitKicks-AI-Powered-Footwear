import { Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import CartDrawer from '../components/layout/CartDrawer'
import ChatSupport from '../components/layout/ChatSupport'
import SearchOverlay from '../components/layout/SearchOverlay'
import CompareBar from '../components/common/CompareBar'

export default function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-dark">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <CompareBar />
      <ChatSupport />
    </div>
  )
}
