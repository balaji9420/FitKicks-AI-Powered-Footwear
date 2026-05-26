import { useState, useEffect } from 'react'
import { Search, UserCheck, UserX, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (search) params.search = search
      const res = await api.get('/users/admin/users', { params })
      setUsers(res.data.data.users)
      setPagination(res.data.data.pagination)
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page])

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/users/admin/${id}/toggle-status`)
      setUsers(us => us.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u))
      toast.success(res.data.message)
    } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold">Users</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && load()}
              placeholder="Search users..." className="input-field pl-9 py-2 text-sm w-48" />
          </div>
          <button onClick={load} className="btn-ghost py-2 px-3"><RefreshCw size={13} /></button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-dark-300 border-b border-white/5">
            <tr>{['User','Email','Orders','Spent','Points','Status','Action'].map(h => (
              <th key={h} className="p-3 text-left text-gray-400 font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="p-3"><div className="h-4 bg-dark-300 rounded animate-pulse" /></td>)}</tr>
            )) : users.map(user => (
              <tr key={user._id} className="hover:bg-dark-300/50 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <span className="font-medium">{user.firstName} {user.lastName}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-400">{user.email}</td>
                <td className="p-3 text-center">{user.totalOrders||0}</td>
                <td className="p-3">₹{(user.totalSpent||0).toLocaleString('en-IN')}</td>
                <td className="p-3 text-yellow-400">{user.loyaltyPoints||0}</td>
                <td className="p-3">
                  <span className={`badge text-xs ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {user.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => handleToggle(user._id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${user.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
                    {user.isActive ? <UserX size={11} /> : <UserCheck size={11} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-white/5">
            <span className="text-xs text-gray-500">{pagination.total} users total</span>
            <div className="flex gap-1">
              <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 rounded-lg bg-dark-300 text-sm disabled:opacity-40">←</button>
              <span className="px-3 py-1.5 text-sm text-gray-400">{page} / {pagination.pages}</span>
              <button disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 rounded-lg bg-dark-300 text-sm disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
