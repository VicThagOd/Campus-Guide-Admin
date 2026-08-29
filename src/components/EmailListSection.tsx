import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Download02Icon, RefreshIcon, InformationCircleIcon, UserCheck02Icon, Mail01Icon } from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'

export interface ProfileOptIn {
  id: string
  username: string | null
  name: string | null
  email: string | null
  course: string | null
  email_opt_in: boolean
  created_at?: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  created_at: string
}

export default function EmailListSection() {
  const [optInProfiles, setOptInProfiles] = useState<ProfileOptIn[]>([])
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'profiles' | 'newsletter'>('all')

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [profilesRes, subscribersRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, name, email, course, email_opt_in, created_at')
          .eq('email_opt_in', true),
        supabase
          .from('newsletter_subscribers')
          .select('id, email, created_at')
          .order('created_at', { ascending: false }),
      ])

      if (profilesRes.error) console.error('Error fetching opt-in profiles:', profilesRes.error)
      if (subscribersRes.error) console.error('Error fetching newsletter subscribers:', subscribersRes.error)

      setOptInProfiles(profilesRes.data || [])
      setSubscribers(subscribersRes.data || [])
    } catch (e: any) {
      console.error('Error fetching email list data:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const exportCSV = () => {
    const rows: string[][] = [
      ['Source', 'Email', 'Name', 'Username', 'Course', 'Date Added'],
    ]

    // Add opted-in profiles
    optInProfiles.forEach((p) => {
      if (p.email) {
        rows.push([
          'Opt-in Profile',
          p.email,
          p.name || '',
          p.username || '',
          p.course || '',
          p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
        ])
      }
    })

    // Add newsletter subscribers
    subscribers.forEach((s) => {
      rows.push([
        'Newsletter Subscriber',
        s.email,
        '',
        '',
        '',
        new Date(s.created_at).toLocaleDateString(),
      ])
    })

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `campus_guide_email_subscribers_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const combinedCount = optInProfiles.length + subscribers.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
            Email Subscriber Directory
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            User profiles opted-in at registration and newsletter subscribers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
            style={{ borderColor: BORDER, color: INK }}
          >
            <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            disabled={combinedCount === 0}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: PRIMARY }}
          >
            <Download02Icon size={18} />
            Export to CSV
          </button>
        </div>
      </div>

      {/* SendByte Notice Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <InformationCircleIcon size={20} className="mt-0.5 shrink-0 text-sky-700" />
        <div>
          <p className="font-semibold">Email Broadcast Integration Notice</p>
          <p className="mt-0.5 text-xs text-sky-800 leading-relaxed">
            Emails are currently directory view and CSV export only. Automated newsletter and broadcast email sending will be handled via SendByte API integration in an upcoming sprint.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-4" style={{ borderColor: BORDER }}>
        <button
          onClick={() => setActiveTab('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border text-slate-600 hover:bg-slate-50'
          }`}
          style={activeTab !== 'all' ? { borderColor: BORDER } : {}}
        >
          All Contacts ({combinedCount})
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            activeTab === 'profiles'
              ? 'bg-sky-100 text-sky-900 border border-sky-300'
              : 'bg-white border text-slate-600 hover:bg-slate-50'
          }`}
          style={activeTab !== 'profiles' ? { borderColor: BORDER } : {}}
        >
          <UserCheck02Icon size={14} className="inline mr-1" />
          Opted-In Profiles ({optInProfiles.length})
        </button>
        <button
          onClick={() => setActiveTab('newsletter')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            activeTab === 'newsletter'
              ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
              : 'bg-white border text-slate-600 hover:bg-slate-50'
          }`}
          style={activeTab !== 'newsletter' ? { borderColor: BORDER } : {}}
        >
          <Mail01Icon size={14} className="inline mr-1" />
          Newsletter Subscribers ({subscribers.length})
        </button>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: MUTED }}>
          Loading email subscribers...
        </div>
      ) : combinedCount === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
          <p style={{ color: MUTED }}>No email subscribers found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm" style={{ borderColor: BORDER }}>
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase font-semibold text-slate-600" style={{ borderColor: BORDER }}>
              <tr>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-5 py-3">Name / Username</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: BORDER }}>
              {(activeTab === 'all' || activeTab === 'profiles') &&
                optInProfiles.map((p) => (
                  <tr key={`p-${p.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                        <UserCheck02Icon size={12} />
                        Profile Opt-In
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">{p.email || 'N/A'}</td>
                    <td className="px-5 py-3 text-slate-700">
                      {p.name || p.username ? `${p.name || ''} ${p.username ? `(@${p.username})` : ''}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{p.course || '-'}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}

              {(activeTab === 'all' || activeTab === 'newsletter') &&
                subscribers.map((s) => (
                  <tr key={`s-${s.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                        <Mail01Icon size={12} />
                        Newsletter
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">{s.email}</td>
                    <td className="px-5 py-3 text-slate-400">-</td>
                    <td className="px-5 py-3 text-slate-400">-</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
