interface Receipt {
  id: string
  name: string
  email: string
  course: string
  payment_type: 'pdf' | 'cbt'
  amount: number
  file_url: string
  file_type: 'image' | 'pdf'
  status: 'pending' | 'approved' | 'rejected'
}

interface Props {
  receipt: Receipt
  onClose: () => void
}

export default function ReceiptPreview({ receipt, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{receipt.name}</p>
            <p className="break-words text-sm text-slate-500">{receipt.email}</p>
            <p className="text-sm text-slate-500">{receipt.course}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                receipt.payment_type === 'pdf'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {receipt.payment_type.toUpperCase()} · ₦{receipt.amount.toLocaleString()}
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {receipt.file_type === 'image' ? (
            <img
              src={receipt.file_url}
              alt="Receipt"
              className="max-h-[60vh] w-full rounded-lg border border-slate-200 object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-slate-500">PDF receipt</p>
              <a
                href={receipt.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-lg bg-sky-600 px-6 py-3 text-center font-semibold text-white hover:bg-sky-700 sm:w-auto"
              >
                Open PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

