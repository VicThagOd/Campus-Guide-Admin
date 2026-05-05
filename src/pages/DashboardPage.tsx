import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import ReceiptCard from "./ReceiptCard"
import ReceiptPreview from "./ReceiptPreview"

interface Code {
  id: string
  code: string
  type: string
  used: boolean
  used_by_email?: string
  used_at?: string
}

interface GroupedCodes {
  CBT: { available: Code[]; used: Code[]; availableCount: number; usedCount: number }
  PDF: { available: Code[]; used: Code[]; availableCount: number; usedCount: number }
}

interface Receipt {
  id: string
  user_id: string
  email: string
  name: string
  course: string
  payment_type: "pdf" | "cbt"
  amount: number
  file_url: string
  file_type: "image" | "pdf"
  status: "pending" | "approved" | "rejected"
  admin_note?: string
  created_at: string
  reviewed_at?: string
}

export default function DashboardPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [codes, setCodes] = useState<GroupedCodes>({
    CBT: { available: [], used: [], availableCount: 0, usedCount: 0 },
    PDF: { available: [], used: [], availableCount: 0, usedCount: 0 },
  })
  const [codesLoading, setCodesLoading] = useState(true)
  const [codesError, setCodesError] = useState<Error | null>(null)

  const fetchCodes = async () => {
    setCodesLoading(true)
    setCodesError(null)

    // Fetch counts separately using head:true to avoid row limit
    const [
      { count: cbtAvailableCount },
      { count: cbtUsedCount },
      { count: pdfAvailableCount },
      { count: pdfUsedCount },
    ] = await Promise.all([
      supabase.from("unlock_codes").select("*", { count: "exact", head: true }).eq("type", "cbt").eq("used", false),
      supabase.from("unlock_codes").select("*", { count: "exact", head: true }).eq("type", "cbt").eq("used", true),
      supabase.from("unlock_codes").select("*", { count: "exact", head: true }).eq("type", "pdf").eq("used", false),
      supabase.from("unlock_codes").select("*", { count: "exact", head: true }).eq("type", "pdf").eq("used", true),
    ])

    // Fetch only a preview of codes (first 20 of each) for display
    const [
      { data: cbtAvailable, error: e1 },
      { data: cbtUsed, error: e2 },
      { data: pdfAvailable, error: e3 },
      { data: pdfUsed, error: e4 },
    ] = await Promise.all([
      supabase.from("unlock_codes").select("id, code, type, used, used_by_email, used_at").eq("type", "cbt").eq("used", false).limit(20),
      supabase.from("unlock_codes").select("id, code, type, used, used_by_email, used_at").eq("type", "cbt").eq("used", true).order("used_at", { ascending: false }).limit(20),
      supabase.from("unlock_codes").select("id, code, type, used, used_by_email, used_at").eq("type", "pdf").eq("used", false).limit(20),
      supabase.from("unlock_codes").select("id, code, type, used, used_by_email, used_at").eq("type", "pdf").eq("used", true).order("used_at", { ascending: false }).limit(20),
    ])

    const firstError = e1 || e2 || e3 || e4
    if (firstError) {
      setCodesError(firstError as unknown as Error)
      setCodesLoading(false)
      return
    }

    setCodes({
      CBT: {
        available: (cbtAvailable ?? []) as Code[],
        used: (cbtUsed ?? []) as Code[],
        availableCount: cbtAvailableCount ?? 0,
        usedCount: cbtUsedCount ?? 0,
      },
      PDF: {
        available: (pdfAvailable ?? []) as Code[],
        used: (pdfUsed ?? []) as Code[],
        availableCount: pdfAvailableCount ?? 0,
        usedCount: pdfUsedCount ?? 0,
      },
    })

    setCodesLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showMessage("Copied to clipboard!")
  }

  const fetchReceipts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching receipts:", error)
    } else {
      setReceipts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReceipts()
    fetchCodes()

    const receiptsChannel = supabase
      .channel("receipts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "receipts" }, () => {
        fetchReceipts()
      })
      .subscribe()

    const codesChannel = supabase
      .channel("codes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "unlock_codes" }, () => {
        fetchCodes()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(receiptsChannel)
      supabase.removeChannel(codesChannel)
    }
  }, [])

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(""), 3000)
  }

  const handleApprove = async (receipt: Receipt) => {
    const now = new Date().toISOString()

    const { error: receiptError } = await supabase
      .from("receipts")
      .update({ status: "approved", reviewed_at: now })
      .eq("id", receipt.id)

    if (receiptError) {
      console.error("Receipt update error:", receiptError)
      showMessage(`Error: ${receiptError.message || "Failed to update receipt"}`)
      return
    }

    const cbtExpiresAt =
      receipt.payment_type === "cbt"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null

    // Fetch existing access to avoid overwriting the other type
    const { data: existingAccess } = await supabase
      .from("user_access")
      .select("pdf_access, cbt_access, cbt_expires_at")
      .eq("user_id", receipt.user_id)
      .single()

    const { error: accessError } = await supabase
      .from("user_access")
      .upsert([
        {
          user_id: receipt.user_id,
          email: receipt.email,
          pdf_access: receipt.payment_type === "pdf" ? true : existingAccess?.pdf_access ?? false,
          cbt_access: receipt.payment_type === "cbt" ? true : existingAccess?.cbt_access ?? false,
          cbt_expires_at: receipt.payment_type === "cbt" ? cbtExpiresAt : existingAccess?.cbt_expires_at ?? null,
          updated_at: now,
        },
      ], { onConflict: "user_id" })

    if (accessError) {
      console.error("Access update error:", accessError)
      showMessage(`Error: ${accessError.message || "Failed to grant access"}`)
      return

    setReceipts((prev) =>
      prev.map((r) => (r.id === receipt.id ? { ...r, status: "approved", reviewed_at: now } : r))
    )
    showMessage(`✓ Access granted to ${receipt.email}`)
  }

  const handleReject = async (receipt: Receipt) => {
    const note = window.prompt("Rejection note (optional):")
    const now = new Date().toISOString()

    const { error } = await supabase
      .from("receipts")
      .update({ status: "rejected", admin_note: note || null, reviewed_at: now })
      .eq("id", receipt.id)

    if (error) {
      console.error(error)
      return
    }

    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receipt.id
          ? { ...r, status: "rejected", admin_note: note || undefined, reviewed_at: now }
          : r
      )
    )
    showMessage("Receipt rejected")
  }

  const handleLogout = async () => {
    await (supabase.auth as any).signOut()
  }

  const filtered = receipts.filter((r) => r.status === activeTab)
  const counts = {
    pending: receipts.filter((r) => r.status === "pending").length,
    approved: receipts.filter((r) => r.status === "approved").length,
    rejected: receipts.filter((r) => r.status === "rejected").length,
  }

  const tabs = ["pending", "approved", "rejected"] as const

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-sky-700">Campus Guide Admin</p>
            <h1 className="text-xl font-semibold text-slate-900">Admin Dashboard</h1>
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
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Receipts Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Receipts</h2>
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
                        ? "bg-sky-600 text-white"
                        : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
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

          {/* Unlock Codes Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Unlock Codes</h2>
              <button
                onClick={fetchCodes}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            {codesLoading ? (
              <p className="py-12 text-center text-slate-400">Loading codes...</p>
            ) : codesError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center text-red-600">
                <p>Error loading codes: {codesError.message}</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {(["CBT", "PDF"] as const).map((type) => (
                  <div key={type} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-3 text-base font-semibold text-slate-700">{type} Codes</h3>
                    <div className="grid gap-4 sm:grid-cols-2">

                      {/* Available */}
                      <div>
                        <p className="mb-2 text-sm font-medium text-emerald-600">
                          Available ({codes[type].availableCount.toLocaleString()})
                        </p>
                        <p className="mb-2 text-xs text-slate-400">Showing first 20</p>
                        <ul className="grid gap-2">
                          {codes[type].available.length === 0 ? (
                            <li className="text-sm text-slate-400">No available codes</li>
                          ) : (
                            codes[type].available.map((code) => (
                              <li
                                key={code.id}
                                className="flex items-center justify-between rounded-md bg-white p-2 text-sm text-slate-800 shadow-sm"
                              >
                                <span className="font-mono">{code.code}</span>
                                <button
                                  onClick={() => copyToClipboard(code.code)}
                                  className="ml-2 text-sky-600 hover:text-sky-700"
                                  title="Copy code"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                  </svg>
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>

                      {/* Used */}
                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-500">
                          Used ({codes[type].usedCount.toLocaleString()})
                        </p>
                        <p className="mb-2 text-xs text-slate-400">Showing last 20</p>
                        <ul className="grid gap-2">
                          {codes[type].used.length === 0 ? (
                            <li className="text-sm text-slate-400">No used codes</li>
                          ) : (
                            codes[type].used.map((code) => (
                              <li key={code.id} className="rounded-md bg-white p-2 text-sm shadow-sm">
                                <span className="font-mono text-slate-400 line-through">{code.code}</span>
                                {code.used_by_email && (
                                  <p className="mt-0.5 truncate text-xs text-slate-400">{code.used_by_email}</p>
                                )}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
