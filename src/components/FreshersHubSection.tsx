import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PlusSignIcon, Edit01Icon, Delete02Icon, CheckmarkCircle02Icon, RefreshIcon, Cancel01Icon } from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'

export interface FresherStageItem {
  id: string
  title: string
  description: string | null
  steps: string[]
  icon: string | null
  stage_order: number
  created_at: string
}

export default function FreshersHubSection() {
  const [stages, setStages] = useState<FresherStageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FresherStageItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stepsInput, setStepsInput] = useState('')
  const [icon, setIcon] = useState('checkmark')
  const [stageOrder, setStageOrder] = useState<number>(1)

  const fetchStages = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('fresher_stages')
      .select('*')
      .order('stage_order', { ascending: true })

    if (error) {
      console.error('Error fetching fresher stages:', error)
      setError(error.message)
    } else {
      setStages(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStages()
  }, [])

  const openCreateModal = () => {
    setEditingItem(null)
    setTitle('')
    setDescription('')
    setStepsInput('')
    setIcon('checkmark')
    setStageOrder(stages.length + 1)
    setIsModalOpen(true)
  }

  const openEditModal = (item: FresherStageItem) => {
    setEditingItem(item)
    setTitle(item.title)
    setDescription(item.description || '')
    setStepsInput(item.steps ? item.steps.join('\n') : '')
    setIcon(item.icon || 'checkmark')
    setStageOrder(item.stage_order || 1)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)

    const stepsArray = stepsInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      steps: stepsArray,
      icon: icon.trim() || 'checkmark',
      stage_order: stageOrder,
    }

    if (editingItem) {
      const { error } = await supabase
        .from('fresher_stages')
        .update(payload)
        .eq('id', editingItem.id)

      if (error) {
        alert(`Failed to update: ${error.message}`)
      } else {
        setIsModalOpen(false)
        fetchStages()
      }
    } else {
      const { error } = await supabase
        .from('fresher_stages')
        .insert([payload])

      if (error) {
        alert(`Failed to create: ${error.message}`)
      } else {
        setIsModalOpen(false)
        fetchStages()
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete stage "${itemTitle}"?`)) return

    const { error } = await supabase
      .from('fresher_stages')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`Failed to delete: ${error.message}`)
    } else {
      setStages((prev) => prev.filter((s) => s.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
            Freshers Hub Stages
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Configure step-by-step guidance for newly admitted UNIPORT students.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStages}
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
            Add Stage
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
          Loading freshers hub stages...
        </div>
      ) : stages.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
          <p style={{ color: MUTED }}>No stages created yet in database.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stages.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border bg-white p-6 shadow-sm"
              style={{ borderColor: BORDER }}
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-sky-900"
                    style={{ backgroundColor: '#EEF2FC' }}
                  >
                    #{item.stage_order}
                  </span>
                  <span className="text-xs uppercase font-medium text-slate-400">
                    Icon: {item.icon || 'default'}
                  </span>
                </div>

                <h3 className="text-base font-bold" style={{ color: INK }}>
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: MUTED }}>
                    {item.description}
                  </p>
                )}

                {item.steps && item.steps.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t pt-4 text-xs" style={{ borderColor: BORDER }}>
                    {item.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-800">
                        <CheckmarkCircle02Icon size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t pt-3" style={{ borderColor: BORDER }}>
                <button
                  onClick={() => openEditModal(item)}
                  className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                  style={{ color: PRIMARY }}
                  title="Edit Stage"
                >
                  <Edit01Icon size={18} />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  title="Delete Stage"
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
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between border-b pb-4" style={{ borderColor: BORDER }}>
              <h3 className="text-lg font-bold" style={{ color: INK }}>
                {editingItem ? 'Edit Stage' : 'Add Fresher Stage'}
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
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Stage Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Acceptance Fee & Clearance"
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Order
                  </label>
                  <input
                    type="number"
                    value={stageOrder}
                    onChange={(e) => setStageOrder(parseInt(e.target.value) || 1)}
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of what freshers do in this stage"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Checklist Steps (One per line)
                </label>
                <textarea
                  rows={5}
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  placeholder="CheckmarkCircle02Icon JAMB CAPS and accept offer&#10;Print admission letter&#10;Pay acceptance fee..."
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Icon Identifier
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g. checkmark, document, money, house, shield"
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
                  {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Save Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
