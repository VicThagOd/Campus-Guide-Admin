import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PlusSignIcon, Edit01Icon, Delete02Icon, Calendar03Icon, Tag01Icon, UserGroupIcon, Link02Icon, RefreshIcon, Cancel01Icon, CheckmarkCircle02Icon } from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'

export interface UpdateItem {
  id: string
  title: string
  summary: string | null
  body: string | null
  category: string
  audience: string
  source: string | null
  deadline: string | null
  published_at: string
  created_at: string
}

const CATEGORIES = ['general', 'post-utme', 'admission', 'clearance']
const AUDIENCES = ['everyone', 'aspirants', 'freshers', 'students']

export default function UpdatesSection() {
  const [updates, setUpdates] = useState<UpdateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<UpdateItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('general')
  const [audience, setAudience] = useState('everyone')
  const [source, setSource] = useState('')
  const [deadline, setDeadline] = useState('')
  const [publishedAt, setPublishedAt] = useState('')

  const fetchUpdates = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('updates')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching updates:', error)
      setError(error.message)
    } else {
      setUpdates(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUpdates()
  }, [])

  const openCreateModal = () => {
    setEditingItem(null)
    setTitle('')
    setSummary('')
    setBody('')
    setCategory('general')
    setAudience('everyone')
    setSource('')
    setDeadline('')
    setPublishedAt(new Date().toISOString().slice(0, 16))
    setIsModalOpen(true)
  }

  const openEditModal = (item: UpdateItem) => {
    setEditingItem(item)
    setTitle(item.title)
    setSummary(item.summary || '')
    setBody(item.body || '')
    setCategory(item.category || 'general')
    setAudience(item.audience || 'everyone')
    setSource(item.source || '')
    setDeadline(item.deadline ? new Date(item.deadline).toISOString().slice(0, 16) : '')
    setPublishedAt(item.published_at ? new Date(item.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16))
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    const payload = {
      title: title.trim(),
      summary: summary.trim() || null,
      body: body.trim() || null,
      category,
      audience,
      source: source.trim() || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
    }

    if (editingItem) {
      const { error } = await supabase
        .from('updates')
        .update(payload)
        .eq('id', editingItem.id)

      if (error) {
        alert(`Failed to update: ${error.message}`)
      } else {
        setIsModalOpen(false)
        fetchUpdates()
      }
    } else {
      const { error } = await supabase
        .from('updates')
        .insert([payload])

      if (error) {
        alert(`Failed to create: ${error.message}`)
      } else {
        setIsModalOpen(false)
        fetchUpdates()
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete update "${itemTitle}"?`)) return

    const { error } = await supabase
      .from('updates')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`Failed to delete: ${error.message}`)
    } else {
      setUpdates((prev) => prev.filter((u) => u.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
            Updates Management
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Manage news, announcements, and key updates shown on the student portal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUpdates}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
            style={{ borderColor: BORDER, color: INK }}
          >
            <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            <PlusSignIcon size={18} />
            Create Update
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: MUTED }}>
          Loading updates...
        </div>
      ) : updates.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
          <p style={{ color: MUTED }}>No updates published yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {updates.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm sm:flex-row sm:items-start"
              style={{ borderColor: BORDER }}
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: '#EEF2FC', color: PRIMARY }}
                  >
                    <Tag01Icon size={12} />
                    {item.category}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize"
                    style={{ color: INK }}
                  >
                    <UserGroupIcon size={12} />
                    {item.audience}
                  </span>
                  <span className="text-xs" style={{ color: MUTED }}>
                    Published: {new Date(item.published_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold" style={{ color: INK }}>
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                    {item.summary}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-xs" style={{ color: MUTED }}>
                  {item.deadline && (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <Calendar03Icon size={13} />
                      Deadline: {new Date(item.deadline).toLocaleString()}
                    </span>
                  )}
                  {item.source && (
                    <span className="inline-flex items-center gap-1">
                      <Link02Icon size={13} />
                      Source: {item.source}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t pt-3 sm:mt-0 sm:border-t-0 sm:pt-0">
                <button
                  onClick={() => openEditModal(item)}
                  className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                  style={{ color: PRIMARY }}
                  title="Edit Update"
                >
                  <Edit01Icon size={18} />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  title="Delete Update"
                >
                  <Delete02Icon size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between border-b pb-4" style={{ borderColor: BORDER }}>
              <h3 className="text-lg font-bold" style={{ color: INK }}>
                {editingItem ? 'Edit Update' : 'Create New Update'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 transition-colors hover:bg-slate-100"
                style={{ color: MUTED }}
              >
                <Cancel01Icon size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 2026/2027 Post-UTME Screening Guidelines Released"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                    style={{ borderColor: BORDER, color: INK }}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                    style={{ borderColor: BORDER, color: INK }}
                  >
                    {AUDIENCES.map((aud) => (
                      <option key={aud} value={aud}>
                        {aud}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Summary
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief 1-2 sentence summary of this update"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Full Body Text
                </label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Detailed announcement text..."
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Source / Reference
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. UNIPORT Portal"
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4" style={{ borderColor: BORDER }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                  style={{ borderColor: BORDER, color: INK }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <CheckmarkCircle02Icon size={18} />
                  {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Publish Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
