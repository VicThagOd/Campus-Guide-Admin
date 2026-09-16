import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import DashboardPage from './pages/DashboardPage'
import AdminLogin from './pages/AdminLogin'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  const checkAuth = () => {
    const isLocalAuth = localStorage.getItem('cg_admin_auth') === 'true'
    if (isLocalAuth) {
      setIsAuthenticated(true)
      setLoading(false)
      return
    }

    ;(supabase.auth as any)
      .getSession()
      .then(({ data, error }: { data: { session: any }; error: any }) => {
        if (error) console.error(error)
        setIsAuthenticated(!!data?.session || isLocalAuth)
        setLoading(false)
      })
      .catch((e: unknown) => {
        console.error(e)
        setIsAuthenticated(isLocalAuth)
        setLoading(false)
      })
  }

  useEffect(() => {
    checkAuth()

    const { data: subscription } = (supabase.auth as any).onAuthStateChange(
      (_event: unknown, newSession: unknown) => {
        const isLocalAuth = localStorage.getItem('cg_admin_auth') === 'true'
        setIsAuthenticated(!!newSession || isLocalAuth)
      },
    )

    return () => {
      subscription?.subscription?.unsubscribe()
    }
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-slate-50" />
  }

  return isAuthenticated ? (
    <DashboardPage />
  ) : (
    <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
  )
}

export default App
