import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Listing, Category } from '../../lib/supabase'
import { translateTexts } from '../../lib/translate'

export default function ListingForm({ listing, categories, phoneDefault, onSave, onCancel }: {
  listing: Listing | null
  categories: Category[]
  phoneDefault: string
  onSave: () => void
  onCancel: () => void
}) {
  const [code, setCode] = useState(listing?.code || '')
  const [title, setTitle] = useState(listing?.title || '')
  const [titleEn, setTitleEn] = useState(listing?.title_en || '')
  const [description, setDescription] = useState(listing?.description || '')
  const [descriptionEn, setDescriptionEn] = useState(listing?.description_en || '')
  const [price, setPrice] = useState(listing?.price?.toString() || '')
  const [categoryId, setCategoryId] = useState(listing?.category_id || '')
  const [phone, setPhone] = useState(listing?.phone || phoneDefault)
  const [youtubeUrl, setYoutubeUrl] = useState(listing?.youtube_url || '')
  const [isFeatured, setIsFeatured] = useState(listing?.is_featured || false)
  const [status, setStatus] = useState(listing?.status || 'active')
  const [uploading, setUploading] = useState(false)
  const [translating, setTranslating] = useState(false)

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
      title_en: titleEn || null,
      description,
      description_en: descriptionEn || null,
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

  const handleAutoTranslate = async () => {
    setTranslating(true)
    try {
      const [translatedTitle, translatedDescription] = await translateTexts([title, description], 'en', 'el')
      if (translatedTitle) setTitleEn(translatedTitle)
      if (translatedDescription) setDescriptionEn(translatedDescription)
    } catch (e) {
      alert('Η μετάφραση απέτυχε: ' + (e instanceof Error ? e.message : e))
    } finally {
      setTranslating(false)
    }
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

        {/* English fields */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-sm font-semibold text-gray-900">Αγγλικά (προαιρετικά)</div>
              <div className="text-xs text-gray-500">Αν μείνουν κενά, η αγγελία θα εμφανίζει τα ελληνικά.</div>
            </div>
            <button
              type="button"
              onClick={handleAutoTranslate}
              disabled={translating || (!title && !description)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {translating ? 'Μετάφραση...' : '✨ Αυτόματη Μετάφραση'}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">English Title</label>
            <input
              type="text"
              value={titleEn}
              onChange={e => setTitleEn(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white"
              placeholder="Property title in English"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">English Description</label>
            <textarea
              value={descriptionEn}
              onChange={e => setDescriptionEn(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-y bg-white"
              placeholder="Property description in English"
            />
          </div>
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
