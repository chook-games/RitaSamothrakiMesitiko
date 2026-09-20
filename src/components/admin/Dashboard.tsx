import React from 'react'
import type { Listing, Category } from '../../lib/supabase'

export default function Dashboard({ listings, categories }: { listings: Listing[]; categories: Category[] }) {
  const activeListings = listings.filter(l => l.status === 'active')
  const soldListings = listings.filter(l => l.status === 'sold')
  const featuredListings = listings.filter(l => l.is_featured)
  const agoraCategories = categories.filter(c => c.type === 'agora' && !c.parent_id)
  const enoikiasiCategories = categories.filter(c => c.type === 'enoikiasi' && !c.parent_id)

  const stats = [
    { label: 'Ενεργές Αγγελίες', value: activeListings.length, color: 'bg-blue-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Πουλήθηκαν', value: soldListings.length, color: 'bg-red-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Προτεινόμενα', value: featuredListings.length, color: 'bg-accent', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { label: 'Κατηγορίες Αγοράς', value: agoraCategories.length, color: 'bg-green-500', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  ]

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Πίνακας Ελέγχου</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Listings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Πρόσφατες Αγγελίες</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">Κωδικός</th>
                <th className="px-6 py-3">Τίτλος</th>
                <th className="px-6 py-3">Κατηγορία</th>
                <th className="px-6 py-3">Τιμή</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.slice(0, 5).map(listing => (
                <tr key={listing.id} className="text-sm text-gray-700">
                  <td className="px-6 py-3 font-mono text-gray-400">#{listing.code}</td>
                  <td className="px-6 py-3 font-medium">{listing.title}</td>
                  <td className="px-6 py-3 text-gray-500">{listing.category?.name_el || '-'}</td>
                  <td className="px-6 py-3 font-semibold">
                    {new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price)}
                  </td>
                  <td className="px-6 py-3">
                    {listing.status === 'sold' ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Πουλήθηκε</span>
                    ) : listing.is_featured ? (
                      <span className="px-2 py-1 bg-accent/20 text-accent-dark text-xs rounded-full font-medium">Προτεινόμενο</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Ενεργό</span>
                    )}
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Δεν υπάρχουν αγγελίες</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
