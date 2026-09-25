import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Service, ServiceSection, ServiceImage } from '../../lib/supabase'
import { compressImage } from '../../lib/imageCompress'
import { Toast } from './shared'

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9α-ωά-ώ]+/g, '-').replace(/^-|-$/g, '')

export default function ServicesAdmin() {
  const [tab, setTab] = useState<'services' | 'sections'>('services')
  const [sections, setSections] = useState<ServiceSection[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Section modal
  const [showSection, setShowSection] = useState(false)
  const [editSection, setEditSection] = useState<ServiceSection | null>(null)
  const [secNameEl, setSecNameEl] = useState('')
  const [secNameEn, setSecNameEn] = useState('')
  const [secSlug, setSecSlug] = useState('')
  const [secOrder, setSecOrder] = useState(1)

  // Service modal
  const [showService, setShowService] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [svcSection, setSvcSection] = useState('')
  const [svcTitleEl, setSvcTitleEl] = useState('')
  const [svcTitleEn, setSvcTitleEn] = useState('')
  const [svcSlug, setSvcSlug] = useState('')
  const [svcDescEl, setSvcDescEl] = useState('')
  const [svcDescEn, setSvcDescEn] = useState('')
  const [svcOrder, setSvcOrder] = useState(1)
  const [svcActive, setSvcActive] = useState(true)
  const [images, setImages] = useState<ServiceImage[]>([])
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    const [s, sv] = await Promise.all([
      supabase.from('service_sections').select('*').order('order', { ascending: true }),
      supabase.from('services').select('*, section:service_sections(*)').order('order', { ascending: true }),
    ])
    if (s.error) setToast({ message: 'Σφάλμα: ' + s.error.message, type: 'error' })
    setSections((s.data as ServiceSection[]) || [])
    setServices((sv.data as Service[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const sectionName = (id: string | null) => sections.find(s => s.id === id)?.name_el || '—'

  // ---- Sections ----
  const openSection = (sec: ServiceSection | null) => {
    setEditSection(sec)
    setSecNameEl(sec?.name_el || '')
    setSecNameEn(sec?.name_en || '')
    setSecSlug(sec?.slug || '')
    setSecOrder(sec?.order ?? (sections.reduce((m, s) => Math.max(m, s.order || 0), 0) + 1))
    setShowSection(true)
  }
  const saveSection = async () => {
    if (!secNameEl.trim()) { setToast({ message: 'Βάλε όνομα', type: 'error' }); return }
    const payload = { name_el: secNameEl.trim(), name_en: secNameEn.trim(), slug: (secSlug || slugify(secNameEl)).trim(), order: Number(secOrder) || 0 }
    const res = editSection
      ? await supabase.from('service_sections').update(payload).eq('id', editSection.id)
      : await supabase.from('service_sections').insert(payload)
    if (res.error) { setToast({ message: 'Σφάλμα: ' + res.error.message, type: 'error' }); return }
    setShowSection(false); setToast({ message: 'Η ενότητα αποθηκεύτηκε!', type: 'success' }); load()
  }
  const deleteSection = async (sec: ServiceSection) => {
    if (!confirm('Διαγραφή ενότητας; Θα διαγραφούν και οι υπηρεσίες της.')) return
    const { error } = await supabase.from('service_sections').delete().eq('id', sec.id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else { setToast({ message: 'Η ενότητα διαγράφηκε!', type: 'success' }); load() }
  }

  // ---- Services ----
  const openService = async (svc: Service | null) => {
    setEditService(svc)
    setSvcSection(svc?.section_id || sections[0]?.id || '')
    setSvcTitleEl(svc?.title_el || '')
    setSvcTitleEn(svc?.title_en || '')
    setSvcSlug(svc?.slug || '')
    setSvcDescEl(svc?.description_el || '')
    setSvcDescEn(svc?.description_en || '')
    setSvcOrder(svc?.order ?? (services.reduce((m, s) => Math.max(m, s.order || 0), 0) + 1))
    setSvcActive(svc?.is_active ?? true)
    setShowService(true)
    if (svc) {
      const { data } = await supabase.from('service_images').select('*').eq('service_id', svc.id).order('order', { ascending: true })
      setImages((data as ServiceImage[]) || [])
    } else {
      setImages([])
    }
  }
  const saveService = async () => {
    if (!svcTitleEl.trim()) { setToast({ message: 'Βάλε τίτλο', type: 'error' }); return }
    const payload = {
      section_id: svcSection || null,
      title_el: svcTitleEl.trim(),
      title_en: svcTitleEn.trim(),
      slug: (svcSlug || slugify(svcTitleEl)).trim(),
      description_el: svcDescEl,
      description_en: svcDescEn,
      order: Number(svcOrder) || 0,
      is_active: svcActive,
    }
    const res = editService
      ? await supabase.from('services').update(payload).eq('id', editService.id)
      : await supabase.from('services').insert(payload)
    if (res.error) { setToast({ message: 'Σφάλμα: ' + res.error.message, type: 'error' }); return }
    setShowService(false); setToast({ message: 'Η υπηρεσία αποθηκεύτηκε!', type: 'success' }); load()
  }
  const deleteService = async (svc: Service) => {
    if (!confirm('Διαγραφή αυτής της υπηρεσίας;')) return
    const { error } = await supabase.from('services').delete().eq('id', svc.id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' })
    else { setToast({ message: 'Η υπηρεσία διαγράφηκε!', type: 'success' }); load() }
  }
  const toggleActive = async (svc: Service) => {
    const { error } = await supabase.from('services').update({ is_active: !(svc.is_active ?? true) }).eq('id', svc.id)
    if (error) setToast({ message: 'Σφάλμα: ' + error.message, type: 'error' }); else load()
  }

  // ---- Images ----
  const uploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!editService || files.length === 0) return
    setUploading(true)
    let order = images.reduce((m, i) => Math.max(m, i.order || 0), 0)
    for (const file of files) {
      order++
      const compressed = await compressImage(file, 1600, 0.8)
      const ext = compressed.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'jpg')
      const path = `services/${editService.id}/${Date.now()}_${order}.${ext}`
      const { error } = await supabase.storage.from('listings').upload(path, compressed, { upsert: true, contentType: compressed.type || 'image/jpeg' })
      if (error) { setToast({ message: 'Σφάλμα upload: ' + error.message, type: 'error' }); continue }
      const { data } = supabase.storage.from('listings').getPublicUrl(path)
      const { data: inserted } = await supabase.from('service_images').insert({ service_id: editService.id, url: data.publicUrl, caption_el: '', caption_en: '', order }).select().single()
      if (inserted) setImages(prev => [...prev, inserted as ServiceImage])
    }
    setUploading(false)
  }
  const updateCaption = (id: string, field: 'caption_el' | 'caption_en', value: string) => {
    setImages(prev => prev.map(i => (i.id === id ? { ...i, [field]: value } : i)))
  }
  const saveCaption = async (img: ServiceImage) => {
    await supabase.from('service_images').update({ caption_el: img.caption_el || '', caption_en: img.caption_en || '' }).eq('id', img.id)
  }
  const deleteImage = async (img: ServiceImage) => {
    if (!confirm('Διαγραφή εικόνας;')) return
    await supabase.from('service_images').delete().eq('id', img.id)
    setImages(prev => prev.filter(i => i.id !== img.id))
  }
  const moveImage = async (img: ServiceImage, dir: -1 | 1) => {
    const ordered = [...images].sort((a, b) => (a.order || 0) - (b.order || 0))
    const idx = ordered.findIndex(i => i.id === img.id)
    const swap = idx + dir
    if (swap < 0 || swap >= ordered.length) return
    const a = ordered[idx], b = ordered[swap]
    await supabase.from('service_images').update({ order: b.order }).eq('id', a.id)
    await supabase.from('service_images').update({ order: a.order }).eq('id', b.id)
    setImages(prev => prev.map(i => i.id === a.id ? { ...i, order: b.order } : i.id === b.id ? { ...i, order: a.order } : i))
  }

  return (
    <div className="p-6 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Υπηρεσίες</h1>
          <p className="text-sm text-gray-500 mt-1">Ενότητες (π.χ. Τεχνικά, Οικοδομικά) και οι υπηρεσίες τους με εικόνες + περιγραφή.</p>
        </div>
        <div className="flex items-center rounded-xl bg-gray-100 p-1">
          <button onClick={() => setTab('services')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'services' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Υπηρεσίες</button>
          <button onClick={() => setTab('sections')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'sections' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Ενότητες</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : tab === 'sections' ? (
        <div>
          <button onClick={() => openSection(null)} className="mb-4 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Νέα Ενότητα</button>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 uppercase bg-gray-50"><th className="px-5 py-3">Σειρά</th><th className="px-5 py-3">Όνομα (EL)</th><th className="px-5 py-3">Name (EN)</th><th className="px-5 py-3">Slug</th><th className="px-5 py-3">Ενέργειες</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {sections.map(sec => (
                  <tr key={sec.id} className="text-gray-700">
                    <td className="px-5 py-3">{sec.order}</td>
                    <td className="px-5 py-3 font-medium">{sec.name_el}</td>
                    <td className="px-5 py-3 text-gray-500">{sec.name_en || '-'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">/{sec.slug}</td>
                    <td className="px-5 py-3"><div className="flex gap-1">
                      <button onClick={() => openSection(sec)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg" title="Επεξεργασία"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                      <button onClick={() => deleteSection(sec)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg" title="Διαγραφή"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </div></td>
                  </tr>
                ))}
                {sections.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Δεν υπάρχουν ενότητες.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => openService(null)} className="mb-4 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Νέα Υπηρεσία</button>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 uppercase bg-gray-50"><th className="px-5 py-3">Τίτλος</th><th className="px-5 py-3">Ενότητα</th><th className="px-5 py-3">Σειρά</th><th className="px-5 py-3">Κατάσταση</th><th className="px-5 py-3">Ενέργειες</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {services.map(svc => (
                  <tr key={svc.id} className="text-gray-700">
                    <td className="px-5 py-3 font-medium">{svc.title_el || '-'}</td>
                    <td className="px-5 py-3 text-gray-500">{sectionName(svc.section_id)}</td>
                    <td className="px-5 py-3">{svc.order}</td>
                    <td className="px-5 py-3"><button onClick={() => toggleActive(svc)} className={`px-3 py-1 text-xs rounded-full font-medium ${svc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{svc.is_active ? 'Ενεργό' : 'Ανενεργό'}</button></td>
                    <td className="px-5 py-3"><div className="flex gap-1">
                      <button onClick={() => openService(svc)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg" title="Επεξεργασία"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                      <button onClick={() => deleteService(svc)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg" title="Διαγραφή"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </div></td>
                  </tr>
                ))}
                {services.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Δεν υπάρχουν υπηρεσίες.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section modal */}
      {showSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSection(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editSection ? 'Επεξεργασία Ενότητας' : 'Νέα Ενότητα'}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Όνομα (Ελληνικά)</label><input value={secNameEl} onChange={e => { setSecNameEl(e.target.value); if (!editSection) setSecSlug(slugify(e.target.value)) }} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" placeholder="π.χ. Τεχνικά" autoFocus /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name (Αγγλικά)</label><input value={secNameEn} onChange={e => setSecNameEn(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" placeholder="e.g. Technical" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Slug</label><input value={secSlug} onChange={e => setSecSlug(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Σειρά</label><input type="number" value={secOrder} onChange={e => setSecOrder(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveSection} className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light">{editSection ? 'Ενημέρωση' : 'Προσθήκη'}</button>
              <button onClick={() => setShowSection(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200">Ακύρωση</button>
            </div>
          </div>
        </div>
      )}

      {/* Service modal */}
      {showService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowService(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editService ? 'Επεξεργασία Υπηρεσίας' : 'Νέα Υπηρεσία'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Ενότητα</label><select value={svcSection} onChange={e => setSvcSection(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm">{sections.map(s => <option key={s.id} value={s.id}>{s.name_el}</option>)}</select></div>
                <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Σειρά</label><input type="number" value={svcOrder} onChange={e => setSvcOrder(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Τίτλος (Ελληνικά)</label><input value={svcTitleEl} onChange={e => { setSvcTitleEl(e.target.value); if (!editService) setSvcSlug(slugify(e.target.value)) }} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" autoFocus /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Title (Αγγλικά)</label><input value={svcTitleEn} onChange={e => setSvcTitleEn(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Slug</label><input value={svcSlug} onChange={e => setSvcSlug(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Περιγραφή (Ελληνικά)</label><textarea value={svcDescEl} onChange={e => setSvcDescEl(e.target.value)} rows={5} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm resize-y" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description (Αγγλικά)</label><textarea value={svcDescEn} onChange={e => setSvcDescEn(e.target.value)} rows={5} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm resize-y" /></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={svcActive} onChange={e => setSvcActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary" /><span className="text-sm text-gray-700">Ενεργό</span></label>

              {/* Images */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Εικόνες & περιγραφές</h3>
                  {editService ? (
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 cursor-pointer">
                      {uploading ? 'Ανέβασμα...' : 'Προσθήκη εικόνων'}
                      <input type="file" accept="image/*" multiple onChange={uploadImages} className="hidden" disabled={uploading} />
                    </label>
                  ) : (
                    <span className="text-xs text-gray-400">Αποθήκευσε πρώτα την υπηρεσία για να προσθέσεις εικόνες.</span>
                  )}
                </div>
                <div className="space-y-3">
                  {images.map((img, i) => (
                    <div key={img.id} className="flex gap-3 items-start bg-gray-50 rounded-xl p-3">
                      <img src={img.url} alt="" className="w-24 h-20 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <input value={img.caption_el || ''} onChange={e => updateCaption(img.id, 'caption_el', e.target.value)} onBlur={() => saveCaption({ ...img })} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm" placeholder="Περιγραφή (Ελληνικά)" />
                        <input value={img.caption_en || ''} onChange={e => updateCaption(img.id, 'caption_en', e.target.value)} onBlur={() => saveCaption({ ...img })} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm" placeholder="Description (Αγγλικά)" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveImage(img, -1)} className="p-1 text-gray-400 hover:text-primary rounded" title="Πάνω"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg></button>
                        <button onClick={() => moveImage(img, 1)} className="p-1 text-gray-400 hover:text-primary rounded" title="Κάτω"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg></button>
                        <button onClick={() => deleteImage(img)} className="p-1 text-gray-400 hover:text-red-600 rounded" title="Διαγραφή"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                      </div>
                    </div>
                  ))}
                  {images.length === 0 && <p className="text-xs text-gray-400">Καμία εικόνα ακόμη.</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveService} className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light">{editService ? 'Ενημέρωση' : 'Προσθήκη'}</button>
              <button onClick={() => setShowService(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200">Ακύρωση</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
