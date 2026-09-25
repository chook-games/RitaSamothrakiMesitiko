import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { translateTexts } from '../../lib/translate'
import { Toast } from './shared'

export default function TranslateAdmin() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' })
  const [log, setLog] = useState<string[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const push = (m: string) => setLog(prev => [m, ...prev])

  const tr = async (texts: string[]): Promise<string[]> => {
    const cleaned = texts.map(t => (t ?? '').toString())
    if (cleaned.every(t => !t.trim())) return cleaned
    return translateTexts(cleaned, 'en', 'el')
  }

  // Translate a list of rows, one or two text fields each, into *_en columns.
  const translateRows = async (
    label: string,
    rows: any[],
    fields: { src: string; dst: string }[],
    apply: (row: any, values: Record<string, string>) => Promise<void>
  ) => {
    if (rows.length === 0) { push(`${label}: τίποτα προς μετάφραση`); return }
    push(`${label}: ${rows.length} εγγραφές`)
    const chunk = 12
    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk)
      const texts: string[] = []
      slice.forEach(r => fields.forEach(f => texts.push(r[f.src] || '')))
      const out = await tr(texts)
      for (let k = 0; k < slice.length; k++) {
        const row = slice[k]
        const values: Record<string, string> = {}
        fields.forEach((f, j) => {
          const existing = (row[f.dst] || '').trim()
          values[f.dst] = existing || out[k * fields.length + j] || ''
        })
        await apply(row, values)
      }
      setProgress({ done: i + slice.length, total: rows.length, label })
    }
  }

  const run = async () => {
    setRunning(true); setLog([]); setToast(null)
    try {
      // 1. Listings
      const { data: listings } = await supabase.from('listings').select('id,title,title_en,description,description_en')
      const needListings = (listings || []).filter(l => (l.title && !l.title_en) || (l.description && !l.description_en))
      await translateRows('Αγγελίες', needListings,
        [{ src: 'title', dst: 'title_en' }, { src: 'description', dst: 'description_en' }],
        async (row, values) => { await supabase.from('listings').update({ title_en: values.title_en || null, description_en: values.description_en || null }).eq('id', row.id) }
      )

      // 2. Listing image titles
      const { data: limgs } = await supabase.from('listing_images').select('id,title_el,title_en')
      const needLimgs = (limgs || []).filter(i => i.title_el && !i.title_en)
      await translateRows('Τίτλοι φωτογραφιών αγγελιών', needLimgs,
        [{ src: 'title_el', dst: 'title_en' }],
        async (row, values) => { await supabase.from('listing_images').update({ title_en: values.title_en || null }).eq('id', row.id) }
      )

      // 3. Categories
      const { data: cats } = await supabase.from('categories').select('id,name_el,name_en')
      const needCats = (cats || []).filter(c => c.name_el && !c.name_en)
      await translateRows('Κατηγορίες', needCats,
        [{ src: 'name_el', dst: 'name_en' }],
        async (row, values) => { await supabase.from('categories').update({ name_en: values.name_en || null }).eq('id', row.id) }
      )

      // 4. Office settings
      const { data: settings } = await supabase.from('office_settings').select('id,name,name_en,about_text,about_text_en').limit(1).single()
      if (settings && ((settings.name && !settings.name_en) || (settings.about_text && !settings.about_text_en))) {
        push('Ρυθμίσεις γραφείου: 1')
        const out = await tr([settings.name || '', settings.about_text || ''])
        await supabase.from('office_settings').update({
          name_en: settings.name_en || out[0] || null,
          about_text_en: settings.about_text_en || out[1] || null,
        }).eq('id', settings.id)
        setProgress({ done: 1, total: 1, label: 'Ρυθμίσεις' })
      }

      // 5. Service sections
      const { data: secs } = await supabase.from('service_sections').select('id,name_el,name_en')
      const needSecs = (secs || []).filter(s => s.name_el && !s.name_en)
      await translateRows('Ενότητες υπηρεσιών', needSecs,
        [{ src: 'name_el', dst: 'name_en' }],
        async (row, values) => { await supabase.from('service_sections').update({ name_en: values.name_en || null }).eq('id', row.id) }
      )

      // 6. Services
      const { data: services } = await supabase.from('services').select('id,title_el,title_en,description_el,description_en')
      const needServices = (services || []).filter(s => (s.title_el && !s.title_en) || (s.description_el && !s.description_en))
      await translateRows('Υπηρεσίες', needServices,
        [{ src: 'title_el', dst: 'title_en' }, { src: 'description_el', dst: 'description_en' }],
        async (row, values) => { await supabase.from('services').update({ title_en: values.title_en || null, description_en: values.description_en || null }).eq('id', row.id) }
      )

      // 7. Service image captions
      const { data: simgs } = await supabase.from('service_images').select('id,caption_el,caption_en')
      const needSimgs = (simgs || []).filter(i => i.caption_el && !i.caption_en)
      await translateRows('Περιγραφές εικόνων υπηρεσιών', needSimgs,
        [{ src: 'caption_el', dst: 'caption_en' }],
        async (row, values) => { await supabase.from('service_images').update({ caption_en: values.caption_en || null }).eq('id', row.id) }
      )

      setToast({ message: 'Η μετάφραση ολοκληρώθηκε! Πάτα «Δημοσίευση» για να φανεί στο site.', type: 'success' })
    } catch (e) {
      setToast({ message: 'Σφάλμα: ' + (e instanceof Error ? e.message : e), type: 'error' })
    }
    setRunning(false)
    setProgress({ done: 0, total: 0, label: '' })
  }

  return (
    <div className="p-6 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Μετάφραση</h1>
        <p className="text-sm text-gray-500 mt-1">Με ένα κλικ μεταφράζει στα Αγγλικά ό,τι λείπει: αγγελίες, τίτλους φωτογραφιών, κατηγορίες, υπηρεσίες, ρυθμίσεις.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
            {running ? 'Γίνεται μετάφραση...' : 'Μετάφραση όλων στα Αγγλικά'}
          </button>
          <p className="text-xs text-gray-500">Μεταφράζει μόνο ό,τι είναι κενό — δεν πειράζει υπάρχουσες μεταφράσεις.</p>
        </div>

        {running && (
          <div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{progress.label}</span>
              <span>{progress.done} / {progress.total}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        )}
      </div>

      {log.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm font-semibold text-gray-900 mb-3">Καταγραφή</div>
          <div className="max-h-64 overflow-y-auto text-xs font-mono space-y-1 text-gray-600">
            {log.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}
