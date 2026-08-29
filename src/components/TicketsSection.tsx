import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshIcon, Ticket01Icon } from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'

interface TicketItem {
  id: string
  event_id: string
  user_id: string
  ticket_code: string
  whatsapp_number: string
  created_at: string
  events?: { title: string } | null
  profiles?: { name: string; email: string } | null
}

export default function TicketsSection() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('event_tickets')
      .select('*, events(title), profiles(name, email)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tickets:', error)
      setError(error.message)
    } else {
      setTickets(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
            Event Tickets
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Purchased tickets with student WhatsApp numbers for direct contact.
          </p>
        </div>
        <button
          onClick={fetchTickets}
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
          Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#EEF2FC' }}>
            <Ticket01Icon size={32} color={PRIMARY} />
          </span>
          <p className="text-lg font-semibold" style={{ color: INK }}>No tickets purchased yet</p>
          <p className="mt-1 text-sm" style={{ color: MUTED }}>Tickets will appear here once students purchase them.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center"
              style={{ borderColor: BORDER }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    <Ticket01Icon size={12} />
                    {ticket.ticket_code}
                  </span>
                  <span className="text-xs" style={{ color: MUTED }}>
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: INK }}>
                  {(ticket as any).events?.title || 'Event'}
                </p>
                <p className="text-sm" style={{ color: MUTED }}>
                  {(ticket as any).profiles?.name || 'Student'} {(ticket as any).profiles?.email ? `(${(ticket as any).profiles.email})` : ''}
                </p>
              </div>
              <div className="mt-3 sm:mt-0">
                <a
                  href={`https://wa.me/${ticket.whatsapp_number.replace(/[^0-9]/g, '')}`}
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
