import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, ShoppingBag, Users, DollarSign,
  Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Brain
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../../services/api'

const STATUS_COLORS = {
  pending: '#F59E0B', confirmed: '#3B82F6', processing: '#8B5CF6',
  shipped: '#06B6D4', delivered: '#10B981', cancelled: '#EF4444',
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    loadDashboard()
  }, [period])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/analytics/dashboard?days=${period}`)
      setData(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <DashboardLoader />

  const summary = data?.summary || {}
  const revenueByDay = data?.revenueByDay || []
  const topProducts = data?.topProducts || []
  const ordersByStatus = data?.ordersByStatus || []
  const lowStock = data?.lowStockProducts || []

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      change: '+12.5%',
      up: true,
    },
    {
      title: 'Total Orders',
      value: summary.totalOrders || 0,
      icon: ShoppingBag,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      change: '+8.2%',
      up: true,
    },
    {
      title: 'New Customers',
      value: summary.newUsers || 0,
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      change: '+15.3%',
      up: true,
    },
    {
      title: 'Pending Orders',
      value: summary.pendingOrders || 0,
      icon: Package,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      change: '-3.1%',
      up: false,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex gap-1 p-1 bg-dark-200 rounded-xl">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${period === d ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <motion.div
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        initial="hidden" animate="visible"
        className="grid grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {statCards.map(({ title, value, icon: Icon, color, bg, change, up }) => (
          <motion.div key={title} variants={fadeUp} className="card p-5">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>
                {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {change}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-gray-400 text-sm mt-0.5">{title}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <div className="grid xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="xl:col-span-2 card p-5">
          <h3 className="font-semibold mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Revenue Overview
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="_id" tick={{ fill: '#666', fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 12 }}
                labelStyle={{ color: '#999' }}
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by status */}
        <div className="card p-5">
          <h3 className="font-semibold mb-5">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={ordersByStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                {ordersByStatus.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry._id] || '#666'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 12 }}
                formatter={(v, n) => [v, n?.replace(/_/g, ' ')]}
              />
              <Legend formatter={(v) => <span className="text-xs text-gray-400 capitalize">{v?.replace(/_/g, ' ')}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid xl:grid-cols-3 gap-6">
        {/* Top products */}
        <div className="xl:col-span-2 card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Top Selling Products
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis type="category" dataKey="product.name" tick={{ fill: '#888', fontSize: 10 }} width={120}
                tickFormatter={(v) => v?.length > 18 ? v.slice(0, 18) + '…' : v} />
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 12 }}
                formatter={(v) => [v, 'Units Sold']}
              />
              <Bar dataKey="totalSold" fill="#FF6B35" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low stock alerts */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-orange-400">
            <AlertTriangle size={16} /> Low Stock Alert
          </h3>
          {lowStock.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">All products well stocked ✓</div>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 6).map((p) => (
                <div key={p._id} className="flex items-center gap-3">
                  <img src={p.images?.[0]?.url} alt={p.name}
                    className="w-10 h-10 rounded-xl object-cover bg-dark-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.totalStock} remaining</p>
                  </div>
                  <span className={`text-xs font-bold ${p.totalStock === 0 ? 'text-red-400' : 'text-orange-400'}`}>
                    {p.totalStock === 0 ? 'OOS' : `${p.totalStock}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Stats teaser */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card p-5 bg-gradient-to-r from-primary/10 via-dark-200 to-accent/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Brain size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Recommendation Engine</h3>
              <p className="text-sm text-gray-400">Track outfit analysis performance & conversion</p>
            </div>
          </div>
          <a href="/admin/ai-analytics" className="btn-outline text-sm py-2 px-4">View AI Analytics →</a>
        </div>
      </motion.div>
    </div>
  )
}

function DashboardLoader() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 bg-dark-300 rounded w-48" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-28" />
        ))}
      </div>
      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-5 h-72" />
        <div className="card p-5 h-72" />
      </div>
    </div>
  )
}
