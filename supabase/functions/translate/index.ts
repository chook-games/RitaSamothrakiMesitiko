// Supabase Edge Function: translate
// Translates an array of strings from Greek to English (or vice-versa)
// using OpenAI (OPENAI_API_KEY) or DeepL (DEEPL_API_KEY).
//
// Deploy:
//   supabase functions deploy translate
// Secrets:
//   supabase secrets set OPENAI_API_KEY=sk-...
//   (optional) supabase secrets set OPENAI_MODEL=gpt-4o-mini
//   (alternative) supabase secrets set DEEPL_API_KEY=xxxxxxxx:fx

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function translateWithOpenAI(texts: string[], target: string, source: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return null

  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'
  const sourceName = source === 'el' ? 'Greek' : source === 'en' ? 'English' : source
  const targetName = target === 'en' ? 'English' : target === 'el' ? 'Greek' : target

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            `You are a professional real estate translator. Translate every string from ${sourceName} to ${targetName}. ` +
            'Keep the meaning, tone and formatting (including line breaks). Do not add explanations. ' +
            'Preserve numbers, prices, units and telephone numbers exactly as they are. ' +
            'Return ONLY valid JSON in the shape {"translations": ["...", "..."]} with exactly the same number of items and the same order as the input.',
        },
        { role: 'user', content: JSON.stringify(texts) },
      ],
    }),
  })

  if (!res.ok) {
    throw new Error(`OpenAI error: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(content)
  const translations = parsed?.translations
  if (!Array.isArray(translations)) throw new Error('OpenAI did not return translations')
  return translations.map((v: unknown) => (v == null ? '' : String(v)))
}

async function translateWithDeepL(texts: string[], target: string) {
  const apiKey = Deno.env.get('DEEPL_API_KEY')
  if (!apiKey) return null

  const isFree = apiKey.trim().endsWith(':fx')
  const endpoint = isFree
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate'

  const targetLang = target === 'en' ? 'EN-GB' : target.toUpperCase()

  const form = new URLSearchParams()
  texts.forEach(text => form.append('text', text ?? ''))
  form.append('target_lang', targetLang)

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })

  if (!res.ok) throw new Error(`DeepL error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return (data?.translations ?? []).map((t: { text?: string }) => t?.text ?? '')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const texts: string[] = Array.isArray(body.texts) ? body.texts : []
    const target: string = body.target ?? 'en'
    const source: string = body.source ?? 'el'

    if (texts.length === 0) return json({ translations: [] })

    const openai = await translateWithOpenAI(texts, target, source)
    const translations = openai ?? (await translateWithDeepL(texts, target))

    if (!translations) {
      return json(
        { error: 'No translation provider configured. Set OPENAI_API_KEY or DEEPL_API_KEY.' },
        503
      )
    }

    return json({ translations })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
