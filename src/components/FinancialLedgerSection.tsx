import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshIcon, Wallet01Icon, Book01Icon, Key01Icon, House01Icon, Calendar03Icon, Search01Icon } from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'

interface LedgerItem {
  id: string
  type: 'cbt' | 'pdf' | 'inspection' | 'ticket'
  studentName: string
  studentEmail: string
  description: string
  amount: number
  date: string
  reference: string
}

export default function FinancialLedgerSection() {
  const [ledger, setLedger] = useState<LedgerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [timeWindow, setTimeWindow] = useState<'all' | 'month' | 'week'>('all')

  const fetchLedgerData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch User Profiles to map names and emails
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, name, email')

      if (profilesErr) console.error('Profiles fetch error:', profilesErr)
      const profileNameMap = new Map(profiles?.map((p) => [p.id, p.name]) || [])
      const profileEmailMap = new Map(profiles?.map((p) => [p.id, p.email]) || [])

      // 2. Fetch Processed Webhooks
      const { data: webhooks, error: webhooksErr } = await supabase
        .from('processed_webhooks')
        .select('id, trans_ref, product_type, user_id, created_at')
        .order('created_at', { ascending: false })

      if (webhooksErr) console.error('Webhooks fetch error:', webhooksErr)

      // 3. Fetch Hostel Inspection payments
      const { data: inspections, error: inspectErr } = await supabase
        .from('inspection_payments')
        .select('id, user_id, amount, payment_reference, created_at, accommodations(title)')

      if (inspectErr) console.error('Inspections fetch error:', inspectErr)

      // 4. Fetch Event Ticket sales
      const { data: tickets, error: ticketErr } = await supabase
        .from('event_tickets')
        .select('id, user_id, payment_reference, created_at, tier_name, tier_price, events(title, ticket_price)')

      if (ticketErr) console.error('Tickets fetch error:', ticketErr)

      const items: LedgerItem[] = []

      webhooks?.forEach((wh: any) => {
        const studentName = profileNameMap.get(wh.user_id) || 'Student'
        const studentEmail = profileEmailMap.get(wh.user_id) || 'N/A'
        
        if (wh.product_type === 'cbt') {
          items.push({
            id: `cbt-${wh.id}`,
            type: 'cbt',
            studentName,
            studentEmail,
            description: 'Post-UTME CBT practice hub access key',
            amount: 2000,
            date: wh.created_at,
            reference: wh.trans_ref || 'FW-WEBHOOK',
          })
        } else if (wh.product_type === 'pdf') {
          items.push({
            id: `pdf-${wh.id}`,
            type: 'pdf',
            studentName,
            studentEmail,
            description: 'Post-UTME past questions PDF package',
            amount: 1500,
            date: wh.created_at,
            reference: wh.trans_ref || 'FW-WEBHOOK',
          })
        }
      })

      inspections?.forEach((ins: any) => {
        const studentName = profileNameMap.get(ins.user_id) || 'Student'
        const studentEmail = profileEmailMap.get(ins.user_id) || 'N/A'
        items.push({
          id: `ins-${ins.id}`,
          type: 'inspection',
          studentName,
          studentEmail,
          description: `Hostel inspection fee: ${ins.accommodations?.title || 'Unknown Hostel'}`,
          amount: Number(ins.amount) || 5000,
          date: ins.created_at,
          reference: ins.payment_reference || 'N/A',
        })
      })

      tickets?.forEach((t: any) => {
        const studentName = profileNameMap.get(t.user_id) || 'Student'
        const studentEmail = profileEmailMap.get(t.user_id) || 'N/A'
        items.push({
          id: `tkt-${t.id}`,
          type: 'ticket',
          studentName,
          studentEmail,
          description: `Ticket purchase: ${t.events?.title || 'Paid Event'} (${t.tier_name || 'Regular'})`,
          amount: Number(t.tier_price) || Number(t.events?.ticket_price) || 0,
          date: t.created_at,
          reference: t.payment_reference || 'N/A',
        })
      })

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setLedger(items)
    } catch (err: any) {
      console.error('Error fetching ledger details:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedgerData()
  }, [])

  const windowStart = new Date()
  if (timeWindow === 'week') windowStart.setDate(windowStart.getDate() - 7)
  if (timeWindow === 'month') windowStart.setMonth(windowStart.getMonth() - 1)
  const windowedLedger = timeWindow === 'all' ? ledger : ledger.filter((item) => new Date(item.date) >= windowStart)

  const totalCbt = windowedLedger.filter((i) => i.type === 'cbt').reduce((sum, i) => sum + i.amount, 0)
  const totalPdf = windowedLedger.filter((i) => i.type === 'pdf').reduce((sum, i) => sum + i.amount, 0)
  const totalInspection = windowedLedger.filter((i) => i.type === 'inspection').reduce((sum, i) => sum + i.amount, 0)
  const totalTickets = windowedLedger.filter((i) => i.type === 'ticket').reduce((sum, i) => sum + i.amount, 0)
  const overallTotal = totalCbt + totalPdf + totalInspection + totalTickets

  const filteredItems = windowedLedger.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      item.studentName.toLowerCase().includes(searchLower) ||
      item.studentEmail.toLowerCase().includes(searchLower) ||
      item.reference.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower)

    const matchesType = filterType === 'all' || item.type === filterType

    return matchesSearch && matchesType
  })

  const formatDateStr = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>
            Financial Ledger
          </h2>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Real-time audit log of all payments and income across Campus Guide features.
          </p>
        </div>

        <button
          onClick={fetchLedgerData}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-slate-50 self-start sm:self-auto"
          style={{ borderColor: BORDER, color: INK }}
        >
          <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-white p-5 shadow-sm border-l-4 border-l-blue-600 transition-all hover:shadow-md" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <Wallet01Icon size={18} style={{ color: PRIMARY }} />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: INK }}>₦{overallTotal.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm border-l-4 border-l-indigo-500 transition-all hover:shadow-md" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">CBT Practice</span>
            <Key01Icon size={18} className="text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: INK }}>₦{totalCbt.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm border-l-4 border-l-teal-500 transition-all hover:shadow-md" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">PDF Questions</span>
            <Book01Icon size={18} className="text-teal-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: INK }}>₦{totalPdf.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm border-l-4 border-l-amber-500 transition-all hover:shadow-md" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Inspections</span>
            <House01Icon size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: INK }}>₦{totalInspection.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm border-l-4 border-l-pink-500 transition-all hover:shadow-md" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Event Tickets</span>
            <Calendar03Icon size={18} className="text-pink-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: INK }}>₦{totalTickets.toLocaleString()}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {/* Filters and List */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: BORDER }}>
        <div className="flex flex-wrap gap-2 border-b px-5 py-3" style={{ borderColor: BORDER }}>
          {[{ id: 'all', label: 'All time' }, { id: 'month', label: 'Last 30 days' }, { id: 'week', label: 'Last 7 days' }].map((window) => (
            <button key={window.id} onClick={() => setTimeWindow(window.id as 'all' | 'month' | 'week')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${timeWindow === window.id ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} style={timeWindow === window.id ? { backgroundColor: PRIMARY } : undefined}>{window.label}</button>
          ))}
        </div>
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: BORDER }}>
          <div className="relative flex-1 max-w-md">
            <Search01Icon size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, email, reference or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border pl-10 pr-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: BORDER, color: INK }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'cbt', label: `CBT (${ledger.filter((i) => i.type === 'cbt').length})` },
              { id: 'pdf', label: `PDF (${ledger.filter((i) => i.type === 'pdf').length})` },
              { id: 'inspection', label: `Inspection (${ledger.filter((i) => i.type === 'inspection').length})` },
              { id: 'ticket', label: `Ticket (${ledger.filter((i) => i.type === 'ticket').length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  filterType === t.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: MUTED }}>
            Loading financial ledger records...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: MUTED }}>
            No matching transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b" style={{ borderColor: BORDER }}>
                <tr>
                  <th className="px-5 py-3.5 hidden md:table-cell">Transaction Date</th>
                  <th className="px-5 py-3.5">Student Details</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 hidden lg:table-cell">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: BORDER }}>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 text-xs text-slate-500 hidden md:table-cell">
                      {formatDateStr(item.date)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{item.studentName}</div>
                      <div className="text-xs text-slate-500">{item.studentEmail}</div>
                      <div className="text-[10px] text-slate-400 mt-1 block md:hidden">
                        {formatDateStr(item.date)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={
                          item.type === 'cbt'
                            ? { backgroundColor: '#EEF2FC', color: PRIMARY }
                            : item.type === 'pdf'
                            ? { backgroundColor: '#E6F8F3', color: '#118165' }
                            : item.type === 'inspection'
                            ? { backgroundColor: '#FEF6E4', color: '#B7791F' }
                            : { backgroundColor: '#FDF2F8', color: '#DB2777' }
                        }
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-700 max-w-[200px] truncate md:max-w-xs">
                      {item.description}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      ₦{item.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-500 hidden lg:table-cell">
                      {item.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
