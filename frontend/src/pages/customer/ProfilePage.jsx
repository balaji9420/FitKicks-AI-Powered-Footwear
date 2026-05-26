import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { User, Package, Heart, MapPin, Star, Gift, Loader2, ChevronRight } from 'lucide-react'
import { selectUser, updateProfile } from '../../redux/slices/authSlice'
import { Link } from 'react-router-dom'

const TABS = [
  { id: 'profile',   label: 'Profile',    icon: User },
  { id: 'orders',    label: 'Orders',     icon: Package },
  { id: 'wishlist',  label: 'Wishlist',   icon: Heart },
  { id: 'addresses', label: 'Addresses',  icon: MapPin },
  { id: 'loyalty',   label: 'Loyalty',    icon: Star },
]

export default function ProfilePage() {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ firstName: user?.firstName||'', lastName: user?.lastName||'', phone: user?.phone||'', gender: user?.gender||'' })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await dispatch(updateProfile(form))
    setSaving(false)
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 p-5 card">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold">{user?.firstName} {user?.lastName}</h1>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{user?.loyaltyPoints || 0}</p>
            <p className="text-xs text-gray-500">Loyalty Points</p>
          </div>
        </div>

        <div className="flex gap-6 flex-col sm:flex-row">
          {/* Sidebar */}
          <aside className="sm:w-48 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`sidebar-link w-full ${activeTab === id ? 'active' : ''}`}>
                  <Icon size={16} /> <span className="text-sm">{label}</span>
                  <ChevronRight size={12} className="ml-auto opacity-40" />
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="card p-6">
                <h2 className="font-semibold mb-5">Edit Profile</h2>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">First Name</label>
                      <input className="input-field" value={form.firstName} onChange={e => setForm(p => ({...p, firstName: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Last Name</label>
                      <input className="input-field" value={form.lastName} onChange={e => setForm(p => ({...p, lastName: e.target.value}))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Phone</label>
                    <input className="input-field" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
                    <input className="input-field opacity-60" value={user?.email} disabled />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Gender</label>
                    <select className="input-field" value={form.gender} onChange={e => setForm(p => ({...p, gender: e.target.value}))}>
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                    {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">My Orders</h2>
                  <Link to="/orders" className="text-sm text-primary hover:underline">View All →</Link>
                </div>
                <div className="text-center py-8">
                  <Link to="/orders" className="btn-outline text-sm py-2 px-5">Go to Orders</Link>
                </div>
              </div>
            )}

            {activeTab === 'loyalty' && (
              <div className="card p-6">
                <h2 className="font-semibold mb-5 flex items-center gap-2"><Star size={16} className="text-yellow-400" />Loyalty Points</h2>
                <div className="text-center py-8">
                  <div className="text-6xl font-bold text-primary mb-2">{user?.loyaltyPoints || 0}</div>
                  <p className="text-gray-400 text-sm mb-2">Available Points</p>
                  <p className="text-xs text-gray-500">1 point = ₹1 discount · Earn 1 point per ₹100 spent</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {[['Orders Placed', user?.totalOrders||0], ['Total Spent', `₹${(user?.totalSpent||0).toLocaleString('en-IN')}`]].map(([k,v]) => (
                    <div key={k} className="bg-dark-300 rounded-2xl p-4 text-center">
                      <p className="text-xl font-bold text-primary">{v}</p>
                      <p className="text-xs text-gray-400 mt-1">{k}</p>
                    </div>
                  ))}
                </div>
                {user?.referralCode && (
                  <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                    <p className="text-sm font-medium mb-1 flex items-center gap-2"><Gift size={14} className="text-primary" />Your Referral Code</p>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-bold text-primary tracking-widest flex-1">{user.referralCode}</code>
                      <button onClick={() => { navigator.clipboard.writeText(user.referralCode); }} className="text-xs text-gray-400 hover:text-white">Copy</button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Refer friends · Earn 200 points per signup</p>
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'wishlist' || activeTab === 'addresses') && (
              <div className="card p-6 text-center py-12">
                <Link to={`/${activeTab}`} className="btn-primary">Go to {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
