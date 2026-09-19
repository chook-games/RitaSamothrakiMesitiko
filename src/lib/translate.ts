import { supabase } from './supabase'

export interface TranslateResult {
  translations: string[]
}

/**
 * Translates an array of texts using the Supabase Edge Function `translate`.
 * Supports OpenAI (OPENAI_API_KEY) or DeepL (DEEPL_API_KEY) as configured secrets.
 */
export async function translateTexts(
  texts: string[],
  target = 'en',
  source = 'el'
): Promise<string[]> {
  const cleaned = texts.map(t => (t ?? '').toString())
  if (cleaned.every(t => !t.trim())) return cleaned

  const { data, error } = await supabase.functions.invoke('translate', {
    body: { texts: cleaned, target, source },
  })

  if (error) {
    throw new Error(error.message || 'Translation service is not available')
  }

  const translations = (data as TranslateResult | null)?.translations
  if (!Array.isArray(translations) || translations.length !== cleaned.length) {
    throw new Error('Invalid response from translation service')
  }
  return translations
}
