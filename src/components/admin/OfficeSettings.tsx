import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { OfficeSettings as OfficeSettingsType } from '../../lib/supabase'
import { Toast } from './shared'

export default function OfficeSettings({ settings: initialSettings, onRefresh }: {
  settings: OfficeSettingsType | null
  onRefresh: () => void
}) {
  const [name, setName] = useState(initialSettings?.name || '')
  const [nameEn, setNameEn] = useState(initialSettings?.name_en || '')
  const [phones, setPhones] = useState<string[]>(
    initialSettings?.phones && initialSettings.phones.length > 0
      ? initialSettings.phones
      : (initialSettings?.phone ? [initialSettings.phone] : [''])
  )
  const [email, setEmail] = useState(initialSettings?.email || '')
  const [address, setAddress] = useState(initialSettings?.address || '')
  const [aboutText, setAboutText] = useState(initialSettings?.about_text || '')
  const [aboutTextEn, setAboutTextEn] = useState(initialSettings?.about_text_en || '')
  const [facebook, setFacebook] = useState(initialSettings?.social_links?.facebook || '')
  const [instagram, setInstagram] = useState(initialSettings?.social_links?.instagram || '')
  const [youtube, setYoutube] = useState(initialSettings?.social_links?.youtube || '')
  const [tiktok, setTiktok] = useState(initialSettings?.social_links?.tiktok || '')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logo_url || '')
  const [logoHeight, setLogoHeight] = useState(initialSettings?.logo_height || 40)

  const updatePhone = (index: number, value: string) => {
    setPhones(prev => prev.map((p, i) => (i === index ? value : p)))
  }
  const addPhone = () => setPhones(prev => [...prev, ''])
  const removePhone = (index: number) => {
    setPhones(prev => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)))
  }

  const handleSave = async () => {
    const cleanPhones = phones.map(p => p.trim()).filter(Boolean)
    const data = {
      name,
      name_en: nameEn || null,
      phone: cleanPhones[0] || '',
      phones: cleanPhones,
      email,
      address,
      about_text: aboutText,
      about_text_en: aboutTextEn || null,
      logo_url: logoUrl,
      logo_height: Number(logoHeight) || 40,
      social_links: {
        facebook: facebook || null,
        instagram: instagram || null,
        youtube: youtube || null,
        tiktok: tiktok || null,
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Όνομα Γραφείου (Αγγλικά)</label>
                <input
                  type="text" value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="Rita Samothraki Real Estate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Τηλέφωνα</label>
                <div className="space-y-2">
                  {phones.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={p}
                        onChange={e => updatePhone(i, e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                        placeholder="210 0000 000"
                      />
                      <button
                        type="button"
                        onClick={() => removePhone(i)}
                        disabled={phones.length <= 1}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                        title="Αφαίρεση"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addPhone}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Προσθήκη τηλεφώνου
                </button>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Σχετικά με το γραφείο (Αγγλικά)</label>
                <textarea
                  value={aboutTextEn}
                  onChange={e => setAboutTextEn(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-y"
                  placeholder="Write a description of your agency in English..."
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TikTok URL</label>
                <input
                  type="text" value={tiktok}
                  onChange={e => setTiktok(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="https://tiktok.com/@..."
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

            <div className="mt-5 pt-5 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">Μέγεθος λογότυπου (ύψος σε px)</label>
              <input
                type="number"
                min={20}
                max={160}
                value={logoHeight}
                onChange={e => setLogoHeight(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
              <p className="text-xs text-gray-400 mt-2">Εφαρμόζεται στο λογότυπο του header και του footer. Αποθηκεύστε τις ρυθμίσεις για να εφαρμοστεί.</p>
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
