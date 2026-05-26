import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/analytics/dashboard?days=${days}`)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2"><BarChart3 size={22} className="text-primary" />Analytics</h1>
        <div className="flex gap-1 p-1 bg-dark-200 rounded-xl">
          {[7,30,90,365].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${days===d?'bg-primary text-white':'text-gray-400 hover:text-white'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Daily Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.revenueByDay || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="_id" tick={{ fill:'#666', fontSize:10 }} tickFormatter={v => v?.slice(5)} />
              <YAxis tick={{ fill:'#666', fontSize:10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background:'#1A1A1A', border:'1px solid #333', borderRadius:12 }} formatter={v => [`₹${v?.toLocaleString('en-IN')}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-4">Daily Orders</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.revenueByDay || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="_id" tick={{ fill:'#666', fontSize:10 }} tickFormatter={v => v?.slice(5)} />
              <YAxis tick={{ fill:'#666', fontSize:10 }} />
              <Tooltip contentStyle={{ background:'#1A1A1A', border:'1px solid #333', borderRadius:12 }} />
              <Bar dataKey="orders" fill="#00D4FF" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4">Top Selling Products</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data?.topProducts?.slice(0,8) || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
            <XAxis type="number" tick={{ fill:'#666', fontSize:10 }} />
            <YAxis type="category" dataKey="product.name" tick={{ fill:'#888', fontSize:10 }} width={130} tickFormatter={v => v?.length > 20 ? v.slice(0,20)+'…' : v} />
            <Tooltip contentStyle={{ background:'#1A1A1A', border:'1px solid #333', borderRadius:12 }} formatter={v => [v, 'Units Sold']} />
            <Bar dataKey="totalSold" fill="#FF6B35" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
