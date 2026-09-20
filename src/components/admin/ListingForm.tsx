import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Listing, Category } from '../../lib/supabase'
import { translateTexts } from '../../lib/translate'
import ListingImages from './ListingImages'

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
  const [translating, setTranslating] = useState(false)

  // Available types
  const types = ['agora', 'enoikiasi'] as const
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
      status: listing?.status || 'active',
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
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h2 className="text-lg font-bold text-gray-900">
          {listing ? 'Επεξεργασία Αγγελίας' : 'Νέα Αγγελία'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            form="listing-form"
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
          >
            {listing ? 'Ενημέρωση' : 'Δημιουργία'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Ακύρωση
          </button>
        </div>
      </div>

      <form id="listing-form" onSubmit={handleSubmit} className="space-y-5">
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
        </div>
      </form>

      {/* Image management */}
      {listing && <ListingImages listing={listing} />}
    </div>
  )
}
