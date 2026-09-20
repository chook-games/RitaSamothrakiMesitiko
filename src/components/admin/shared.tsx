import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] onAuthStateChange event:', event, 'user:', session?.user?.email)
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
  }

  const signUp = async (email: string, password: string) => {
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
  }

  const signOut = () => supabase.auth.signOut()

  return { user, loading, error, signIn, signUp, signOut }
}

export function LoginForm({ onLogin, error }: { onLogin: (email: string, password: string) => void; error?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(email, password)
  }

  const handleReset = async () => {
    setNotice('')
    if (!email) { setNotice('Γράψε πρώτα το email σου.'); return }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
    setNotice(resetError
      ? 'Σφάλμα: ' + resetError.message
      : 'Στάλθηκε email επαναφοράς κωδικού (αν υπάρχει ο λογαριασμός).')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-light p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Πίνακας</h1>
            <p className="text-gray-500 mt-1">Συνδεθείτε για να διαχειριστείτε το γραφείο σας</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm px-4 py-3">
                {notice}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Κωδικός</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors shadow-sm"
            >
              Σύνδεση
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full text-center text-sm text-gray-500 hover:text-primary transition-colors"
            >
              Ξέχασα τον κωδικό
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
            Ο λογαριασμός διαχειριστή δημιουργείται από το Supabase
            (Authentication → Users). Δεν είναι κοινόχρηστος κωδικός τύπου «admin».
          </p>
        </div>
      </div>
    </div>
  )
}

export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  const bg = type === 'success' ? 'bg-green-500' : 'bg-red-500'
  return (
    <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 ${bg} text-white rounded-xl shadow-lg text-sm font-medium animate-bounce`}>
      {message}
    </div>
  )
}
