import React, { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../lib/supabase'
import { translateTexts } from '../../lib/translate'
import { compressImage } from '../../lib/imageCompress'

interface Props {
  categories: Category[]
  phoneDefault: string
  onDone: () => void
}

type PropertyType = 'agora' | 'enoikiasi'

interface ImportRow {
  external_id?: string
  code?: string
  title: string
  title_en?: string
  description?: string
  description_en?: string
  price?: string | number
  type?: string
  category?: string
  phone?: string
  youtube_url?: string
  is_featured?: string | boolean
  status?: string
  images?: string[] | string
}

const TYPE_LABELS: Record<PropertyType, string> = {
  agora: 'Αγορά',
  enoikiasi: 'Ενοικίαση',
}

const HEADER_ALIASES: Record<string, keyof ImportRow> = {
  external_id: 'external_id',
  id: 'external_id',
  code: 'code',
  κωδικος: 'code',
  κωδικός: 'code',
  title: 'title',
  τιτλος: 'title',
  τίτλος: 'title',
  ονομα: 'title',
  όνομα: 'title',
  title_en: 'title_en',
  description: 'description',
  περιγραφη: 'description',
  περιγραφή: 'description',
  description_en: 'description_en',
  price: 'price',
  τιμη: 'price',
  τιμή: 'price',
  type: 'type',
  τυπος: 'type',
  τύπος: 'type',
  category: 'category',
  κατηγορια: 'category',
  κατηγορία: 'category',
  phone: 'phone',
  τηλεφωνο: 'phone',
  τηλέφωνο: 'phone',
  youtube_url: 'youtube_url',
  youtube: 'youtube_url',
  βιντεο: 'youtube_url',
  βίντεο: 'youtube_url',
  is_featured: 'is_featured',
  featured: 'is_featured',
  προτεινομενο: 'is_featured',
  προτεινόμενο: 'is_featured',
  status: 'status',
  κατασταση: 'status',
  κατάσταση: 'status',
  images: 'images',
  εικονες: 'images',
  εικόνες: 'images',
  φωτογραφιες: 'images',
  φωτογραφίες: 'images',
  image_urls: 'images',
}

function parseCsv(text: string): ImportRow[] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += char
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field); field = ''
    } else if (char === '\n') {
      row.push(field); field = ''
      if (row.some(c => c.trim() !== '')) rows.push(row)
      row = []
    } else if (char === '\r') {
      // ignore
    } else {
      field += char
    }
  }
  row.push(field)
  if (row.some(c => c.trim() !== '')) rows.push(row)

  if (rows.length < 2) return []
  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  return rows.slice(1).map(values => {
    const obj: Record<string, string> = {}
    headers.forEach((header, idx) => {
      const key = HEADER_ALIASES[header] || header
      obj[key] = (values[idx] ?? '').trim()
    })
    return obj as unknown as ImportRow
  })
}

function parseJson(text: string): ImportRow[] {
  const data = JSON.parse(text)
  const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [data]
  return list
}

function normalizeImages(value: ImportRow['images']): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean)
  return String(value)
    .split(/[|\n;]+/)
    .map(v => v.trim())
    .filter(Boolean)
}

function normType(value?: string): PropertyType | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  if (['agora', 'buy', 'sale', 'πωληση', 'πώληση', 'αγορα', 'αγορά'].includes(v)) return 'agora'
  if (['enoikiasi', 'rent', 'rental', 'ενοικιαση', 'ενοικίαση'].includes(v)) return 'enoikiasi'
  return undefined
}

