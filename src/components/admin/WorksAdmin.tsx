import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Work, WorkCategory } from '../../lib/supabase'
import { compressImage } from '../../lib/imageCompress'
import { Toast } from './shared'

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9α-ωά-ώ]+/g, '-').replace(/^-|-$/g, '')

export default function WorksAdmin() {
  const [tab, setTab] = useState<'items' | 'categories'>('items')
  const [cats, setCats] = useState<WorkCategory[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Category modal
  const [showCat, setShowCat] = useState(false)
  const [editCat, setEditCat] = useState<WorkCategory | null>(null)
  const [catNameEl, setCatNameEl] = useState('')
  const [catNameEn, setCatNameEn] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catOrder, setCatOrder] = useState(1)

  // Work modal
  const [showWork, setShowWork] = useState(false)
  const [editWork, setEditWork] = useState<Work | null>(null)
  const [wTitleEl, setWTitleEl] = useState('')
  const [wTitleEn, setWTitleEn] = useState('')
  const [wDescEl, setWDescEl] = useState('')
  const [wDescEn, setWDescEn] = useState('')
  const [wCategory, setWCategory] = useState('')
  const [wImage, setWImage] = useState('')
  const [wOrder, setWOrder] = useState(1)
  const [wActive, setWActive] = useState(true)
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    const [c, w] = await Promise.all([
      supabase.from('work_categories').select('*').order('order', { ascending: true }),
      supabase.from('works').select('*, category:work_categories(*)').order('order', { ascending: true }),
    ])
    if (c.error) setToast({ message: 'Σφάλμα: ' + c.error.message, type: 'error' })
    setCats((c.data as WorkCategory[]) || [])
    setWorks((w.data as Work[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ---- Categories ----
  const openCat = (cat: WorkCategory | null) => {
    setEditCat(cat)
    setCatNameEl(cat?.name_el || '')
    setCatNameEn(cat?.name_en || '')
    setCatSlug(cat?.slug || '')
    setCatOrder(cat?.order ?? (cats.reduce((m, c) => Math.max(m, c.order || 0), 0) + 1))
    setShowCat(true)
  }
  const saveCat = async () => {
    if (!catNameEl.trim()) { setToast({ message: 'Βάλε όνομα κατηγορίας', type: 'error' }); return }
    const slug = (catSlug || slugify(catNameEl)).trim()
    const payload = { name_el: catNameEl.trim(), name_en: catNameEn.trim(), slug, order: Number(catOrder) || 0 }
    if (editCat) {
      const { error } = await supabase.from('work_categories').update(payload).eq('id', editCat.id)
      if (error) { setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); return }
    } else {
      const { error } = await supabase.from('work_categories').insert(payload)
      if (error) { setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); return }
    }
    setShowCat(false); setToast({ message: 'Η κατηγορία αποθηκεύτηκε!', type: 'success' }); load()
  }
  const deleteCat = async (cat: WorkCategory) => {
    if (!confirm('Διαγραφή κατηγορίας; Οι εργασίες της θα μείνουν χωρίς κατηγορία.')) return
    const { error } = await supabase.from('work_categories').delete().eq('id', cat.id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else { setToast({ message: 'Η κατηγορία διαγράφηκε!', type: 'success' }); load() }
  }

  // ---- Works ----
  const openWork = (work: Work | null) => {
    setEditWork(work)
    setWTitleEl(work?.title_el || '')
    setWTitleEn(work?.title_en || '')
    setWDescEl(work?.description_el || '')
    setWDescEn(work?.description_en || '')
    setWCategory(work?.category_id || (cats[0]?.id || ''))
    setWImage(work?.image_url || '')
    setWOrder(work?.order ?? (works.reduce((m, w) => Math.max(m, w.order || 0), 0) + 1))
    setWActive(work?.is_active ?? true)
    setShowWork(true)
  }
  const saveWork = async () => {
    if (!wTitleEl.trim()) { setToast({ message: 'Βάλε τίτλο', type: 'error' }); return }
    const payload = {
      title_el: wTitleEl.trim(),
      title_en: wTitleEn.trim(),
      description_el: wDescEl,
      description_en: wDescEn,
      category_id: wCategory || null,
      image_url: wImage || null,
      order: Number(wOrder) || 0,
      is_active: wActive,
    }
    if (editWork) {
      const { error } = await supabase.from('works').update(payload).eq('id', editWork.id)
      if (error) { setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); return }
    } else {
      const { error } = await supabase.from('works').insert(payload)
      if (error) { setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); return }
    }
    setShowWork(false); setToast({ message: 'Η εργασία αποθηκεύτηκε!', type: 'success' }); load()
  }
  const deleteWork = async (work: Work) => {
    if (!confirm('Διαγραφή αυτής της εργασίας;')) return
    const { error } = await supabase.from('works').delete().eq('id', work.id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else { setToast({ message: 'Η εργασία διαγράφηκε!', type: 'success' }); load() }
  }
  const toggleActive = async (work: Work) => {
    const { error } = await supabase.from('works').update({ is_active: !(work.is_active ?? true) }).eq('id', work.id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); else load()
  }
  const uploadWorkImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const compressed = await compressImage(file, 1600, 0.8)
    const ext = compressed.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'jpg')
    const path = `works/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('listings').upload(path, compressed, { upsert: true, contentType: compressed.type || 'image/jpeg' })
    if (error) { setToast({ message: 'Σφάλμα upload: ' + error.message, type: 'error' }); setUploading(false); return }
    const { data } = supabase.storage.from('listings').getPublicUrl(path)
    setWImage(data.publicUrl)
    setUploading(false)
  }

  const catName = (id: string | null) => {
    const c = cats.find(x => x.id === id)
    return c?.name_el || '—'
  }

  return (
    <div className="p-6 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Εργασίες</h1>
          <p className="text-sm text-gray-500 mt-1">Βιτρίνα υπηρεσιών (όχι αγγελίες). Διαχειρίσου κατηγορίες και έργα.</p>
        </div>
        <div className="flex items-center rounded-xl bg-gray-100 p-1">
          <button onClick={() => setTab('items')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'items' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Έργα</button>
          <button onClick={() => setTab('categories')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'categories' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Κατηγορίες</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : tab === 'categories' ? (
        <div>
          <button onClick={() => openCat(null)} className="mb-4 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Νέα Κατηγορία
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 uppercase bg-gray-50"><th className="px-5 py-3">Σειρά</th><th className="px-5 py-3">Όνομα (EL)</th><th className="px-5 py-3">Name (EN)</th><th className="px-5 py-3">Slug</th><th className="px-5 py-3">Ενέργειες</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {cats.map(c => (
                  <tr key={c.id} className="text-gray-700">
                    <td className="px-5 py-3">{c.order}</td>
                    <td className="px-5 py-3 font-medium">{c.name_el}</td>
                    <td className="px-5 py-3 text-gray-500">{c.name_en || '-'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">/{c.slug}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openCat(c)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg" title="Επεξεργασία"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                        <button onClick={() => deleteCat(c)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg" title="Διαγραφή"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cats.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Δεν υπάρχουν κατηγορίες.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => openWork(null)} className="mb-4 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Νέα Εργασία
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 uppercase bg-gray-50"><th className="px-5 py-3">Εικόνα</th><th className="px-5 py-3">Τίτλος</th><th className="px-5 py-3">Κατηγορία</th><th className="px-5 py-3">Σειρά</th><th className="px-5 py-3">Κατάσταση</th><th className="px-5 py-3">Ενέργειες</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {works.map(w => (
                  <tr key={w.id} className="text-gray-700">
                    <td className="px-5 py-3">{w.image_url ? <img src={w.image_url} alt="" className="w-14 h-10 rounded-lg object-cover" /> : <div className="w-14 h-10 rounded-lg bg-gray-100" />}</td>
                    <td className="px-5 py-3 font-medium">{w.title_el || '-'}</td>
                    <td className="px-5 py-3 text-gray-500">{catName(w.category_id)}</td>
                    <td className="px-5 py-3">{w.order}</td>
                    <td className="px-5 py-3"><button onClick={() => toggleActive(w)} className={`px-3 py-1 text-xs rounded-full font-medium ${w.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{w.is_active ? 'Ενεργό' : 'Ανενεργό'}</button></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openWork(w)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg" title="Επεξεργασία"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                        <button onClick={() => deleteWork(w)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg" title="Διαγραφή"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {works.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Δεν υπάρχουν εργασίες. Πατήστε «Νέα Εργασία».</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category modal */}
      {showCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCat(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editCat ? 'Επεξεργασία Κατηγορίας' : 'Νέα Κατηγορία'}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Όνομα (Ελληνικά)</label><input value={catNameEl} onChange={e => { setCatNameEl(e.target.value); if (!editCat) setCatSlug(slugify(e.target.value)) }} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" placeholder="π.χ. Τεχνικές Εργασίες" autoFocus /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name (Αγγλικά)</label><input value={catNameEn} onChange={e => setCatNameEn(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" placeholder="e.g. Technical Works" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Slug</label><input value={catSlug} onChange={e => setCatSlug(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" placeholder="texnikes-ergasies" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Σειρά</label><input type="number" value={catOrder} onChange={e => setCatOrder(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveCat} className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light">{editCat ? 'Ενημέρωση' : 'Προσθήκη'}</button>
              <button onClick={() => setShowCat(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200">Ακύρωση</button>
            </div>
          </div>
        </div>
      )}

      {/* Work modal */}
      {showWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowWork(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editWork ? 'Επεξεργασία Εργασίας' : 'Νέα Εργασία'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Τίτλος (Ελληνικά)</label><input value={wTitleEl} onChange={e => setWTitleEl(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" autoFocus /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Title (Αγγλικά)</label><input value={wTitleEn} onChange={e => setWTitleEn(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Περιγραφή (Ελληνικά)</label><textarea value={wDescEl} onChange={e => setWDescEl(e.target.value)} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm resize-y" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description (Αγγλικά)</label><textarea value={wDescEn} onChange={e => setWDescEn(e.target.value)} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm resize-y" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Κατηγορία</label><select value={wCategory} onChange={e => setWCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm">{cats.map(c => <option key={c.id} value={c.id}>{c.name_el}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Σειρά</label><input type="number" value={wOrder} onChange={e => setWOrder(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" /></div>
                <div className="flex items-end pb-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={wActive} onChange={e => setWActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary" /><span className="text-sm text-gray-700">Ενεργό</span></label></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Εικόνα</label>
                {wImage && <img src={wImage} alt="" className="w-full h-44 object-cover rounded-xl border border-gray-200 mb-3" />}
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 cursor-pointer">
                    {uploading ? 'Ανέβασμα...' : 'Ανέβασμα εικόνας'}
                    <input type="file" accept="image/*" onChange={uploadWorkImage} className="hidden" disabled={uploading} />
                  </label>
                  {wImage && <button type="button" onClick={() => setWImage('')} className="text-sm text-red-600 hover:underline">Αφαίρεση</button>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveWork} className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light">{editWork ? 'Ενημέρωση' : 'Προσθήκη'}</button>
              <button onClick={() => setShowWork(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200">Ακύρωση</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
