import { ui, defaultLang, languages, type Lang, type UIKey } from './ui'

export type { Lang, UIKey }
export { languages, defaultLang } from './ui'

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split('/')
  if (maybeLang && maybeLang in languages) return maybeLang as Lang
  return defaultLang
}

export function t(lang: Lang, key: UIKey, vars?: Record<string, string | number>): string {
  const dict = ui[lang] as Record<string, string>
  const fallback = ui[defaultLang] as Record<string, string>
  let str = dict[key] ?? fallback[key] ?? (key as string)
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      str = str.split(`{${name}}`).join(String(value))
    }
  }
  return str
}

export function pick(lang: Lang, el?: string | null, en?: string | null): string {
  if (lang === 'el') return el || en || ''
  return en || el || ''
}

export function withBase(path: string): string {  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${base}${clean}`
}

export function localizePath(path: string, lang: Lang): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (lang === defaultLang) return withBase(clean)
  return withBase(`/${lang}${clean === '/' ? '' : clean}`)
}
