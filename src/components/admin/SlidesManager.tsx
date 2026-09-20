import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { HeroSlide } from '../../lib/supabase'
import { Toast } from './shared'

const EFFECTS = [
  { value: 'fade', label: 'Crossfade (απαλό)' },
  { value: 'slide', label: 'Ολίσθηση' },
  { value: 'zoom', label: 'Zoom' },
]

export default function SlidesManager() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<HeroSlide | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [durationSec, setDurationSec] = useState(6)
  const [effect, setEffect] = useState('fade')
  const [isActive, setIsActive] = useState(true)
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('hero_slides').select('*').order('order', { ascending: true })
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    setSlides((data as HeroSlide[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null); setImageUrl(''); setDurationSec(6); setEffect('fade'); setIsActive(true); setShowModal(true)
  }

  const openEdit = (slide: HeroSlide) => {
    setEditing(slide)
    setImageUrl(slide.image_url)
    setDurationSec((Number(slide.duration_ms) || 6000) / 1000)
    setEffect(slide.effect || 'fade')
    setIsActive(slide.is_active ?? true)
    setShowModal(true)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `hero/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('listings').upload(path, file, { upsert: true })
    if (error) { setToast({ message: 'Σφάλμα upload: ' + error.message, type: 'error' }); setUploading(false); return }
    const { data } = supabase.storage.from('listings').getPublicUrl(path)
    setImageUrl(data.publicUrl)
    setUploading(false)
  }

  const handleSave = async () => {
    if (!imageUrl) { setToast({ message: 'Επιλέξτε εικόνα', type: 'error' }); return }
    const payload = {
      image_url: imageUrl,
      duration_ms: Math.max(1, Math.round(durationSec)) * 1000,
      effect,
      is_active: isActive,
    }
    if (editing) {
      const { error } = await supabase.from('hero_slides').update(payload).eq('id', editing.id)
      if (error) { setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); return }
      setToast({ message: 'Το slide ενημερώθηκε!', type: 'success' })
    } else {
      const maxOrder = slides.reduce((m, s) => Math.max(m, Number(s.order) || 0), 0)
      const { error } = await supabase.from('hero_slides').insert({ ...payload, order: maxOrder + 1 })
      if (error) { setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); return }
      setToast({ message: 'Το slide προστέθηκε!', type: 'success' })
    }
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Σίγουρα θέλετε να διαγράψετε αυτό το slide;')) return
    const { error } = await supabase.from('hero_slides').delete().eq('id', id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else { setToast({ message: 'Το slide διαγράφηκε!', type: 'success' }); load() }
  }

  const toggleActive = async (slide: HeroSlide) => {
    const { error } = await supabase.from('hero_slides').update({ is_active: !(slide.is_active ?? true) }).eq('id', slide.id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else load()
  }

  const move = async (slide: HeroSlide, dir: -1 | 1) => {
    const ordered = [...slides].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    const idx = ordered.findIndex(s => s.id === slide.id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= ordered.length) return
    const a = ordered[idx]
    const b = ordered[swapIdx]
    await supabase.from('hero_slides').update({ order: b.order }).eq('id', a.id)
    await supabase.from('hero_slides').update({ order: a.order }).eq('id', b.id)
    load()
  }

  return (
    <div className="p-6 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Slideshow Αρχικής</h1>
          <p className="text-sm text-gray-500 mt-1">Οι εικόνες που εναλλάσσονται στο πάνω μέρος της αρχικής σελίδας. Τα slides προστίθενται αποκλειστικά από εδώ — αν δεν υπάρχει κανένα ενεργό slide, η αρχική δείχνει μόνο το χρώμα φόντου.</p>
        </div>
        <button
          onClick={openNew}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Νέο Slide
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="px-5 py-3">Εικόνα</th>
                  <th className="px-5 py-3">Σειρά</th>
                  <th className="px-5 py-3">Διάρκεια</th>
                  <th className="px-5 py-3">Εφέ</th>
                  <th className="px-5 py-3">Κατάσταση</th>
                  <th className="px-5 py-3">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {slides.map(slide => (
                  <tr key={slide.id} className="text-sm text-gray-700 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <img src={slide.image_url} alt="" className="w-24 h-14 rounded-lg object-cover border border-gray-100" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => move(slide, -1)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" title="Πάνω">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
                        </button>
                        <button onClick={() => move(slide, 1)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" title="Κάτω">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">{(Number(slide.duration_ms) || 6000) / 1000}s</td>
                    <td className="px-5 py-3">{EFFECTS.find(e => e.value === (slide.effect || 'fade'))?.label || 'Crossfade'}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(slide)}
                        className={`px-3 py-1 text-xs rounded-full font-medium ${slide.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {slide.is_active ? 'Ενεργό' : 'Ανενεργό'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(slide)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg" title="Επεξεργασία">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(slide.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Διαγραφή">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {slides.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Δεν υπάρχουν slides. Πατήστε «Νέο Slide» για να προσθέσετε.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Επεξεργασία Slide' : 'Νέο Slide'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Εικόνα</label>
                {imageUrl && <img src={imageUrl} alt="" className="w-full h-40 object-cover rounded-xl border border-gray-200 mb-3" />}
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 cursor-pointer transition-colors">
                    {uploading ? 'Ανέβασμα...' : 'Ανέβασμα εικόνας'}
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    placeholder="ή URL εικόνας"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Διάρκεια (δευτερόλεπτα)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={durationSec}
                    onChange={e => setDurationSec(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Εφέ μετάβασης</label>
                  <select
                    value={effect}
                    onChange={e => setEffect(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  >
                    {EFFECTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="text-sm text-gray-700">Ενεργό</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors">
                {editing ? 'Ενημέρωση' : 'Προσθήκη'}
              </button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                Ακύρωση
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
