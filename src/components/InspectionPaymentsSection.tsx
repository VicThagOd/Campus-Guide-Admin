import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshIcon, House01Icon } from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'

interface InspectionPaymentItem {
  id: string
  user_id: string
  accommodation_id: string
  amount: number
  whatsapp_number: string
  status: string
  created_at: string
  accommodations?: { title: string } | null
  profiles?: { name: string; email: string } | null
}

export default function InspectionPaymentsSection() {
  const [payments, setPayments] = useState<InspectionPaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('inspection_payments')
      .select('*, accommodations(title), profiles(name, email)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching inspection payments:', error)
      setError(error.message)
    } else {
      setPayments(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPayments()

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const channel = supabase
      .channel('realtime:inspection_payments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inspection_payments' },
        (payload: any) => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🏠 New Inspection Payment!', {
              body: `A student just paid ₦${Number(payload.new.amount || 5000).toLocaleString()} for hostel inspection (${payload.new.whatsapp_number || 'WhatsApp'}).`,
              icon: '/favicon-32x32.png',
            })
          }
          fetchPayments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
            Inspection Payments
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Accommodation inspection fee payments with student WhatsApp numbers.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
          style={{ borderColor: BORDER, color: INK }}
        >
          <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: MUTED }}>
          Loading inspection payments...
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#EEF2FC' }}>
            <House01Icon size={32} color={PRIMARY} />
          </span>
          <p className="text-lg font-semibold" style={{ color: INK }}>No inspection payments yet</p>
          <p className="mt-1 text-sm" style={{ color: MUTED }}>Payments will appear here once students pay inspection fees.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center"
              style={{ borderColor: BORDER }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    {`\u20A6${payment.amount.toLocaleString()}`}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      payment.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {payment.status}
                  </span>
                  <span className="text-xs" style={{ color: MUTED }}>
                    {new Date(payment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: INK }}>
                  {(payment as any).accommodations?.title || 'Accommodation'}
                </p>
                <p className="text-sm" style={{ color: MUTED }}>
                  {(payment as any).profiles?.name || 'Student'} {(payment as any).profiles?.email ? `(${(payment as any).profiles.email})` : ''}
                </p>
              </div>
              <div className="mt-3 sm:mt-0">
                <a
                  href={`https://wa.me/${payment.whatsapp_number.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#25D366' }}
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
