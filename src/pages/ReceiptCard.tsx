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

interface Props {
  receipt: Receipt
  onApprove: (receipt: Receipt) => void
  onReject: (receipt: Receipt) => void
  onPreview: (receipt: Receipt) => void
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ReceiptCard({ receipt, onApprove, onReject, onPreview }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{receipt.name}</p>
          <p className="truncate text-sm text-slate-500">{receipt.email}</p>
          <p className="text-sm text-slate-500">{receipt.course}</p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1 text-right">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              receipt.payment_type === 'pdf'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {receipt.payment_type.toUpperCase()}
          </span>
          <span className="text-sm font-semibold text-slate-700">₦{receipt.amount.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">{timeAgo(receipt.created_at)}</p>

        {receipt.status === 'pending' ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              onClick={() => onPreview(receipt)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Preview
            </button>
            <button
              onClick={() => onReject(receipt)}
              className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
            >
              Reject
            </button>
            <button
              onClick={() => onApprove(receipt)}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
            >
              Approve
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              onClick={() => onPreview(receipt)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Preview
            </button>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                receipt.status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {receipt.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
            </span>
          </div>
        )}
      </div>

      {receipt.status === 'rejected' && receipt.admin_note && (
        <p className="mt-2 text-xs italic text-slate-500">Note: {receipt.admin_note}</p>
      )}
    </div>
  )
}

