import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import type { Listing, Category, OfficeSettings } from '../../lib/supabase'

// ============= AUTH HOOK =============
function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] onAuthStateChange event:', event, 'user:', session?.user?.email)
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
  }

  const signUp = async (email: string, password: string) => {
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
  }

  const signOut = () => supabase.auth.signOut()

  return { user, loading, error, signIn, signUp, signOut }
}

// ============= LOGIN FORM =============
function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-light p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Πίνακας</h1>
            <p className="text-gray-500 mt-1">Συνδεθείτε για να διαχειριστείτε το γραφείο σας</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Κωδικός</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm"
            >
              Σύνδεση
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ============= TOAST =============
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  const bg = type === 'success' ? 'bg-green-500' : 'bg-red-500'
  return (
    <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 ${bg} text-white rounded-xl shadow-lg text-sm font-medium animate-bounce`}>
      {message}
    </div>
  )
}

// ============= SIDEBAR =============
function Sidebar({ activeTab, onTabChange, onSignOut }: {
  activeTab: string
  onTabChange: (tab: string) => void
  onSignOut: () => void
}) {
  const tabs = [
    { id: 'dashboard', label: 'Πίνακας Ελέγχου', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'listings', label: 'Αγγελίες', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'categories', label: 'Κατηγορίες', icon: 'M19 9l-10 10M9 19l-5-5m14-5l-5-5M9 5l-5 5' },
    { id: 'settings', label: 'Ρυθμίσεις Γραφείου', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">RS</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Διαχείριση</h2>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Αποσύνδεση
        </button>
      </div>
    </aside>
  )
}

// ============= DASHBOARD =============
function Dashboard({ listings, categories }: { listings: Listing[]; categories: Category[] }) {
  const activeListings = listings.filter(l => l.status === 'active')
  const soldListings = listings.filter(l => l.status === 'sold')
  const featuredListings = listings.filter(l => l.is_featured)
  const agoraCategories = categories.filter(c => c.type === 'agora' && !c.parent_id)
  const enoikiasiCategories = categories.filter(c => c.type === 'enoikiasi' && !c.parent_id)

  const stats = [
    { label: 'Ενεργές Αγγελίες', value: activeListings.length, color: 'bg-blue-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Πουλήθηκαν', value: soldListings.length, color: 'bg-red-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Προτεινόμενα', value: featuredListings.length, color: 'bg-accent', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { label: 'Κατηγορίες Αγοράς', value: agoraCategories.length, color: 'bg-green-500', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  ]

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Πίνακας Ελέγχου</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Listings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Πρόσφατες Αγγελίες</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">Κωδικός</th>
                <th className="px-6 py-3">Τίτλος</th>
                <th className="px-6 py-3">Κατηγορία</th>
                <th className="px-6 py-3">Τιμή</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.slice(0, 5).map(listing => (
                <tr key={listing.id} className="text-sm text-gray-700">
                  <td className="px-6 py-3 font-mono text-gray-400">#{listing.code}</td>
                  <td className="px-6 py-3 font-medium">{listing.title}</td>
                  <td className="px-6 py-3 text-gray-500">{listing.category?.name_el || '-'}</td>
                  <td className="px-6 py-3 font-semibold">
                    {new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price)}
                  </td>
                  <td className="px-6 py-3">
                    {listing.status === 'sold' ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Πουλήθηκε</span>
                    ) : listing.is_featured ? (
                      <span className="px-2 py-1 bg-accent/20 text-accent-dark text-xs rounded-full font-medium">Προτεινόμενο</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Ενεργό</span>
                    )}
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Δεν υπάρχουν αγγελίες</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============= LISTINGS MANAGER =============
function ListingsManager({ listings, categories, phoneDefault, onRefresh }: {
  listings: Listing[]
  categories: Category[]
  phoneDefault: string
  onRefresh: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingListing, setEditingListing] = useState<Listing | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Σίγουρα θέλετε να διαγράψετε αυτή την αγγελία;')) return
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else { setToast({ message: 'Η αγγελία διαγράφηκε!', type: 'success' }); onRefresh() }
  }

  const handleToggleSold = async (listing: Listing) => {
    const newStatus = listing.status === 'sold' ? 'active' : 'sold'
    const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', listing.id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else { setToast({ message: `Η αγγελία ${newStatus === 'sold' ? 'σημαδεύτηκε ως πουλημένη' : 'ενεργοποιήθηκε'}!`, type: 'success' }); onRefresh() }
  }

  return (
    <div className="p-6 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Διαχείριση Αγγελιών</h1>
        <button
          onClick={() => { setEditingListing(null); setShowForm(true) }}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Νέα Αγγελία
        </button>
      </div>

      {showForm && (
        <ListingForm
          listing={editingListing}
          categories={categories}
          phoneDefault={phoneDefault}
          onSave={() => { setShowForm(false); setEditingListing(null); onRefresh(); setToast({ message: 'Η αγγελία αποθηκεύτηκε!', type: 'success' }) }}
          onCancel={() => { setShowForm(false); setEditingListing(null) }}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                <th className="px-5 py-3">Εικόνα</th>
                <th className="px-5 py-3">Κωδικός / Τίτλος</th>
                <th className="px-5 py-3">Κατηγορία</th>
                <th className="px-5 py-3">Τιμή</th>
                <th className="px-5 py-3">Τηλέφωνο</th>
                <th className="px-5 py-3">Προτ.</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map(listing => {
                const mainImage = listing.images?.[0]?.url
                return (
                  <tr key={listing.id} className="text-sm text-gray-700 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      {mainImage ? (
                        <img src={mainImage} alt="" className="w-12 h-9 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{listing.title}</div>
                      <div className="text-xs text-gray-400 font-mono">#{listing.code}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{listing.category?.name_el || '-'}</td>
                    <td className="px-5 py-3 font-semibold">{new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price)}</td>
                    <td className="px-5 py-3 text-gray-500">{listing.phone}</td>
                    <td className="px-5 py-3">{listing.is_featured ? '⭐' : '-'}</td>
                    <td className="px-5 py-3">
                      {listing.status === 'sold' ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Πουλήθηκε</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Ενεργό</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingListing(listing); setShowForm(true) }}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                          title="Επεξεργασία"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button
                          onClick={() => handleToggleSold(listing)}
                          className={`p-1.5 rounded-lg transition-colors ${listing.status === 'sold' ? 'text-green-400 hover:text-green-600 hover:bg-green-50' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                          title={listing.status === 'sold' ? 'Επαναφορά σε ενεργό' : 'Σήμανση ως πουλημένο'}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={listing.status === 'sold' ? 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'}/></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Διαγραφή"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {listings.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">Δεν υπάρχουν αγγελίες. Πατήστε "Νέα Αγγελία" για να ξεκινήσετε.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============= LISTING FORM =============
function ListingForm({ listing, categories, phoneDefault, onSave, onCancel }: {
  listing: Listing | null
  categories: Category[]
  phoneDefault: string
  onSave: () => void
  onCancel: () => void
}) {
  const [code, setCode] = useState(listing?.code || '')
  const [title, setTitle] = useState(listing?.title || '')
  const [description, setDescription] = useState(listing?.description || '')
  const [price, setPrice] = useState(listing?.price?.toString() || '')
  const [categoryId, setCategoryId] = useState(listing?.category_id || '')
  const [phone, setPhone] = useState(listing?.phone || phoneDefault)
  const [youtubeUrl, setYoutubeUrl] = useState(listing?.youtube_url || '')
  const [isFeatured, setIsFeatured] = useState(listing?.is_featured || false)
  const [status, setStatus] = useState(listing?.status || 'active')
  const [uploading, setUploading] = useState(false)

  // Available types
  const types = ['agora', 'enoikiasi', 'poulithike'] as const
  const [selectedType, setSelectedType] = useState<string>(listing?.category?.type || 'agora')
  const filteredCategories = categories.filter(c => c.type === selectedType && !c.parent_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId) { alert('Επιλέξτε κατηγορία'); return }

    const listingData = {
      code,
      title,
      description,
      price: parseFloat(price),
      category_id: categoryId,
      phone,
      youtube_url: youtubeUrl || null,
      is_featured: isFeatured,
      status,
    }

    if (listing) {
      const { error } = await supabase.from('listings').update(listingData).eq('id', listing.id)
      if (error) { alert('Σφάλμα: ' + error.message); return }
    } else {
      const { error } = await supabase.from('listings').insert(listingData)
      if (error) { alert('Σφάλμα: ' + error.message); return }
    }
    onSave()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !listing) return
    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${listing.id}/${Date.now()}_${i}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage.from('listings').upload(fileName, file)
      if (uploadError) { alert('Σφάλμα upload: ' + uploadError.message); continue }

      const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(fileName)
      
      await supabase.from('listing_images').insert({
        listing_id: listing.id,
        url: publicUrl,
        order: (listing.images?.length || 0) + i,
      })
    }
    setUploading(false)
    onSave()
  }

  const handleDeleteImage = async (imageId: string) => {
    const { error } = await supabase.from('listing_images').delete().eq('id', imageId)
    if (error) alert('Σφάλμα: ' + error.message)
    else onSave()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">
        {listing ? 'Επεξεργασία Αγγελίας' : 'Νέα Αγγελία'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Κωδικός Αγγελίας</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              placeholder="π.χ. RS-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Τιμή (€)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              placeholder="π.χ. 150000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Τηλέφωνο</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              placeholder="π.χ. 210 0000 000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Τίτλος</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            placeholder="Τίτλος αγγελίας"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Περιγραφή</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-y"
            placeholder="Περιγράψτε το ακίνητο..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Τύπος</label>
            <select
              value={selectedType}
              onChange={e => { setSelectedType(e.target.value); setCategoryId('') }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            >
              <option value="agora">Αγορά</option>
              <option value="enoikiasi">Ενοικίαση</option>
              <option value="poulithike">Πουλήθηκε</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Κατηγορία</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              required
            >
              <option value="">Επιλέξτε κατηγορία</option>
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name_el}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL (προαιρετικό)</label>
          <input
            type="text"
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={e => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700">Προτεινόμενο</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={status === 'sold'}
              onChange={e => setStatus(e.target.checked ? 'sold' : 'active')}
              className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
            />
            <span className="text-sm text-red-600">Πουλήθηκε</span>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
          >
            {listing ? 'Ενημέρωση' : 'Δημιουργία'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Ακύρωση
          </button>
        </div>
      </form>

      {/* Image Upload */}
      {listing && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Φωτογραφίες</h3>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
            {listing.images?.sort((a, b) => a.order - b.order).map(img => (
              <div key={img.id} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 cursor-pointer transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            {uploading ? 'Ανέβασμα...' : 'Προσθήκη Φωτογραφιών'}
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      )}
    </div>
  )
}

// ============= CATEGORIES MANAGER =============
function CategoriesManager({ categories, onRefresh }: {
  categories: Category[]
  onRefresh: () => void
}) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'agora' | 'enoikiasi' | 'poulithike'>('agora')
  const [newSlug, setNewSlug] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [showModal, setShowModal] = useState(false)

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9α-ωά-ώ]+/g, '-').replace(/^-|-$/g, '')

  const handleAdd = async () => {
    if (!newName || !newSlug) return
    const { error } = await supabase.from('categories').insert({
      name_el: newName,
      slug: newSlug,
      type: newType,
    })
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else {
      setToast({ message: 'Κατηγορία προστέθηκε!', type: 'success' })
      setNewName(''); setNewSlug(''); setShowModal(false)
      onRefresh()
    }
  }

  const handleUpdate = async () => {
    if (!editing || !newName || !newSlug) return
    const { error } = await supabase.from('categories').update({ name_el: newName, slug: newSlug, type: newType }).eq('id', editing.id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else { setToast({ message: 'Κατηγορία ενημερώθηκε!', type: 'success' }); setEditing(null); setNewName(''); setNewSlug(''); setShowModal(false); onRefresh() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Σίγουρα θέλετε να διαγράψετε αυτή την κατηγορία;')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else { setToast({ message: 'Κατηγορία διαγράφηκε!', type: 'success' }); onRefresh() }
  }

  const startEdit = (cat: Category) => {
    setEditing(cat)
    setNewName(cat.name_el)
    setNewSlug(cat.slug)
    setNewType(cat.type)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setNewName('')
    setNewSlug('')
  }

  const typeLabels: Record<string, string> = { agora: 'Αγορά', enoikiasi: 'Ενοικίαση', poulithike: 'Πουλήθηκε' }
  const grouped = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = []
    acc[cat.type].push(cat)
    return acc
  }, {} as Record<string, Category[]>)

  return (
    <div className="p-6 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Διαχείριση Κατηγοριών</h1>
        <button
          onClick={() => { setEditing(null); setNewName(''); setNewSlug(''); setNewType('agora'); setShowModal(true) }}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Προσθήκη
        </button>
      </div>

      {/* Modal for add/edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Επεξεργασία Κατηγορίας' : 'Νέα Κατηγορία'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Όνομα κατηγορίας</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => { setNewName(e.target.value); if (!editing) setNewSlug(generateSlug(e.target.value)) }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="π.χ. Μονοκατοικία"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={e => setNewSlug(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="π.χ. monokatikia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Τύπος</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as 'agora' | 'enoikiasi' | 'poulithike')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                >
                  <option value="agora">Αγορά</option>
                  <option value="enoikiasi">Ενοικίαση</option>
                  <option value="poulithike">Πουλήθηκε</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editing ? handleUpdate : handleAdd}
                className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
              >
                {editing ? 'Ενημέρωση' : 'Προσθήκη'}
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Ακύρωση
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([type, cats]) => (
          <div key={type} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-900">{typeLabels[type] || type}</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {cats.map(cat => (
                <div key={cat.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{cat.name_el}</div>
                    <div className="text-xs text-gray-400 font-mono">/{cat.slug}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              ))}
              {cats.length === 0 && (
                <div className="px-5 py-6 text-center text-xs text-gray-400">Δεν υπάρχουν κατηγορίες</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============= OFFICE SETTINGS =============
function OfficeSettings({ settings: initialSettings, onRefresh }: {
  settings: OfficeSettings | null
  onRefresh: () => void
}) {
  const [name, setName] = useState(initialSettings?.name || '')
  const [phone, setPhone] = useState(initialSettings?.phone || '')
  const [email, setEmail] = useState(initialSettings?.email || '')
  const [address, setAddress] = useState(initialSettings?.address || '')
  const [aboutText, setAboutText] = useState(initialSettings?.about_text || '')
  const [facebook, setFacebook] = useState(initialSettings?.social_links?.facebook || '')
  const [instagram, setInstagram] = useState(initialSettings?.social_links?.instagram || '')
  const [youtube, setYoutube] = useState(initialSettings?.social_links?.youtube || '')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logo_url || '')

  const handleSave = async () => {
    const data = {
      name,
      phone,
      email,
      address,
      about_text: aboutText,
      logo_url: logoUrl,
      social_links: {
        facebook: facebook || null,
        instagram: instagram || null,
        youtube: youtube || null,
      },
    }
    console.log('[OfficeSettings] Saving data:', data)
    console.log('[OfficeSettings] initialSettings id:', initialSettings?.id)

    if (initialSettings) {
      const result = await supabase.from('office_settings').update(data).eq('id', initialSettings.id)
      console.log('[OfficeSettings] UPDATE result:', result)
      if (result.error) setToast({ message: 'Σφάλμα: ' + result.error.message, type: 'error' })
      else { setToast({ message: 'Οι ρυθμίσεις αποθηκεύτηκαν!', type: 'success' }); onRefresh() }
    } else {
      const result = await supabase.from('office_settings').insert(data)
      console.log('[OfficeSettings] INSERT result:', result)
      if (result.error) setToast({ message: 'Σφάλμα: ' + result.error.message, type: 'error' })
      else { setToast({ message: 'Οι ρυθμίσεις αποθηκεύτηκαν!', type: 'success' }); onRefresh() }
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `logo.${fileExt}`
    
    const { error: uploadError } = await supabase.storage.from('office').upload(fileName, file, { upsert: true })
    if (uploadError) { alert('Σφάλμα upload: ' + uploadError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('office').getPublicUrl(fileName)
    setLogoUrl(publicUrl)
    setUploading(false)
    setToast({ message: 'Το logo ανέβηκε! Αποθηκεύστε τις ρυθμίσεις.', type: 'success' })
  }

  return (
    <div className="p-6 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ρυθμίσεις Γραφείου</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Βασικές Πληροφορίες</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Όνομα Γραφείου</label>
                <input
                  type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="Rita Samothraki"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Τηλέφωνο</label>
                  <input
                    type="text" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    placeholder="210 0000 000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    placeholder="info@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Διεύθυνση</label>
                <input
                  type="text" value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="Οδός, Αριθμός, Περιοχή"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Σχετικά με το γραφείο</label>
                <textarea
                  value={aboutText}
                  onChange={e => setAboutText(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-y"
                  placeholder="Γράψτε μια περιγραφή για το γραφείο σας..."
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Social Media</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                <input
                  type="text" value={facebook}
                  onChange={e => setFacebook(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                <input
                  type="text" value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                <input
                  type="text" value={youtube}
                  onChange={e => setYoutube(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logo Upload Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Λογότυπο</h2>
            <div className="flex flex-col items-center">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-40 h-40 object-contain rounded-2xl border border-gray-200 mb-4" />
              ) : (
                <div className="w-40 h-40 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
                  <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <label className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 cursor-pointer transition-colors">
                {uploading ? 'Ανέβασμα...' : 'Αλλαγή Λογότυπου'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm"
          >
            Αποθήκευση Ρυθμίσεων
          </button>
        </div>
      </div>
    </div>
  )
}

// ============= MAIN ADMIN APP =============
export default function AdminApp() {
  const { user, loading, error, signIn, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<OfficeSettings | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasLoadedRef = useRef(false)

  const loadData = async (silent = false) => {
    console.trace('[AdminApp] loadData called, silent:', silent)
    if (!silent) setDataLoading(true)
    else setIsRefreshing(true)
    
    const [listingsRes, categoriesRes, settingsRes] = await Promise.all([
      supabase.from('listings').select('*, category:categories(*), images:listing_images(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name_el'),
      supabase.from('office_settings').select('*').single(),
    ])
    if (listingsRes.data) setListings(listingsRes.data as Listing[])
    if (categoriesRes.data) setCategories(categoriesRes.data)
    if (settingsRes.data) setSettings(settingsRes.data)
    
    if (!silent) setDataLoading(false)
    else setIsRefreshing(false)
  }

  // Initial load only when user first becomes available (not on every auth event like TOKEN_REFRESHED)
  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadData()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Φόρτωση...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={(email, password) => signIn(email, password)} />
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const phoneDefault = settings?.phone || '2100000000'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-white shadow-lg rounded-full text-xs text-gray-500 border border-gray-200 animate-pulse">
          Ανανέωση...
        </div>
      )}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onSignOut={signOut} />
      <main className="flex-1 overflow-y-auto">
        <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
          <Dashboard listings={listings} categories={categories} />
        </div>
        <div style={{ display: activeTab === 'listings' ? 'block' : 'none' }}>
          <ListingsManager listings={listings} categories={categories} phoneDefault={phoneDefault} onRefresh={() => loadData(true)} />
        </div>
        <div style={{ display: activeTab === 'categories' ? 'block' : 'none' }}>
          <CategoriesManager categories={categories} onRefresh={() => loadData(true)} />
        </div>
        <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
          <OfficeSettings settings={settings} onRefresh={() => loadData(true)} />
        </div>
      </main>
    </div>
  )
}
