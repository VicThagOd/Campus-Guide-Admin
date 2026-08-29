import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PlusSignIcon, Edit01Icon, Delete02Icon, Calendar03Icon, Tag01Icon, RefreshIcon, Cancel01Icon, CheckmarkCircle02Icon } from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'

export interface ImportantDateItem {
  id: string
  title: string
  category: string
  event_date: string
  note: string | null
  created_at: string
}

const CATEGORIES = ['jamb', 'post-utme', 'screening', 'admission', 'registration', 'other']

export default function ImportantDatesSection() {
  const [dates, setDates] = useState<ImportantDateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ImportantDateItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('other')
  const [eventDate, setEventDate] = useState('')
  const [note, setNote] = useState('')

  const fetchDates = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('important_dates')
      .select('*')
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Error fetching important dates:', error)
      setError(error.message)
    } else {
      setDates(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDates()
  }, [])

  const openCreateModal = () => {
    setEditingItem(null)
    setTitle('')
    setCategory('other')
    setEventDate(new Date().toISOString().slice(0, 10))
    setNote('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: ImportantDateItem) => {
    setEditingItem(item)
    setTitle(item.title)
    setCategory(item.category || 'other')
    setEventDate(item.event_date)
    setNote(item.note || '')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !eventDate) return

    setSubmitting(true)
    const payload = {
      title: title.trim(),
      category,
      event_date: eventDate,
      note: note.trim() || null,
    }

    if (editingItem) {
      const { error } = await supabase
        .from('important_dates')
        .update(payload)
        .eq('id', editingItem.id)

      if (error) {
        alert(`Failed to update: ${error.message}`)
      } else {
        setIsModalOpen(false)
        fetchDates()
      }
    } else {
      const { error } = await supabase
        .from('important_dates')
        .insert([payload])

      if (error) {
        alert(`Failed to create: ${error.message}`)
      } else {
        setIsModalOpen(false)
        fetchDates()
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete important date "${itemTitle}"?`)) return

    const { error } = await supabase
      .from('important_dates')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`Failed to delete: ${error.message}`)
    } else {
      setDates((prev) => prev.filter((d) => d.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
            Important Dates Management
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Key schedule deadlines, screening dates, and academic events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDates}
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
            Add Date
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
          Loading important dates...
        </div>
      ) : dates.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
          <p style={{ color: MUTED }}>No important dates added yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dates.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm"
              style={{ borderColor: BORDER }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: '#EEF2FC', color: PRIMARY }}
                  >
                    <Tag01Icon size={12} />
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 text-sm font-bold text-amber-700">
                    <Calendar03Icon size={14} />
                    {new Date(item.event_date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <h3 className="text-base font-bold" style={{ color: INK }}>
                  {item.title}
                </h3>
                {item.note && (
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                    {item.note}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3" style={{ borderColor: BORDER }}>
                <button
                  onClick={() => openEditModal(item)}
                  className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                  style={{ color: PRIMARY }}
                  title="Edit Date"
                >
                  <Edit01Icon size={18} />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  title="Delete Date"
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between border-b pb-4" style={{ borderColor: BORDER }}>
              <h3 className="text-lg font-bold" style={{ color: INK }}>
                {editingItem ? 'Edit Important Date' : 'Add Important Date'}
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
                  placeholder="e.g. Post-UTME Online Registration Deadline"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

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
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Note / Details
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Additional notes for students..."
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
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
                  {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
