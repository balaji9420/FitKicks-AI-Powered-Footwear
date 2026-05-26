import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart3,
  Brain, Tag, Warehouse, LogOut, ChevronRight, Bell, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { logoutUser } from '../redux/slices/authSlice'
import { selectUser } from '../redux/slices/authSlice'

const navItems = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products',     icon: Package,         label: 'Products' },
  { to: '/admin/orders',       icon: ShoppingBag,     label: 'Orders' },
  { to: '/admin/users',        icon: Users,           label: 'Users' },
  { to: '/admin/inventory',    icon: Warehouse,       label: 'Inventory' },
  { to: '/admin/analytics',    icon: BarChart3,       label: 'Analytics' },
  { to: '/admin/ai-analytics', icon: Brain,           label: 'AI Insights' },
  { to: '/admin/coupons',      icon: Tag,             label: 'Coupons' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-16'} 
        flex-shrink-0 bg-dark-100 border-r border-white/5 
        flex flex-col transition-all duration-300 ease-in-out
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-display font-bold text-sm flex-shrink-0">F</div>
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <div className="font-display font-bold text-sm whitespace-nowrap">FitKicks</div>
              <div className="text-xs text-gray-500 whitespace-nowrap">Admin Panel</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-2' : ''}`
              }
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-gray-500 truncate">Admin</div>
              </div>
            </div>
          ) : null}
          <button
            onClick={handleLogout}
            className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${!sidebarOpen ? 'justify-center px-2' : ''}`}
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-dark-100 border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
