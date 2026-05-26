import { useState, useEffect } from 'react'
import { Plus, Tag, Trash2, Edit, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const EMPTY = { code:'', description:'', type:'percentage', value:0, minOrderAmount:0, startDate:'', endDate:'', usageLimit:'', isActive:true, isFestive:false }

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/coupons/admin/all'); setCoupons(r.data.data.coupons) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/coupons', form)
      toast.success('Coupon created!'); setShowForm(false); setForm(EMPTY); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate coupon?')) return
    try { await api.delete(`/coupons/${id}`); load(); toast.success('Deactivated') }
    catch { toast.error('Failed') }
  }

  const set = k => e => setForm(p => ({...p, [k]: e.target.value}))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Coupons</h1>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost py-2 px-3"><RefreshCw size={13} /></button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm py-2">
            <Plus size={14} /> {showForm ? 'Cancel' : 'New Coupon'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Create Coupon</h3>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
            {[['code','Coupon Code (uppercase)'],['description','Description']].map(([k,l]) => (
              <div key={k} className={k==='description'?'col-span-2':''}>
                <label className="text-xs text-gray-400 mb-1 block">{l}</label>
                <input className="input-field py-2 text-sm uppercase" value={form[k]} onChange={set(k)} placeholder={l} required={k==='code'} />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Type</label>
              <select className="input-field py-2 text-sm" value={form.type} onChange={set('type')}>
                <option value="percentage">Percentage %</option>
                <option value="fixed">Fixed ₹</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Value ({form.type === 'percentage' ? '%' : '₹'})</label>
              <input type="number" className="input-field py-2 text-sm" value={form.value} onChange={set('value')} min="0" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Min Order ₹</label>
              <input type="number" className="input-field py-2 text-sm" value={form.minOrderAmount} onChange={set('minOrderAmount')} min="0" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Usage Limit</label>
              <input type="number" className="input-field py-2 text-sm" value={form.usageLimit} onChange={set('usageLimit')} placeholder="Unlimited" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
              <input type="date" className="input-field py-2 text-sm" value={form.startDate} onChange={set('startDate')} required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">End Date</label>
              <input type="date" className="input-field py-2 text-sm" value={form.endDate} onChange={set('endDate')} required />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary text-sm py-2 px-5">{saving ? 'Creating...' : 'Create Coupon'}</button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY) }} className="btn-ghost text-sm py-2 px-4">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-dark-300 border-b border-white/5">
            <tr>{['Code','Type','Value','Min Order','Usage','Validity','Status','Actions'].map(h => (
              <th key={h} className="p-3 text-left text-gray-400 font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? [...Array(3)].map((_, i) => (
              <tr key={i}>{[...Array(8)].map((_, j) => <td key={j} className="p-3"><div className="h-4 bg-dark-300 rounded animate-pulse" /></td>)}</tr>
            )) : coupons.map(c => (
              <tr key={c._id} className="hover:bg-dark-300/50 transition-colors">
                <td className="p-3"><code className="text-primary font-bold">{c.code}</code></td>
                <td className="p-3 text-gray-400 capitalize">{c.type.replace(/_/g,' ')}</td>
                <td className="p-3 font-semibold">{c.type==='percentage' ? `${c.value}%` : `₹${c.value}`}</td>
                <td className="p-3 text-gray-400">{c.minOrderAmount ? `₹${c.minOrderAmount}` : '—'}</td>
                <td className="p-3 text-gray-400">{c.usageCount}/{c.usageLimit||'∞'}</td>
                <td className="p-3 text-xs text-gray-400">{new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`badge text-xs ${c.isActive && new Date(c.endDate) > new Date() ? 'badge-success' : 'badge-danger'}`}>
                    {c.isActive && new Date(c.endDate) > new Date() ? 'Active' : 'Expired/Off'}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => handleDelete(c._id)} className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                    <Trash2 size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
