import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  Key01Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  RefreshIcon,
  Search01Icon,
  PlusSignIcon,
  Book01Icon,
  LaptopCheckIcon,
} from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'
const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

interface UnlockCode {
  id: string
  code: string
  type: 'cbt' | 'pdf' | string
  used: boolean
  used_by_email: string | null
  used_at: string | null
  expires_at: string | null
}

// Generate random safe code (avoids easily confused chars like 0, O, 1, I)
function generateRandomCode(prefix: 'CGC' | 'CGP'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let part1 = ''
  let part2 = ''
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length))
    part2 += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}-${part1}-${part2}`
}

export default function PostUtmeCodesSection() {
  const [codes, setCodes] = useState<UnlockCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Filters
  const [tab, setTab] = useState<'usable_all' | 'usable_cbt' | 'usable_pdf' | 'used'>('usable_all')
  const [search, setSearch] = useState('')

  // Single copy tracker
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Generator form
  const [genType, setGenType] = useState<'cbt' | 'pdf'>('cbt')
  const [genCount, setGenCount] = useState<number>(10)
  const [generating, setGenerating] = useState(false)
  const [generatedBatch, setGeneratedBatch] = useState<string[]>([])

  // Reviving dormant code tracker
  const [revivingId, setRevivingId] = useState<string | null>(null)

  const fetchCodes = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('unlock_codes')
        .select('*')
        .order('used', { ascending: true })

      if (err) throw err
      setCodes(data || [])
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch unlock codes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCodes()
  }, [])

  // Metrics
  const stats = useMemo(() => {
    let usableCbt = 0
    let usablePdf = 0
    let usedCount = 0

    codes.forEach((c) => {
      if (!c.used) {
        if (c.type === 'cbt') usableCbt++
        else usablePdf++
      } else {
        usedCount++
      }
    })

    return { usableCbt, usablePdf, usedCount, total: codes.length }
  }, [codes])

  // Filtered list
  const filteredCodes = useMemo(() => {
    let list = codes

    if (tab === 'usable_all') {
      list = list.filter((c) => !c.used)
    } else if (tab === 'usable_cbt') {
      list = list.filter((c) => !c.used && c.type === 'cbt')
    } else if (tab === 'usable_pdf') {
      list = list.filter((c) => !c.used && c.type === 'pdf')
    } else if (tab === 'used') {
      list = list.filter((c) => c.used)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          (c.used_by_email && c.used_by_email.toLowerCase().includes(q))
      )
    }

    return list
  }, [codes, tab, search])

  // Copy code utility
  const copyToClipboard = (text: string, label = 'Code copied to clipboard') => {
    navigator.clipboard.writeText(text)
    setCopiedCode(text)
    setActionSuccess(label)
    setTimeout(() => {
      setCopiedCode(null)
      setActionSuccess(null)
    }, 2500)
  }

  // Copy batch of usable codes
  const copyBatch = (count: number) => {
    const pool = codes.filter((c) => {
      if (c.used) return false
      if (tab === 'usable_cbt') return c.type === 'cbt'
      if (tab === 'usable_pdf') return c.type === 'pdf'
      return true
    })

    if (pool.length === 0) {
      setError('No usable codes matching current view to copy.')
      return
    }

    const selected = pool.slice(0, count).map((c) => c.code)
    copyToClipboard(selected.join('\n'), `Copied ${selected.length} usable codes to clipboard`)
  }

  // Handle generating new codes
  const handleGenerate = async () => {
    if (genCount < 1 || genCount > 200) {
      setError('Please choose a count between 1 and 200.')
      return
    }

    setGenerating(true)
    setError(null)
    setActionSuccess(null)

    try {
      const prefix = genType === 'cbt' ? 'CGC' : 'CGP'
      const newCodes: { code: string; type: string; used: boolean }[] = []
      const codeStrings: string[] = []

      for (let i = 0; i < genCount; i++) {
        const codeStr = generateRandomCode(prefix)
        codeStrings.push(codeStr)
        newCodes.push({
          code: codeStr,
          type: genType,
          used: false,
        })
      }

      const { error: insertErr } = await supabase.from('unlock_codes').insert(newCodes)
      if (insertErr) throw insertErr

      setGeneratedBatch(codeStrings)
      setActionSuccess(`Successfully generated ${genCount} new ${genType.toUpperCase()} codes!`)
      await fetchCodes()
    } catch (err: any) {
      setError(err?.message || 'Failed to generate codes')
    } finally {
      setGenerating(false)
    }
  }

  // Revive / reset dormant code to usable
  const handleMakeUsable = async (codeItem: UnlockCode) => {
    setRevivingId(codeItem.id)
    setError(null)
    setActionSuccess(null)

    try {
      const { error: updateErr } = await supabase
        .from('unlock_codes')
        .update({
          used: false,
          used_by_email: null,
          used_at: null,
          expires_at: null,
        })
        .eq('id', codeItem.id)

      if (updateErr) throw updateErr

      // Optimistic update in state
      setCodes((prev) =>
        prev.map((c) =>
          c.id === codeItem.id
            ? { ...c, used: false, used_by_email: null, used_at: null, expires_at: null }
            : c
        )
      )

      setActionSuccess(`Code ${codeItem.code} is now marked as usable!`)
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (err: any) {
      setError(err?.message || 'Failed to revive code')
    } finally {
      setRevivingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
            Post-UTME & CBT Codes Manager
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Copy usable voucher keys, generate fresh batches, and restore dormant codes.
          </p>
        </div>
        <button
          onClick={fetchCodes}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
          style={{ borderColor: BORDER, color: INK }}
        >
          <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Success / Notification Banner */}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          <CheckmarkCircle01Icon size={18} />
          {actionSuccess}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: MUTED }}>
              Usable CBT Codes
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <LaptopCheckIcon size={20} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums" style={{ color: INK }}>
            {stats.usableCbt}
          </p>
          <p className="mt-1 text-xs" style={{ color: MUTED }}>
            Mock CBT practice keys (CGC-...)
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: MUTED }}>
              Usable PDF Codes
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Book01Icon size={20} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums" style={{ color: INK }}>
            {stats.usablePdf}
          </p>
          <p className="mt-1 text-xs" style={{ color: MUTED }}>
            Past questions pack keys (CGP-...)
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: MUTED }}>
              Used / Dormant Codes
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Key01Icon size={20} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums" style={{ color: INK }}>
            {stats.usedCount}
          </p>
          <p className="mt-1 text-xs" style={{ color: MUTED }}>
            Can be revived back to usable
          </p>
        </div>
      </div>

      {/* Generate Codes Box */}
      <div className="rounded-xl border bg-white p-6" style={{ borderColor: BORDER }}>
        <h3 className="text-base font-semibold" style={{ color: INK }}>
          Generate New Voucher Codes
        </h3>
        <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
          Creates random, unguessable activation keys and stores them directly in the database.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold" style={{ color: MUTED }}>
              Type:
            </label>
            <select
              value={genType}
              onChange={(e) => setGenType(e.target.value as 'cbt' | 'pdf')}
              className="rounded-lg border bg-white px-3 py-2 text-sm font-medium focus:outline-none"
              style={{ borderColor: BORDER, color: INK }}
            >
              <option value="cbt">CBT Live Practice (CGC-...)</option>
              <option value="pdf">Past Questions PDF (CGP-...)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold" style={{ color: MUTED }}>
              Quantity:
            </label>
            <select
              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value))}
              className="rounded-lg border bg-white px-3 py-2 text-sm font-medium focus:outline-none"
              style={{ borderColor: BORDER, color: INK }}
            >
              <option value={5}>5 codes</option>
              <option value={10}>10 codes</option>
              <option value={20}>20 codes</option>
              <option value={50}>50 codes</option>
              <option value={100}>100 codes</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: PRIMARY }}
          >
            <PlusSignIcon size={16} />
            {generating ? 'Generating...' : `Generate ${genCount} ${genType.toUpperCase()} Codes`}
          </button>
        </div>

        {/* Display Recently Generated Batch with Quick Copy */}
        {generatedBatch.length > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Latest Generated Batch ({generatedBatch.length} codes)
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    generatedBatch.join('\n'),
                    `Copied all ${generatedBatch.length} generated codes`
                  )
                }
                className="inline-flex items-center gap-1.5 rounded border border-blue-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                <Copy01Icon size={14} />
                Copy Batch
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {generatedBatch.map((codeStr) => (
                <button
                  key={codeStr}
                  onClick={() => copyToClipboard(codeStr)}
                  className="rounded border border-blue-200 bg-white px-2 py-1 text-xs font-semibold transition-colors hover:border-blue-400"
                  style={{ fontFamily: MONO_FONT, color: INK }}
                  title="Click to copy single code"
                >
                  {codeStr}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Codes Table & Filters */}
      <div className="rounded-xl border bg-white" style={{ borderColor: BORDER }}>
        {/* Navigation Tabs and Batch Tools */}
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: BORDER }}>
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setTab('usable_all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === 'usable_all' ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={tab === 'usable_all' ? { backgroundColor: PRIMARY } : {}}
            >
              All Usable ({stats.usableCbt + stats.usablePdf})
            </button>
            <button
              onClick={() => setTab('usable_cbt')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === 'usable_cbt' ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={tab === 'usable_cbt' ? { backgroundColor: PRIMARY } : {}}
            >
              CBT Practice ({stats.usableCbt})
            </button>
            <button
              onClick={() => setTab('usable_pdf')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === 'usable_pdf' ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={tab === 'usable_pdf' ? { backgroundColor: PRIMARY } : {}}
            >
              PDF Past Questions ({stats.usablePdf})
            </button>
            <button
              onClick={() => setTab('used')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === 'used' ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={tab === 'used' ? { backgroundColor: INK } : {}}
            >
              Used / Dormant ({stats.usedCount})
            </button>
          </div>

          {/* Quick Batch Copy Buttons for Usable Codes */}
          {tab !== 'used' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: MUTED }}>
                Quick Copy:
              </span>
              <button
                onClick={() => copyBatch(5)}
                className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-gray-50"
                style={{ borderColor: BORDER, color: INK }}
                title="Copy 5 usable codes to clipboard"
              >
                <Copy01Icon size={13} />
                5 Codes
              </button>
              <button
                onClick={() => copyBatch(10)}
                className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-gray-50"
                style={{ borderColor: BORDER, color: INK }}
                title="Copy 10 usable codes to clipboard"
              >
                <Copy01Icon size={13} />
                10 Codes
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="border-b p-4" style={{ borderColor: BORDER }}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search01Icon size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code (e.g. CGP-JBW6) or claimed email..."
              className="w-full rounded-lg border bg-gray-50/50 py-2 pl-9 pr-4 text-sm focus:bg-white focus:outline-none"
              style={{ borderColor: BORDER, color: INK }}
            />
          </div>
        </div>

        {/* Codes Table List */}
        {loading ? (
          <div className="py-16 text-center text-sm" style={{ color: MUTED }}>
            Loading codes catalog...
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="py-16 text-center">
            <Key01Icon size={32} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm font-semibold" style={{ color: INK }}>
              No codes found
            </p>
            <p className="text-xs" style={{ color: MUTED }}>
              Try adjusting your search query or tab filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50/75 text-xs font-semibold" style={{ borderColor: BORDER, color: MUTED }}>
                  <th className="py-3 px-4">Code Key</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Claimed By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: BORDER }}>
                {filteredCodes.slice(0, 100).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code display */}
                    <td className="py-3 px-4">
                      <span
                        className="font-bold text-xs tracking-wide"
                        style={{ fontFamily: MONO_FONT, color: INK }}
                      >
                        {item.code}
                      </span>
                    </td>

                    {/* Type badge */}
                    <td className="py-3 px-4">
                      {item.type === 'cbt' ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          CBT Practice
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          PDF Past Questions
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4">
                      {!item.used ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          Usable / Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                          Claimed / Used
                        </span>
                      )}
                    </td>

                    {/* Claimed details */}
                    <td className="py-3 px-4 text-xs" style={{ color: MUTED }}>
                      {item.used ? (
                        <div>
                          <p className="font-medium text-gray-800">{item.used_by_email || 'Direct Redemption'}</p>
                          {item.used_at && (
                            <p className="text-[11px] text-gray-500">
                              {new Date(item.used_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not redeemed</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Copy button */}
                        <button
                          onClick={() => copyToClipboard(item.code, `Copied ${item.code}`)}
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
                            copiedCode === item.code
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                          style={copiedCode !== item.code ? { borderColor: BORDER, color: INK } : {}}
                          title="Copy this code"
                        >
                          {copiedCode === item.code ? (
                            <>
                              <CheckmarkCircle01Icon size={13} className="text-emerald-700" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy01Icon size={13} />
                              Copy
                            </>
                          )}
                        </button>

                        {/* Make Usable button for dormant codes */}
                        {item.used && (
                          <button
                            onClick={() => handleMakeUsable(item)}
                            disabled={revivingId === item.id}
                            className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-50"
                            title="Reset this code to usable so another student can use it"
                          >
                            {revivingId === item.id ? 'Reviving...' : 'Make Usable'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCodes.length > 100 && (
              <div className="p-3 text-center text-xs font-medium border-t" style={{ borderColor: BORDER, color: MUTED }}>
                Showing first 100 of {filteredCodes.length} codes. Use search to find specific items.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
