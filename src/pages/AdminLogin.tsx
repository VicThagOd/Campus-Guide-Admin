import { useState } from 'react'
import { Alert02Icon, ArrowLeft01Icon, Loading01Icon, LockIcon } from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'

export default function AdminLogin({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [masterKey, setMasterKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const expectedKey = 'Aluta Continua'
    if (masterKey.trim().toLowerCase() === expectedKey.toLowerCase()) {
      localStorage.setItem('cg_admin_auth', 'true')
      setLoading(false)
      if (onLoginSuccess) {
        onLoginSuccess()
      } else {
        window.location.reload()
      }
    } else {
      setError('Invalid Master Key. Please enter the correct admin access key.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <button
            onClick={() => (window.location.href = '/')}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors duration-150 hover:bg-white"
            style={{ color: PRIMARY, border: `1px solid ${BORDER}` }}
          >
            <ArrowLeft01Icon size={14} />
            Back to Site
          </button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-2" style={{ fontSize: '1.75rem', fontWeight: 600, color: PRIMARY }}>
            Campus Guide
          </h1>
          <p className="text-lg font-semibold tracking-tight" style={{ color: INK }}>
            Admin Portal Access
          </p>
          <p style={{ color: MUTED, fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Enter the Admin Master Key to open the dashboard
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded bg-red-100 p-3 text-sm text-red-700">
              <Alert02Icon size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="masterKey" className="mb-2 block text-sm font-medium" style={{ color: INK }}>
                Admin Master Key
              </label>
              <input
                id="masterKey"
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ color: INK, backgroundColor: '#FFFFFF' }}
                placeholder="Enter Master Key"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 text-sm"
              style={{ backgroundColor: PRIMARY }}
            >
              {loading ? (
                <>
                  <Loading01Icon size={18} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <LockIcon size={18} />
                  Access Admin Dashboard
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center" style={{ fontSize: '0.75rem', color: MUTED }}>
          Restricted access. Authorized personnel only.
        </p>
      </div>
    </div>
  )
}