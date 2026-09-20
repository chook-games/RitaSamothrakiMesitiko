import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Listing, Category } from '../../lib/supabase'
import { Toast } from './shared'
import ListingForm from './ListingForm'

export default function ListingsManager({ listings, categories, phoneDefault, onRefresh }: {
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingListing(listing); setShowForm(true) }}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                          title="Επεξεργασία"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
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
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">Δεν υπάρχουν αγγελίες. Πατήστε "Νέα Αγγελία" για να ξεκινήσετε.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
