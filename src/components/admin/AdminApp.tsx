import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import type { Listing, Category, OfficeSettings } from '../../lib/supabase'
import { useAuth, LoginForm } from './shared'
import Sidebar from './Sidebar'
import Dashboard from './Dashboard'
import ListingsManager from './ListingsManager'
import CategoriesManager from './CategoriesManager'
import OfficeSettingsPanel from './OfficeSettings'
import SlidesManager from './SlidesManager'
import ServicesAdmin from './ServicesAdmin'
import BulkImport from './BulkImport'

// Cloudflare Pages deploy hook — triggers a rebuild so public changes go live.
const DEPLOY_HOOK = 'https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/c7562a96-19b7-4efc-bd34-ba5f329fec12'

export default function AdminApp() {
  const { user, loading, error, signIn, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<OfficeSettings | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState('')
  const hasLoadedRef = useRef(false)

  const publish = async () => {
    setPublishing(true)
    setPublishMsg('')
    try {
      const res = await fetch(DEPLOY_HOOK, { method: 'POST' })
      setPublishMsg(res.ok ? 'Η δημοσίευση ξεκίνησε (1-2 λεπτά).' : 'Αποτυχία δημοσίευσης.')
    } catch {
      setPublishMsg('Αποτυχία δημοσίευσης.')
    }
    setPublishing(false)
    setTimeout(() => setPublishMsg(''), 8000)
  }

  const loadData = async (silent = false) => {
    if (!silent) setDataLoading(true)
    else setIsRefreshing(true)

    const [listingsRes, categoriesRes, settingsRes] = await Promise.all([
      supabase.from('listings').select('*, category:categories(*), images:listing_images(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name_el'),
      supabase.from('office_settings').select('*').single(),
    ])
    if (listingsRes.data) setListings(listingsRes.data as Listing[])
    if (categoriesRes.data) setCategories(categoriesRes.data)
    if (settingsRes.data) setSettings(settingsRes.data)

    if (!silent) setDataLoading(false)
    else setIsRefreshing(false)
  }

  // Initial load only when user first becomes available (not on every auth event like TOKEN_REFRESHED)
  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadData()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Φόρτωση...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={(email, password) => signIn(email, password)} error={error} />
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const phoneDefault = settings?.phone || '2100000000'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
        {publishMsg && (
          <div className="px-3 py-1.5 bg-white shadow-lg rounded-full text-xs text-gray-600 border border-gray-200">{publishMsg}</div>
        )}
        {isRefreshing && (
          <div className="px-3 py-1.5 bg-white shadow-lg rounded-full text-xs text-gray-500 border border-gray-200 animate-pulse">Ανανέωση...</div>
        )}
        <button
          onClick={publish}
          disabled={publishing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-colors disabled:opacity-60"
          title="Δημοσίευση στο site (rebuild)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          {publishing ? 'Δημοσίευση...' : 'Δημοσίευση'}
        </button>
      </div>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onSignOut={signOut} />
      <main className="flex-1 overflow-y-auto">
        <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
          <Dashboard listings={listings} categories={categories} />
        </div>
        <div style={{ display: activeTab === 'listings' ? 'block' : 'none' }}>
          <ListingsManager listings={listings} categories={categories} phoneDefault={phoneDefault} onRefresh={() => loadData(true)} />
        </div>
        <div style={{ display: activeTab === 'import' ? 'block' : 'none' }}>
          <BulkImport categories={categories} phoneDefault={phoneDefault} onDone={() => loadData(true)} />
        </div>
        <div style={{ display: activeTab === 'services' ? 'block' : 'none' }}>
          <ServicesAdmin />
        </div>
        <div style={{ display: activeTab === 'slides' ? 'block' : 'none' }}>
          <SlidesManager />
        </div>
        <div style={{ display: activeTab === 'categories' ? 'block' : 'none' }}>
          <CategoriesManager categories={categories} onRefresh={() => loadData(true)} />
        </div>
        <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
          <OfficeSettingsPanel settings={settings} onRefresh={() => loadData(true)} />
        </div>
      </main>
    </div>
  )
}
