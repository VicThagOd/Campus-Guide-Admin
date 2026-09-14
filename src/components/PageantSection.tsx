import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import {
  Delete02Icon,
  RefreshIcon,
  Cancel01Icon,
  Search01Icon,
  Image01Icon,
} from "hugeicons-react"

const PRIMARY = "#2F4EA2"
const INK = "#111827"
const MUTED = "#6B7280"
const BORDER = "#BFC3C6"

export interface PageantContestant {
  id: string
  contestant_number: number
  category_number?: number
  contestant_code?: string
  name: string
  email: string
  phone_number: string
  matric_number: string | null
  gender: "male" | "female"
  category: "mr_campus_guide" | "miss_campus_guide" | "mrs_campus_guide"
  department: string
  level: string
  state_of_origin: string | null
  bio: string | null
  why_face_of_cg: string | null
  social_handles: {
    instagram?: string
    tiktok?: string
    twitter?: string
  }
  cover_photo_url: string
  seated_photo_url: string
  standing_photo_url: string
  payment_status: string
  is_approved: boolean
  votes_count: number
  created_at: string
}

export function formatContestantBadge(c: PageantContestant): string {
  const isFemale = c.gender === "female" || c.category === "miss_campus_guide" || c.category === "mrs_campus_guide"
  const prefix = isFemale ? "Contestant F" : "Contestant M"
  const num = c.category_number || c.contestant_number || 1
  return `${prefix}-${String(num).padStart(2, "0")}`
}

