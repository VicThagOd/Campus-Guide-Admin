import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import DashboardPage from './pages/DashboardPage'
import AdminLogin from './pages/AdminLogin'

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    ;(supabase.auth as any)
      .getSession()
      .then(({ data, error }: { data: { session: any }; error: any }) => {
        if (!mounted) return
        if (error) console.error(error)
        setSession(data.session)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        console.error(e)
        setLoading(false)
      })

    const { data: subscription } = (supabase.auth as any).onAuthStateChange(
      (_event: unknown, newSession: unknown) => {
      setSession(newSession)
      },
    )

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-slate-50" />
  }

  return session ? <DashboardPage /> : <AdminLogin />
}

export default App
