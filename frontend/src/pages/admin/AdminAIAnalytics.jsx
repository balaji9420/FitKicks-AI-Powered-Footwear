import { useState, useEffect } from 'react'
import { Brain, TrendingUp, ShoppingBag, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../../services/api'

const COLORS = ['#FF6B35','#00D4FF','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#84CC16']

export default function AdminAIAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    api.get(`/ai/analytics?days=${days}`)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
  if (!data) return <div className="text-center py-20 text-gray-500">Failed to load analytics</div>

  const stats = [
    { label: 'Total Analyses', value: data.totalAnalyses, icon: Brain, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Success Rate', value: `${data.successRate}%`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Cart Conversion', value: `${data.cartConversionRate}%`, icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Purchase Conversion', value: `${data.purchaseConversionRate}%`, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2"><Brain size={22} className="text-primary" />AI Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Outfit analysis performance & conversion metrics</p>
        </div>
        <div className="flex gap-1 p-1 bg-dark-200 rounded-xl">
          {[7,30,90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${days===d ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-gray-400 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Top Outfit Styles</h3>
          {data.topStyles?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.topStyles} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" tick={{ fill:'#666', fontSize:11 }} />
                <YAxis type="category" dataKey="_id" tick={{ fill:'#888', fontSize:11 }} width={80} />
                <Tooltip contentStyle={{ background:'#1A1A1A', border:'1px solid #333', borderRadius:12 }} />
                <Bar dataKey="count" fill="#FF6B35" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-12 text-gray-500 text-sm">No style data yet</div>}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-4">Conversion Funnel</h3>
          <div className="space-y-4 py-4">
            {[
              { label: 'Total Analyses', value: data.totalAnalyses, color: '#FF6B35' },
              { label: 'Completed', value: data.completedAnalyses, color: '#00D4FF' },
              { label: 'Added to Cart', value: Math.round(data.completedAnalyses * data.cartConversionRate / 100), color: '#10B981' },
              { label: 'Purchased', value: Math.round(data.completedAnalyses * data.purchaseConversionRate / 100), color: '#8B5CF6' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
                <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${data.totalAnalyses > 0 ? (value/data.totalAnalyses*100).toFixed(1) : 0}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
