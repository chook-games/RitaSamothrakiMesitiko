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
import BulkImport from './BulkImport'

export default function AdminApp() {
  const { user, loading, signIn, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<OfficeSettings | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasLoadedRef = useRef(false)

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
    return <LoginForm onLogin={(email, password) => signIn(email, password)} />
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
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-white shadow-lg rounded-full text-xs text-gray-500 border border-gray-200 animate-pulse">
          Ανανέωση...
        </div>
      )}
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
