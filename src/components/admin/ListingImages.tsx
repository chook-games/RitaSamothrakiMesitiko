import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Listing, ListingImage } from '../../lib/supabase'
import { sortImages } from '../../lib/supabase'
import { Toast } from './shared'

export default function ListingImages({ listing }: { listing: Listing }) {
  const [images, setImages] = useState<ListingImage[]>(sortImages(listing.images))
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Title modal
  const [modalIndex, setModalIndex] = useState<number | null>(null)
  const [titleEl, setTitleEl] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [original, setOriginal] = useState({ el: '', en: '' })

  useEffect(() => { setImages(sortImages(listing.images)) }, [listing])

  const changed = titleEl !== original.el || titleEn !== original.en

  const saveCurrentTitle = async (index: number) => {
    const img = images[index]
    if (!img) return
    if (titleEl === original.el && titleEn === original.en) return
    const { error } = await supabase
      .from('listing_images')
      .update({ title_el: titleEl, title_en: titleEn })
      .eq('id', img.id)
    if (error) { setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); return }
    setImages(prev => prev.map((x, i) => (i === index ? { ...x, title_el: titleEl, title_en: titleEn } : x)))
    setOriginal({ el: titleEl, en: titleEn })
  }

  const openTitle = (index: number) => {
    const img = images[index]
    const el = img?.title_el || ''
    const en = img?.title_en || ''
    setTitleEl(el); setTitleEn(en); setOriginal({ el, en }); setModalIndex(index)
  }

  const closeTitle = async () => {
    if (modalIndex !== null) await saveCurrentTitle(modalIndex)
    setModalIndex(null)
  }

  const handleModalBackdrop = async () => {
    if (modalIndex === null) return
    if (changed) {
      const shouldSave = confirm('Υπάρχουν αλλαγές στον τίτλο. Να αποθηκευτούν πριν το κλείσιμο;')
      if (shouldSave) await saveCurrentTitle(modalIndex)
    }
    setModalIndex(null)
  }

  const goTo = async (dir: -1 | 1) => {
    if (modalIndex === null) return
    await saveCurrentTitle(modalIndex)
    const next = (modalIndex + dir + images.length) % images.length
    openTitle(next)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    const hasPrimary = images.some(i => i.is_primary)
    let order = images.reduce((max, i) => Math.max(max, i.order || 0), 0)
    let added = 0

    for (const file of files) {
      order++
      const ext = file.name.split('.').pop()
      const path = `${listing.id}/${Date.now()}_${order}.${ext}`
      const { error: uploadError } = await supabase.storage.from('listings').upload(path, file, { upsert: true })
      if (uploadError) { setToast({ message: 'Σφάλμα upload: ' + uploadError.message, type: 'error' }); continue }
      const { data } = supabase.storage.from('listings').getPublicUrl(path)
      const { data: inserted, error: insertError } = await supabase
        .from('listing_images')
        .insert({
          listing_id: listing.id,
          url: data.publicUrl,
          order,
          title_el: '',
          title_en: '',
          is_primary: !hasPrimary && added === 0,
        })
        .select()
        .single()
      if (insertError) { setToast({ message: 'Σφάλμα: ' + insertError.message, type: 'error' }); continue }
      setImages(prev => [...prev, inserted as ListingImage])
      added++
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploading(false)
    if (added > 0) setToast({ message: `Προστέθηκαν ${added} φωτογραφίες!`, type: 'success' })
  }

  const setPrimary = async (image: ListingImage) => {
    await supabase.from('listing_images').update({ is_primary: false }).eq('listing_id', listing.id)
    const { error } = await supabase.from('listing_images').update({ is_primary: true }).eq('id', image.id)
    if (error) { setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); return }
    setImages(prev => prev.map(i => ({ ...i, is_primary: i.id === image.id })))
    setToast({ message: 'Ορίστηκε ως κύρια εικόνα!', type: 'success' })
  }

  const handleDelete = async (image: ListingImage) => {
    if (!confirm('Να διαγραφεί αυτή η φωτογραφία;')) return
    const { error } = await supabase.from('listing_images').delete().eq('id', image.id)
    if (error) { setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); return }
    setImages(prev => prev.filter(i => i.id !== image.id))
    setToast({ message: 'Η φωτογραφία διαγράφηκε!', type: 'success' })
  }

  const current = modalIndex !== null ? images[modalIndex] : null

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Φωτογραφίες</h3>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 cursor-pointer transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          {uploading ? 'Ανέβασμα...' : 'Προσθήκη Φωτογραφιών'}
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      <p className="text-xs text-gray-400 mb-3">Πάτησε σε μια φωτογραφία για να αλλάξεις τον τίτλο της (EL/EN). Με το ⭐ ορίζεις την κύρια εικόνα (εμφανίζεται πρώτη).</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <div key={img.id} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
            <button type="button" onClick={() => openTitle(i)} className="w-full h-full">
              <img src={img.url} alt={img.title_el || ''} className="w-full h-full object-cover" />
            </button>

            {img.is_primary && (
              <span className="absolute top-1 left-1 px-2 py-0.5 bg-accent text-primary-dark text-[10px] font-bold rounded-full shadow">ΚΥΡΙΑ</span>
            )}

            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!img.is_primary && (
                <button type="button" onClick={() => setPrimary(img)} className="w-6 h-6 bg-white/90 text-accent-dark rounded-full flex items-center justify-center text-xs shadow" title="Ορισμός ως κύρια">
                  ★
                </button>
              )}
              <button type="button" onClick={() => handleDelete(img)} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow" title="Διαγραφή">
                ✕
              </button>
            </div>

            {(img.title_el || img.title_en) && (
              <button type="button" onClick={() => openTitle(i)} className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[11px] px-2 py-1 text-left truncate">
                {img.title_el || img.title_en}
              </button>
            )}
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">Δεν υπάρχουν φωτογραφίες ακόμη. Ανέβασε με «Προσθήκη Φωτογραφιών».</p>
      )}

      {/* Title editor modal */}
      {modalIndex !== null && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={handleModalBackdrop}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Φωτογραφία {modalIndex + 1} / {images.length}</h3>
              <button onClick={closeTitle} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative bg-gray-900 aspect-[4/3] md:aspect-auto md:min-h-[320px]">
                <img src={current.url} alt="" className="w-full h-full object-contain" />
                {images.length > 1 && (
                  <>
                    <button onClick={() => goTo(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70" aria-label="Προηγούμενη">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button onClick={() => goTo(1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70" aria-label="Επόμενη">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </>
                )}
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Τίτλος (Ελληνικά)</label>
                  <input
                    type="text"
                    value={titleEl}
                    onChange={e => setTitleEl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    placeholder="π.χ. Σαλόνι"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Τίτλος (Αγγλικά)</label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={e => setTitleEn(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    placeholder="e.g. Living room"
                  />
                </div>
                <p className="text-xs text-gray-400">Ο τίτλος αποθηκεύεται αυτόματα όταν πας στην επόμενη/προηγούμενη ή κλείσεις το παράθυρο.</p>
                <div className="flex gap-3 pt-2">
                  <button onClick={closeTitle} className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors">Αποθήκευση & Κλείσιμο</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
