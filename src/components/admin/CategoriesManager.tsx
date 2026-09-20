import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../lib/supabase'
import { Toast } from './shared'

export default function CategoriesManager({ categories, onRefresh }: {
  categories: Category[]
  onRefresh: () => void
}) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [newName, setNewName] = useState('')
  const [newNameEn, setNewNameEn] = useState('')
  const [newType, setNewType] = useState<'agora' | 'enoikiasi' | 'poulithike'>('agora')
  const [newSlug, setNewSlug] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [showModal, setShowModal] = useState(false)

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9α-ωά-ώ]+/g, '-').replace(/^-|-$/g, '')

  const handleAdd = async () => {
    if (!newName || !newSlug) return
    const { error } = await supabase.from('categories').insert({
      name_el: newName,
      name_en: newNameEn || null,
      slug: newSlug,
      type: newType,
    })
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else {
      setToast({ message: 'Κατηγορία προστέθηκε!', type: 'success' })
      setNewName(''); setNewNameEn(''); setNewSlug(''); setShowModal(false)
      onRefresh()
    }
  }

  const handleUpdate = async () => {
    if (!editing || !newName || !newSlug) return
    const { error } = await supabase.from('categories').update({ name_el: newName, name_en: newNameEn || null, slug: newSlug, type: newType }).eq('id', editing.id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else { setToast({ message: 'Κατηγορία ενημερώθηκε!', type: 'success' }); setEditing(null); setNewName(''); setNewNameEn(''); setNewSlug(''); setShowModal(false); onRefresh() }
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
    setNewNameEn(cat.name_en || '')
    setNewSlug(cat.slug)
    setNewType(cat.type)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setNewName('')
    setNewNameEn('')
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
          onClick={() => { setEditing(null); setNewName(''); setNewNameEn(''); setNewSlug(''); setNewType('agora'); setShowModal(true) }}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">English name</label>
                <input
                  type="text"
                  value={newNameEn}
                  onChange={e => setNewNameEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="e.g. Detached House"
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
                    {cat.name_en && <div className="text-xs text-gray-400">{cat.name_en}</div>}
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
