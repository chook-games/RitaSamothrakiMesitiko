import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

export const IS_PLACEHOLDER = !supabaseUrl || !supabaseAnonKey || 
  supabaseUrl === 'https://placeholder.supabase.co' ||
  supabaseAnonKey === 'placeholder-key-for-local-build'

// Create a mock fetch function that returns empty data immediately
const mockFetch = async (url: string, options?: any) => {
  // Return a mock response that doesn't hang
  return new Response(JSON.stringify({ data: null, error: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

export const supabase = IS_PLACEHOLDER
  ? createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
      global: { fetch: mockFetch },
      auth: { persistSession: false }
    })
  : createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })

// Helper types
export interface OfficeSettings {
  id: string
  name: string
  name_en: string | null
  logo_url: string | null
  logo_height: number | null
  hero_duration_ms: number | null
  hero_effect: string | null
  phone: string
  phones: (string | OfficePhone)[] | null
  email: string
  address: string
  about_text: string
  about_text_en: string | null
  social_links: {
    facebook?: string
    instagram?: string
    youtube?: string
    tiktok?: string
  }
  created_at: string
}

export interface Category {
  id: string
  name_el: string
  name_en: string | null
  slug: string
  type: 'agora' | 'enoikiasi' | 'poulithike'
  parent_id: string | null
  created_at: string
}

export interface Listing {
  id: string
  code: string
  title: string
  title_en: string | null
  description: string
  description_en: string | null
  price: number
  category_id: string
  phone: string
  youtube_url: string | null
  is_featured: boolean
  status: 'active' | 'sold'
  source: string | null
  external_id: string | null
  created_at: string
  updated_at: string
  // Joined data
  category?: Category
  images?: ListingImage[]
}

export interface ListingImage {
  id: string
  listing_id: string
  url: string
  order: number
  created_at: string
}

export interface OfficePhone {
  number: string
  type: 'mobile' | 'landline'
}

export function officePhones(settings: OfficeSettings | null): OfficePhone[] {
  if (!settings) return []
  const raw = settings.phones
  if (Array.isArray(raw)) {
    const list = raw
      .map(item => {
        if (typeof item === 'string') return { number: item.trim(), type: 'landline' as const }
        const number = (item?.number || '').trim()
        const type = item?.type === 'mobile' ? ('mobile' as const) : ('landline' as const)
        return { number, type }
      })
      .filter(p => p.number)
    if (list.length > 0) return list
  }
  return settings.phone ? [{ number: settings.phone, type: 'landline' }] : []
}

export interface HeroSlide {
  id: string
  image_url: string
  order: number
  duration_ms: number | null
  effect: 'fade' | 'slide' | 'zoom' | null
  is_active: boolean | null
  created_at: string
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  if (IS_PLACEHOLDER) return []
  const { data } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true })
  return data || []
}

// Database functions
export async function getOfficeSettings(): Promise<OfficeSettings | null> {
  if (IS_PLACEHOLDER) return null
  const { data } = await supabase
    .from('office_settings')
    .select('*')
    .single()
  return data
}

export async function getCategories(type?: string): Promise<Category[]> {
  if (IS_PLACEHOLDER) return []
  let query = supabase.from('categories').select('*').order('name_el')
  if (type) {
    query = query.eq('type', type)
  }
  const { data } = await query
  return data || []
}

export async function getListings(options?: {
  categoryId?: string
  type?: string
  status?: string
  featured?: boolean
  limit?: number
  search?: string
}): Promise<Listing[]> {
  if (IS_PLACEHOLDER) return []
  let query = supabase
    .from('listings')
    .select(`
      *,
      category:categories(*),
      images:listing_images(*)
    `)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }
  if (options?.type) {
    query = query.eq('category.type', options.type)
  }
  if (options?.featured) {
    query = query.eq('is_featured', true)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data } = await query
  return data || []
}

export async function getListing(id: string): Promise<Listing | null> {
  if (IS_PLACEHOLDER) return null
  const { data } = await supabase
    .from('listings')
    .select(`
      *,
      category:categories(*),
      images:listing_images(*)
    `)
    .eq('id', id)
    .single()
  return data
}
