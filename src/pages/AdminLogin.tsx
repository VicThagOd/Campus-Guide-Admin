import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
    if (email.trim().toLowerCase() !== adminEmail?.toLowerCase()) {
      setError('Unauthorized. This portal is for admins only.')
      setLoading(false)
      return
    }

    const { error: authError } = await (supabase.auth as any).signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-sky-700">Campus Guide</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Admin Login</h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-600 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