export default function BulkImport({ categories, phoneDefault, onDone }: Props) {
  const [raw, setRaw] = useState('')
  const [format, setFormat] = useState<'auto' | 'json' | 'csv'>('auto')
  const [defaultType, setDefaultType] = useState<PropertyType>('agora')
  const [defaultCategoryId, setDefaultCategoryId] = useState('')
  const [autoTranslate, setAutoTranslate] = useState(true)
  const [uploadImages, setUploadImages] = useState(true)
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [parseError, setParseError] = useState('')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [log, setLog] = useState<string[]>([])
  const [summary, setSummary] = useState<{ created: number; skipped: number; failed: number } | null>(null)

  const detectedFormat = useMemo(() => {
    const trimmed = raw.trim()
    if (!trimmed) return 'csv'
    return trimmed.startsWith('[') || trimmed.startsWith('{') ? 'json' : 'csv'
  }, [raw])

  const categoryOptions = categories.filter(c => c.type === defaultType && !c.parent_id)

  const handleParse = () => {
    setParseError('')
    setSummary(null)
    try {
      const fmt = format === 'auto' ? detectedFormat : format
      const parsed = fmt === 'json' ? parseJson(raw) : parseCsv(raw)
      if (!parsed.length) throw new Error('Δεν βρέθηκαν γραμμές προς εισαγωγή')
      setRows(parsed)
    } catch (e) {
      setRows(null)
      setParseError(e instanceof Error ? e.message : 'Σφάλμα ανάλυσης')
    }
  }

  const resolveCategory = (row: ImportRow, type: PropertyType): string | null => {
    const wanted = (row.category || '').trim().toLowerCase()
    if (wanted) {
      const match = categories.find(c =>
        c.type === type &&
        (c.slug.toLowerCase() === wanted ||
          (c.name_en || '').toLowerCase() === wanted ||
          c.name_el.toLowerCase() === wanted)
      )
      if (match) return match.id
    }
    if (defaultCategoryId) {
      const dc = categories.find(c => c.id === defaultCategoryId)
      if (dc && dc.type === type) return dc.id
    }
    const first = categories.find(c => c.type === type && !c.parent_id)
    return first ? first.id : null
  }

  const uploadImage = async (listingId: string, url: string, index: number): Promise<string> => {
    if (!uploadImages) return url
    try {
      const res = await fetch(url, { mode: 'cors' })
      if (!res.ok) return url
      let blob = await res.blob()
      blob = await compressImage(blob, 1600, 0.8)
      const contentType = blob.type || 'image/jpeg'
      const extFromType = contentType.split('/')[1]?.split('+')[0] || 'jpg'
      const extFromUrl = url.split('?')[0].split('.').pop()?.toLowerCase()
      const ext = contentType === 'image/jpeg' ? 'jpg' : ((extFromUrl && extFromUrl.length <= 4 ? extFromUrl : extFromType) || 'jpg')
      const path = `${listingId}/${Date.now()}_${index}.${ext}`
      const { error } = await supabase.storage.from('listings').upload(path, blob, {
        contentType,
        upsert: true,
      })
      if (error) return url
      const { data } = supabase.storage.from('listings').getPublicUrl(path)
      return data.publicUrl || url
    } catch {
      return url
    }
  }

  const handleImport = async () => {
    if (!rows || rows.length === 0) return
    setRunning(true)
    setSummary(null)
    setLog([])
    const logs: string[] = []
    const push = (msg: string) => { logs.unshift(msg); setLog([...logs]) }

    let created = 0
    let skipped = 0
    let failed = 0

    try {
      // 1. Skip already imported rows by external_id
      const externalIds = rows.map(r => String(r.external_id ?? '').trim()).filter(Boolean)
      let existingIds = new Set<string>()
      if (externalIds.length) {
        const { data: existing } = await supabase
          .from('listings')
          .select('external_id')
          .eq('source', 'import')
          .in('external_id', externalIds)
        existingIds = new Set((existing || []).map((r: { external_id: string }) => r.external_id))
      }

      // 2. Pre-translate missing English fields in batches
      const typePerRow: PropertyType[] = []
      const translationsTitle: (string | null)[] = new Array(rows.length).fill(null)
      const translationsDesc: (string | null)[] = new Array(rows.length).fill(null)

      rows.forEach((row, i) => {
        typePerRow[i] = normType(row.type) || defaultType
      })

      if (autoTranslate) {
        const titleIndexes: number[] = []
        const titleTexts: string[] = []
        const descIndexes: number[] = []
        const descTexts: string[] = []

        rows.forEach((row, i) => {
          const hasTitleEn = !!(row.title_en && String(row.title_en).trim())
          const hasDescEn = !!(row.description_en && String(row.description_en).trim())
          if (!hasTitleEn && row.title) { titleIndexes.push(i); titleTexts.push(String(row.title)) }
          if (!hasDescEn && row.description) { descIndexes.push(i); descTexts.push(String(row.description)) }
        })

        const chunk = 20
        for (let start = 0; start < titleTexts.length; start += chunk) {
          const slice = titleTexts.slice(start, start + chunk)
          try {
            const result = await translateTexts(slice, 'en', 'el')
            result.forEach((tr, k) => { translationsTitle[titleIndexes[start + k]] = tr })
          } catch (e) {
            push(`⚠️ Αποτυχία μετάφρασης τίτλων: ${e instanceof Error ? e.message : e}`)
            break
          }
        }
        for (let start = 0; start < descTexts.length; start += chunk) {
          const slice = descTexts.slice(start, start + chunk)
          try {
            const result = await translateTexts(slice, 'en', 'el')
            result.forEach((tr, k) => { translationsDesc[descIndexes[start + k]] = tr })
          } catch (e) {
            push(`⚠️ Αποτυχία μετάφρασης περιγραφών: ${e instanceof Error ? e.message : e}`)
            break
          }
        }
      }

      // 3. Insert listings
      setProgress({ current: 0, total: rows.length, message: '' })
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const type = typePerRow[i]
        const title = String(row.title ?? '').trim()
        setProgress({ current: i + 1, total: rows.length, message: title || `#${i + 1}` })

        if (!title) { skipped++; push(`⏭️ Παραλείφθηκε γραμμή ${i + 1}: λείπει τίτλος`); continue }

        const externalId = String(row.external_id ?? '').trim() || null
        if (externalId && existingIds.has(externalId)) {
          skipped++
          push(`⏭️ Παραλείφθηκε (υπάρχει): ${title}`)
          continue
        }

        const categoryId = resolveCategory(row, type)
        if (!categoryId) { skipped++; push(`⏭️ Παραλείφθηκε: δεν βρέθηκε κατηγορία για "${title}"`); continue }

        const priceValue = parseFloat(String(row.price ?? '0').replace(/[^\d.,-]/g, '').replace(',', '.')) || 0
        const featured = row.is_featured === true || ['true', '1', 'ναι', 'yes'].includes(String(row.is_featured ?? '').toLowerCase())

        const { data: inserted, error } = await supabase
          .from('listings')
          .insert({
            code: String(row.code ?? '').trim(),
            title,
            title_en: (row.title_en && String(row.title_en).trim()) || translationsTitle[i] || null,
            description: String(row.description ?? ''),
            description_en: (row.description_en && String(row.description_en).trim()) || translationsDesc[i] || null,
            price: priceValue,
            category_id: categoryId,
            phone: String(row.phone ?? '').trim() || phoneDefault,
            youtube_url: String(row.youtube_url ?? '').trim() || null,
            is_featured: featured,
            status: 'active',
            source: 'import',
            external_id: externalId,
          })
          .select('id')
          .single()

        if (error || !inserted) {
          failed++
          push(`❌ Αποτυχία: ${title} — ${error?.message || 'άγνωστο σφάλμα'}`)
          continue
        }

        const imageUrls = normalizeImages(row.images)
        for (let k = 0; k < imageUrls.length; k++) {
          const finalUrl = await uploadImage(inserted.id, imageUrls[k], k)
          await supabase.from('listing_images').insert({ listing_id: inserted.id, url: finalUrl, order: k })
        }

        created++
        if (externalId) existingIds.add(externalId)
        push(`✅ ${title} (${imageUrls.length} εικόνες)`)
      }

      setSummary({ created, skipped, failed })
      onDone()
    } catch (e) {
      push(`❌ Σφάλμα: ${e instanceof Error ? e.message : e}`)
      setSummary({ created, skipped, failed })
    } finally {
      setRunning(false)
    }
  }

  const downloadTemplate = () => {
    const header = 'external_id,code,title,description,price,type,category,phone,images,youtube_url,is_featured'
    const example = 'xe-12345,RS-001,"Διαμέρισμα 80τμ, κέντρο","Περιγραφή...",150000,agora,diamerisma,6970000000,"https://.../1.jpg|https://.../2.jpg",,false'
    const blob = new Blob([`${header}\n${example}\n`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-aggelies.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Μαζική Εισαγωγή Αγγελιών</h1>
          <p className="text-sm text-gray-500 mt-1">Επικολλάς JSON ή CSV από τη «Χρυσή Ευκαιρία» και δημιουργούνται οι αγγελίες αυτόματα — με αυτόματη μετάφραση και φωτογραφίες.</p>
        </div>
        <button onClick={downloadTemplate} className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
          Λήψη δείγματος CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Δεδομένα (JSON ή CSV)</label>
        <textarea
          value={raw}
          onChange={e => { setRaw(e.target.value); setRows(null); setSummary(null) }}
          rows={8}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-mono resize-y"
          placeholder={'[{"title":"Διαμέρισμα 80τμ","price":150000,"type":"agora","category":"diamerisma","description":"...","images":["https://..."]}]'}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Μορφή</label>
            <select value={format} onChange={e => setFormat(e.target.value as 'auto' | 'json' | 'csv')} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none">
              <option value="auto">Αυτόματη ({detectedFormat.toUpperCase()})</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Προεπιλεγμένος τύπος</label>
            <select
              value={defaultType}
              onChange={e => { setDefaultType(e.target.value as PropertyType); setDefaultCategoryId('') }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none"
            >
              {(Object.keys(TYPE_LABELS) as PropertyType[]).map(t => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Προεπιλεγμένη κατηγορία</label>
            <select value={defaultCategoryId} onChange={e => setDefaultCategoryId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none">
              <option value="">(πρώτη διαθέσιμη)</option>
              {categoryOptions.map(c => (
                <option key={c.id} value={c.id}>{c.name_el}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={autoTranslate} onChange={e => setAutoTranslate(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm text-gray-700">Αυτόματη μετάφραση στα Αγγλικά (AI)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={uploadImages} onChange={e => setUploadImages(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm text-gray-700">Μεταφόρτωση εικόνων στο Supabase</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <button onClick={handleParse} disabled={!raw.trim() || running} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            Ανάλυση / Προεπισκόπηση
          </button>
          <button onClick={handleImport} disabled={!rows || rows.length === 0 || running} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50">
            {running ? 'Γίνεται εισαγωγή...' : `Εισαγωγή ${rows ? `(${rows.length})` : ''}`}
          </button>
          {rows && <span className="text-sm text-gray-500">{rows.length} γραμμές έτοιμες</span>}
          {parseError && <span className="text-sm text-red-600">{parseError}</span>}
        </div>
      </div>

      {running && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Εισαγωγή: {progress.message}</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
            <div className="text-2xl font-extrabold text-green-600">{summary.created}</div>
            <div className="text-xs text-green-700">Δημιουργήθηκαν</div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
            <div className="text-2xl font-extrabold text-gray-600">{summary.skipped}</div>
            <div className="text-xs text-gray-500">Παραλείφθηκαν</div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
            <div className="text-2xl font-extrabold text-red-600">{summary.failed}</div>
            <div className="text-xs text-red-700">Απέτυχαν</div>
          </div>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900">Προεπισκόπηση</div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-400 uppercase">
                <tr>
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Τίτλος</th>
                  <th className="px-4 py-2">Τιμή</th>
                  <th className="px-4 py-2">Τύπος</th>
                  <th className="px-4 py-2">Κατηγορία</th>
                  <th className="px-4 py-2">Εικόνες</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="text-gray-700">
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium max-w-xs truncate">{row.title}</td>
                    <td className="px-4 py-2">{row.price ?? '-'}</td>
                    <td className="px-4 py-2">{normType(row.type) || defaultType}</td>
                    <td className="px-4 py-2">{row.category || '-'}</td>
                    <td className="px-4 py-2">{normalizeImages(row.images).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm font-semibold text-gray-900 mb-3">Αρχείο καταγραφής</div>
          <div className="max-h-64 overflow-y-auto text-xs font-mono space-y-1 text-gray-600">
            {log.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}
