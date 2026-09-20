import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { HeroSlide } from '../../lib/supabase'
import { Toast } from './shared'

const EFFECTS = [
  { value: 'fade', label: 'Crossfade (απαλό)' },
  { value: 'slide', label: 'Ολίσθηση' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'all', label: 'Όλα (με τη σειρά: crossfade → ολίσθηση → zoom)' },
]

export default function SlidesManager() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Global settings
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [durationSec, setDurationSec] = useState(6)
  const [effect, setEffect] = useState('fade')
  const [showSettings, setShowSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const load = async () => {
    setLoading(true)
    const [slidesRes, settingsRes] = await Promise.all([
      supabase.from('hero_slides').select('*').order('order', { ascending: true }),
      supabase.from('office_settings').select('id,hero_duration_ms,hero_effect').limit(1).single(),
    ])
    if (slidesRes.error) setToast({ message: 'Σφάλμα: ' + slidesRes.error.message, type: 'error' })
    setSlides((slidesRes.data as HeroSlide[]) || [])
    if (settingsRes.data) {
      setSettingsId(settingsRes.data.id)
      setDurationSec((Number(settingsRes.data.hero_duration_ms) || 6000) / 1000)
      setEffect(settingsRes.data.hero_effect || 'fade')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    let order = slides.reduce((max, s) => Math.max(max, Number(s.order) || 0), 0)
    let added = 0

    for (const file of files) {
      order++
      const ext = file.name.split('.').pop()
      const path = `hero/${Date.now()}_${order}.${ext}`
      const { error: uploadError } = await supabase.storage.from('listings').upload(path, file, { upsert: true })
      if (uploadError) { setToast({ message: 'Σφάλμα upload: ' + uploadError.message, type: 'error' }); continue }
      const { data } = supabase.storage.from('listings').getPublicUrl(path)
      const { error: insertError } = await supabase.from('hero_slides').insert({
        image_url: data.publicUrl,
        order,
        is_active: true,
      })
      if (insertError) { setToast({ message: 'Σφάλμα: ' + insertError.message, type: 'error' }); continue }
      added++
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploading(false)
    if (added > 0) setToast({ message: `Προστέθηκαν ${added} εικόνες!`, type: 'success' })
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

  const handleSaveSettings = async () => {
    if (!settingsId) { setToast({ message: 'Δεν βρέθηκαν ρυθμίσεις γραφείου.', type: 'error' }); return }
    setSavingSettings(true)
    const { error } = await supabase.from('office_settings').update({
      hero_duration_ms: Math.max(1, Math.round(durationSec)) * 1000,
      hero_effect: effect,
    }).eq('id', settingsId)
    setSavingSettings(false)
    if (error) { setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); return }
    setToast({ message: 'Οι ρυθμίσεις αποθηκεύτηκαν!', type: 'success' })
    setShowSettings(false)
  }

  return (
    <div className="p-6 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Slideshow Αρχικής</h1>
          <p className="text-sm text-gray-500 mt-1">Οι εικόνες που εναλλάσσονται στο πάνω μέρος της αρχικής. Ανέβασε πολλές μαζί — η σειρά είναι η σειρά επιλογής.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Ρυθμίσεις
          </button>
          <label className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm cursor-pointer flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            {uploading ? 'Ανέβασμα...' : 'Upload images'}
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
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
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(slide)}
                        className={`px-3 py-1 text-xs rounded-full font-medium ${slide.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {slide.is_active ? 'Ενεργό' : 'Ανενεργό'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(slide.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Διαγραφή">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {slides.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">Δεν υπάρχουν slides. Πατήστε «Upload images» για να προσθέσετε.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Ρυθμίσεις Slideshow</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Διάρκεια κάθε slide (δευτερόλεπτα)</label>
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
                <p className="text-xs text-gray-400 mt-2">Το «Όλα» εναλλάσσει τα τρία εφέ με τη σειρά (crossfade, ολίσθηση, zoom) και επαναλαμβάνεται.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveSettings} disabled={savingSettings} className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50">
                {savingSettings ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </button>
              <button onClick={() => setShowSettings(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                Ακύρωση
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