export default function PageantSection() {
  const [contestants, setContestants] = useState<PageantContestant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"female" | "male" | "leaderboard">("female")
  const [search, setSearch] = useState("")
  const [selectedContestant, setSelectedContestant] = useState<PageantContestant | null>(null)
  const [modalPhotoTab, setModalPhotoTab] = useState<"cover" | "seated" | "standing">("cover")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchContestants = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from("pageant_contestants")
        .select("*")
        .order("votes_count", { ascending: false })

      if (fetchErr) throw fetchErr
      setContestants((data as PageantContestant[]) || [])
    } catch (err: any) {
      setError(err?.message || "Failed to fetch pageant contestants.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContestants()
  }, [])

  const handleDeleteContestant = async (contestant: PageantContestant) => {
    const badge = formatContestantBadge(contestant)
    const confirmed = window.confirm(
      `Are you sure you want to delete ${badge} (${contestant.name})?\n\nThis will permanently delete their profile and all associated votes.`
    )
    if (!confirmed) return

    setDeletingId(contestant.id)
    try {
      const { error: delErr } = await supabase
        .from("pageant_contestants")
        .delete()
        .eq("id", contestant.id)

      if (delErr) throw delErr

      setContestants((prev) => prev.filter((c) => c.id !== contestant.id))
      if (selectedContestant?.id === contestant.id) {
        setSelectedContestant(null)
      }
      alert(`Contestant ${badge} (${contestant.name}) has been successfully deleted.`)
    } catch (err: any) {
      alert("Error deleting contestant: " + (err?.message || "Unknown error"))
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleApproval = async (contestant: PageantContestant) => {
    const newStatus = !contestant.is_approved
    try {
      const { error: updErr } = await supabase
        .from("pageant_contestants")
        .update({ is_approved: newStatus })
        .eq("id", contestant.id)

      if (updErr) throw updErr

      setContestants((prev) =>
        prev.map((c) => (c.id === contestant.id ? { ...c, is_approved: newStatus } : c))
      )
    } catch (err: any) {
      alert("Error updating status: " + err?.message)
    }
  }

  // Calculations
  const femaleContestants = contestants.filter((c) => c.gender === "female" || c.category === "miss_campus_guide" || c.category === "mrs_campus_guide")
  const maleContestants = contestants.filter((c) => c.gender === "male" || c.category === "mr_campus_guide")
  const totalVotesCast = contestants.reduce((sum, c) => sum + (c.votes_count || 0), 0)
  const totalRevenue = contestants.length * 1000

  // Filtered
  const listToRender = (
    activeTab === "female"
      ? femaleContestants
      : activeTab === "male"
      ? maleContestants
      : contestants
  ).filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contestant_code || "").toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      c.phone_number.includes(q) ||
      (c.matric_number || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>
            Mr & Miss Campus Guide Pageantry
          </h1>
          <p className="mt-1 text-sm" style={{ color: MUTED }}>
            View live votes, inspect contestant portfolios, toggle approval, and delete registrations.
          </p>
        </div>

        <button
          onClick={fetchContestants}
          disabled={loading}
          className="flex items-center gap-1.5 self-start rounded-lg border px-4 py-2 text-sm font-semibold transition-colors duration-150 hover:bg-white sm:self-auto"
          style={{ borderColor: BORDER, color: PRIMARY }}
        >
          <RefreshIcon size={16} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5" style={{ borderColor: BORDER }}>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Miss Campus Guide (Female)</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{femaleContestants.length}</p>
          <p className="mt-1 text-xs" style={{ color: MUTED }}>Contestants (F-01, F-02...)</p>
        </div>

        <div className="rounded-xl border bg-white p-5" style={{ borderColor: BORDER }}>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Mr Campus Guide (Male)</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{maleContestants.length}</p>
          <p className="mt-1 text-xs" style={{ color: MUTED }}>Contestants (M-01, M-02...)</p>
        </div>

        <div className="rounded-xl border bg-white p-5" style={{ borderColor: BORDER }}>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Total Votes Cast</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{totalVotesCast.toLocaleString()}</p>
          <p className="mt-1 text-xs" style={{ color: MUTED }}>Across all student voters</p>
        </div>

        <div className="rounded-xl border bg-white p-5" style={{ borderColor: BORDER }}>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">₦{totalRevenue.toLocaleString()}</p>
          <p className="mt-1 text-xs" style={{ color: MUTED }}>@ ₦1,000 / entry</p>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border bg-white p-1" style={{ borderColor: BORDER }}>
          <button
            onClick={() => setActiveTab("female")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "female"
                ? "bg-[#2F4EA2] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Miss Campus Guide ({femaleContestants.length})
          </button>

          <button
            onClick={() => setActiveTab("male")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "male"
                ? "bg-[#2F4EA2] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Mr Campus Guide ({maleContestants.length})
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "leaderboard"
                ? "bg-[#2F4EA2] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overall Leaderboard ({contestants.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search01Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, code, dept, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#2F4EA2]"
            style={{ borderColor: BORDER }}
          />
        </div>
      </div>

      {/* Contestant Table */}
      {loading ? (
        <div className="rounded-xl border bg-white p-12 text-center text-sm" style={{ borderColor: BORDER, color: MUTED }}>
          Loading contestants...
        </div>
      ) : listToRender.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center text-sm" style={{ borderColor: BORDER, color: MUTED }}>
          No contestants found matching your filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white" style={{ borderColor: BORDER }}>
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-gray-50 text-gray-600" style={{ borderColor: "#E5E7EB" }}>
              <tr>
                <th className="px-4 py-3 font-semibold">Contestant</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Dept & Level</th>
                <th className="px-4 py-3 font-semibold">Phone & Email</th>
                <th className="px-4 py-3 text-center font-semibold">Live Votes</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listToRender.map((c) => {
                const badge = formatContestantBadge(c)
                const isFemale = c.gender === "female" || c.category === "mrs_campus_guide"

                return (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Photo & Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.cover_photo_url}
                          alt={c.name}
                          className="h-10 w-10 rounded-lg object-cover border"
                          style={{ borderColor: BORDER }}
                        />
                        <div>
                          <div className="font-bold text-gray-900">{c.name}</div>
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              isFemale ? "bg-pink-100 text-pink-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {badge}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* DB Code */}
                    <td className="px-4 py-3 font-mono font-bold text-gray-700">
                      {c.contestant_code || "—"}
                    </td>

                    {/* Dept */}
                    <td className="px-4 py-3 text-gray-600">
                      <div className="font-medium text-gray-900">{c.department}</div>
                      <div className="text-[11px] text-gray-500">{c.level} • {c.state_of_origin || "N/A"}</div>
                    </td>

                    {/* Phone & Email */}
                    <td className="px-4 py-3 text-gray-600">
                      <div className="font-mono text-gray-900">{c.phone_number}</div>
                      <div className="text-[11px] text-gray-500">{c.email}</div>
                    </td>

                    {/* Votes Count */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                        {c.votes_count || 0} votes
                      </span>
                    </td>

                    {/* Approval Toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleApproval(c)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          c.is_approved
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {c.is_approved ? "Active" : "Hidden"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedContestant(c)
                            setModalPhotoTab("cover")
                          }}
                          className="rounded-lg border p-1.5 text-gray-700 hover:bg-gray-100"
                          style={{ borderColor: BORDER }}
                          title="View 3 Photos & Profile"
                        >
                          <Image01Icon size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteContestant(c)}
                          disabled={deletingId === c.id}
                          className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:opacity-50"
                          title="Delete Contestant"
                        >
                          <Delete02Icon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3 Photos & Bio Details Modal */}
      {selectedContestant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-900">
                  {formatContestantBadge(selectedContestant)}
                </span>
                <span className="font-mono text-xs text-gray-500">{selectedContestant.contestant_code}</span>
                <h3 className="text-base font-bold text-gray-900">{selectedContestant.name}</h3>
              </div>
              <button
                onClick={() => setSelectedContestant(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <Cancel01Icon size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {/* Photo Selector */}
              <div>
                <div className="mb-3 flex justify-center gap-2">
                  <button
                    onClick={() => setModalPhotoTab("cover")}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                      modalPhotoTab === "cover" ? "bg-[#2F4EA2] text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Cover Photo (Public)
                  </button>
                  <button
                    onClick={() => setModalPhotoTab("seated")}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                      modalPhotoTab === "seated" ? "bg-[#2F4EA2] text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Seated Photo
                  </button>
                  <button
                    onClick={() => setModalPhotoTab("standing")}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                      modalPhotoTab === "standing" ? "bg-[#2F4EA2] text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Standing Photo
                  </button>
                </div>

                <div className="flex h-80 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-950">
                  <img
                    src={
                      modalPhotoTab === "cover"
                        ? selectedContestant.cover_photo_url
                        : modalPhotoTab === "seated"
                        ? selectedContestant.seated_photo_url
                        : selectedContestant.standing_photo_url
                    }
                    alt={selectedContestant.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              {/* Bio & Details Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-xs">
                <div><strong>Phone:</strong> {selectedContestant.phone_number}</div>
                <div><strong>Email:</strong> {selectedContestant.email}</div>
                <div><strong>Department:</strong> {selectedContestant.department}</div>
                <div><strong>Level:</strong> {selectedContestant.level}</div>
                <div><strong>Matric:</strong> {selectedContestant.matric_number || "None"}</div>
                <div><strong>State of Origin:</strong> {selectedContestant.state_of_origin || "None"}</div>
                <div><strong>Live Votes:</strong> {selectedContestant.votes_count || 0} votes</div>
                <div><strong>Payment:</strong> <span className="font-bold uppercase text-emerald-600">{selectedContestant.payment_status}</span></div>
              </div>

              {selectedContestant.bio && (
                <div className="rounded-xl border bg-blue-50/50 p-3 text-xs" style={{ borderColor: "#D1D9F0" }}>
                  <p className="font-bold text-[#2F4EA2] mb-1">Contestant Bio</p>
                  <p className="text-gray-700">{selectedContestant.bio}</p>
                </div>
              )}

              {selectedContestant.why_face_of_cg && (
                <div className="rounded-xl border bg-amber-50/50 p-3 text-xs" style={{ borderColor: "#FDE68A" }}>
                  <p className="font-bold text-amber-900 mb-1">Why I should be the Face of Campus Guide:</p>
                  <p className="text-gray-800">{selectedContestant.why_face_of_cg}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
              <button
                onClick={() => handleDeleteContestant(selectedContestant)}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
              >
                <Delete02Icon size={14} /> Delete Contestant
              </button>

              <button
                onClick={() => setSelectedContestant(null)}
                className="rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                style={{ borderColor: BORDER }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
