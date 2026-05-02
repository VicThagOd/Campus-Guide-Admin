import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ReceiptCard from './ReceiptCard'
import ReceiptPreview from './ReceiptPreview'

interface Receipt {
  id: string
  user_id: string
  email: string
  name: string
  course: string
  payment_type: 'pdf' | 'cbt'
  amount: number
  file_url: string
  file_type: 'image' | 'pdf'
  status: 'pending' | 'approved' | 'rejected'
  admin_note?: string
  created_at: string
  reviewed_at?: string
}

export default function DashboardPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchReceipts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching receipts:', error)
    } else {
      setReceipts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReceipts()

    const channel = supabase
      .channel('receipts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receipts' }, () => {
        fetchReceipts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleApprove = async (receipt: Receipt) => {
    const now = new Date().toISOString()

    const { error: receiptError } = await supabase
      .from('receipts')
      .update({ status: 'approved', reviewed_at: now })
      .eq('id', receipt.id)

    if (receiptError) {
      console.error('Receipt update error:', receiptError)
      console.error('Error details:', JSON.stringify(receiptError, null, 2))
      showMessage(`Error: ${receiptError.message || 'Failed to update receipt'}`)
      return
    }

    const cbtExpiresAt =
      receipt.payment_type === 'cbt'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null

    const { error: accessError } = await supabase
      .from('user_access')
      .upsert([
        {
          user_id: receipt.user_id,
          email: receipt.email,
          pdf_access: receipt.payment_type === 'pdf',
          cbt_access: receipt.payment_type === 'cbt',
          cbt_expires_at: cbtExpiresAt,
          updated_at: now,
        },
      ])
      .select()

    if (accessError) {
      console.error('Access update error:', accessError)
      console.error('Error details:', JSON.stringify(accessError, null, 2))
      showMessage(`Error: ${accessError.message || 'Failed to grant access'}`)
      return
    }

    setReceipts((prev) =>
      prev.map((r) => (r.id === receipt.id ? { ...r, status: 'approved', reviewed_at: now } : r)),
    )
    showMessage(`✓ Access granted to ${receipt.email}`)
  }

  const handleReject = async (receipt: Receipt) => {
    const note = window.prompt('Rejection note (optional):')
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('receipts')
      .update({ status: 'rejected', admin_note: note || null, reviewed_at: now })
      .eq('id', receipt.id)

    if (error) {
      console.error(error)
      return
    }

    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receipt.id
          ? { ...r, status: 'rejected', admin_note: note || undefined, reviewed_at: now }
          : r,
      ),
    )
    showMessage('Receipt rejected')
  }

  const handleLogout = async () => {
    await (supabase.auth as any).signOut()
  }

  const filtered = receipts.filter((r) => r.status === activeTab)
  const counts = {
    pending: receipts.filter((r) => r.status === 'pending').length,
    approved: receipts.filter((r) => r.status === 'approved').length,
    rejected: receipts.filter((r) => r.status === 'rejected').length,
  }

  const tabs = ['pending', 'approved', 'rejected'] as const

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-sky-700">Campus Guide Admin</p>
            <h1 className="text-xl font-semibold text-slate-900">Receipt Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 sm:w-auto"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {tabs.map((tab) => (
            <div key={tab} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-500">{tab}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{counts[tab]}</p>
              <p className="text-sm text-slate-400">receipts</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:overflow-visible sm:px-0 sm:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-sky-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab} ({counts[tab]})
              </button>
            ))}
          </div>
          <button
            onClick={fetchReceipts}
            className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:ml-auto sm:w-auto"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="py-12 text-center text-slate-400">Loading receipts...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-400">No {activeTab} receipts</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                onApprove={handleApprove}
                onReject={handleReject}
                onPreview={setPreviewReceipt}
              />
            ))}
          </div>
        )}
      </div>

      {previewReceipt && (
        <ReceiptPreview receipt={previewReceipt} onClose={() => setPreviewReceipt(null)} />
      )}

      {message && (
        <div className="fixed bottom-4 left-4 right-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto">
          {message}
        </div>
      )}
    </div>
  )
}

