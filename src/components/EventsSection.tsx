import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PlusSignIcon, Edit01Icon, Delete02Icon, Calendar03Icon, Location01Icon, RefreshIcon, Cancel01Icon, CheckmarkCircle02Icon, Upload02Icon } from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'

function generateOrganizerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'EV-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function uploadBanner(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `events/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('campus-media').upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('campus-media').getPublicUrl(path)
  return data?.publicUrl ?? null
}

export interface EventItem {
  id: string
  title: string
  description: string | null
  event_date: string | null
  location: string | null
  organizer_name: string | null
  organizer_code: string | null
  banner_image_url: string | null
  is_paid: boolean
  ticket_price: number
  created_at: string
}

interface TicketTier {
  name: string
  price: string
  quantity: string
  perks: string
}

export default function EventsSection() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EventItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [organizerName, setOrganizerName] = useState('')
  const [organizerCode, setOrganizerCode] = useState('')
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [tiers, setTiers] = useState<TicketTier[]>([])

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching events:', error)
      setError(error.message)
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const openCreateModal = () => {
    setEditingItem(null)
    setTitle('')
    setDescription('')
    setEventDate(new Date().toISOString().slice(0, 16))
    setLocation('')
    setOrganizerName('')
    setOrganizerCode('')
    setBannerImageUrl('')
    setIsPaid(false)
    setTiers([{ name: 'Regular', price: '', quantity: '', perks: '' }])
    setIsModalOpen(true)
  }

  const openEditModal = async (item: EventItem) => {
    setEditingItem(item)
    setTitle(item.title)
    setDescription(item.description || '')
    setEventDate(item.event_date ? new Date(item.event_date).toISOString().slice(0, 16) : '')
    setLocation(item.location || '')
    setOrganizerName(item.organizer_name || '')
    setOrganizerCode(item.organizer_code || '')
    setBannerImageUrl(item.banner_image_url || '')
    setIsPaid(item.is_paid || false)
    const { data } = await supabase
      .from('event_tiers')
      .select('tier_name, tier_price, capacity, perks')
      .eq('event_id', item.id)
      .order('tier_price', { ascending: true })
    setTiers(data?.length
      ? data.map((tier) => ({ name: tier.tier_name, price: String(tier.tier_price), quantity: tier.capacity == null ? '' : String(tier.capacity), perks: tier.perks || '' }))
      : [{ name: 'Regular', price: '', quantity: '', perks: '' }])
    setIsModalOpen(true)
  }

  const saveTiers = async (eventId: string) => {
    const validTiers = tiers.filter((tier) => tier.name.trim() && tier.price !== '')
    const { error: deleteError } = await supabase.from('event_tiers').delete().eq('event_id', eventId)
    if (deleteError) throw deleteError
    if (!isPaid || validTiers.length === 0) return

    const { error: insertError } = await supabase.from('event_tiers').insert(validTiers.map((tier) => ({
      event_id: eventId,
      tier_name: tier.name.trim(),
      tier_price: Number(tier.price),
      capacity: tier.quantity === '' ? null : Number(tier.quantity),
      perks: tier.perks.trim() || null,
    })))
    if (insertError) throw insertError
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)

    const finalCode = isPaid && !organizerCode.trim() ? generateOrganizerCode() : organizerCode.trim() || null

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      event_date: eventDate ? new Date(eventDate).toISOString() : null,
      location: location.trim() || null,
      organizer_name: organizerName.trim() || null,
      organizer_code: finalCode,
      banner_image_url: bannerImageUrl.trim() || null,
      is_paid: isPaid,
    }

    if (editingItem) {
      const { error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', editingItem.id)

      if (error) {
        alert(`Failed to update: ${error.message}`)
      } else {
        try {
          await saveTiers(editingItem.id)
          setIsModalOpen(false)
          fetchEvents()
        } catch (tierError: any) {
          alert(`Event saved, but ticket tiers failed: ${tierError.message}`)
        }
      }
    } else {
      const { data, error } = await supabase
        .from('events')
        .insert([payload])
        .select('id')
        .single()

      if (error) {
        alert(`Failed to create: ${error.message}`)
      } else {
        try {
          await saveTiers(data.id)
          setIsModalOpen(false)
          fetchEvents()
        } catch (tierError: any) {
          alert(`Event created, but ticket tiers failed: ${tierError.message}`)
        }
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete event "${itemTitle}"?`)) return

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`Failed to delete: ${error.message}`)
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
            Events Management
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Campus orientation events, fresher meetups, and ticketed activities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvents}
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
            Add Event
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
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
          <p style={{ color: MUTED }}>No events scheduled yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm"
              style={{ borderColor: BORDER }}
            >
              <div className="space-y-3">
                {item.banner_image_url && (
                  <img src={item.banner_image_url} alt={`${item.title} banner`} className="h-36 w-full rounded-lg object-cover" />
                )}
                <h3 className="text-base font-bold" style={{ color: INK }}>
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                    {item.description}
                  </p>
                )}

                <div className="space-y-1.5 text-xs" style={{ color: MUTED }}>
                  {item.event_date && (
                    <div className="flex items-center gap-1.5 font-medium text-amber-700">
                      <Calendar03Icon size={14} className="shrink-0" />
                      <span>{new Date(item.event_date).toLocaleString()}</span>
                    </div>
                  )}
                  {item.location && (
                    <div className="flex items-center gap-1.5">
                      <Location01Icon size={14} className="shrink-0" style={{ color: PRIMARY }} />
                      <span>{item.location}</span>
                    </div>
                  )}
                  {item.organizer_name && <div>Organizer: {item.organizer_name}</div>}
                  {item.organizer_code && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold" style={{ color: PRIMARY }}>Access code: {item.organizer_code}</span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(item.organizer_code!)}
                        className="rounded border px-2 py-0.5 text-[11px] font-semibold transition-colors hover:bg-slate-50"
                        style={{ borderColor: BORDER, color: MUTED }}
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3" style={{ borderColor: BORDER }}>
                <button
                  onClick={() => openEditModal(item)}
                  className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                  style={{ color: PRIMARY }}
                  title="Edit Event"
                >
                  <Edit01Icon size={18} />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  title="Delete Event"
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
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between border-b pb-4" style={{ borderColor: BORDER }}>
              <h3 className="text-lg font-bold" style={{ color: INK }}>
                {editingItem ? 'Edit Event' : 'Add Event'}
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
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. UNIPORT Freshers Orientation Night"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Event Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Convocation Arena, Abuja Campus"
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event details, schedule, highlights..."
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>Organizer Name</label>
                  <input value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} placeholder="Organizer or team name" className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ borderColor: BORDER, color: INK }} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>Organizer Access Code</label>
                  {isPaid && !editingItem ? (
                    <div className="flex gap-2">
                      <input
                        value={organizerCode || (isPaid ? 'Auto-generated on save' : '')}
                        readOnly
                        placeholder="Auto-generated on save"
                        className="flex-1 rounded-lg border bg-slate-50 px-3.5 py-2.5 font-mono text-sm uppercase"
                        style={{ borderColor: BORDER, color: MUTED }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const code = generateOrganizerCode()
                          setOrganizerCode(code)
                        }}
                        className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50"
                        style={{ borderColor: BORDER, color: PRIMARY }}
                      >
                        Generate
                      </button>
                    </div>
                  ) : (
                    <input value={organizerCode} onChange={(e) => setOrganizerCode(e.target.value.toUpperCase())} placeholder="e.g. FRESHERS-2026" className="w-full rounded-lg border px-3.5 py-2.5 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ borderColor: BORDER, color: INK }} />
                  )}
                  {isPaid && organizerCode && (
                    <p className="mt-1 text-xs" style={{ color: MUTED }}>Share this code with the event organizer for their dashboard access.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>Event Banner Image</label>
                {bannerImageUrl ? (
                  <div className="relative">
                    <img src={bannerImageUrl} alt="Banner preview" className="h-32 w-full rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setBannerImageUrl('')}
                      className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-600 shadow-sm hover:bg-white"
                    >
                      <Cancel01Icon size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-[#2F4EA2] hover:bg-slate-50" style={{ borderColor: BORDER }}>
                    {uploadingBanner ? (
                      <RefreshIcon size={24} className="animate-spin" style={{ color: MUTED }} />
                    ) : (
                      <Upload02Icon size={24} style={{ color: MUTED }} />
                    )}
                    <span className="text-xs font-semibold" style={{ color: MUTED }}>
                      {uploadingBanner ? 'Uploading...' : 'Click to upload banner image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingBanner}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setUploadingBanner(true)
                        const url = await uploadBanner(file)
                        if (url) setBannerImageUrl(url)
                        else alert('Failed to upload image. Please try again.')
                        setUploadingBanner(false)
                        e.target.value = ''
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_paid"
                    checked={isPaid}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setIsPaid(checked)
                      if (checked && !organizerCode.trim() && !editingItem) {
                        setOrganizerCode(generateOrganizerCode())
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="is_paid" className="text-sm font-semibold" style={{ color: INK }}>
                    Paid Event (Ticket Required)
                  </label>
                </div>
              </div>

              {isPaid && (
                <div className="space-y-3 rounded-xl border bg-slate-50 p-4" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold" style={{ color: INK }}>Ticket Tiers</p>
                      <p className="text-xs" style={{ color: MUTED }}>Add Regular, VIP, table packages, or any custom tier with perks.</p>
                    </div>
                    <button type="button" onClick={() => setTiers((current) => [...current, { name: '', price: '', quantity: '', perks: '' }])} className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold" style={{ borderColor: BORDER, color: PRIMARY }}>Add Tier</button>
                  </div>
                  {tiers.map((tier, index) => (
                    <div key={index} className="space-y-2 rounded-lg border bg-white p-3" style={{ borderColor: BORDER }}>
                      <div className="grid grid-cols-[1fr_0.8fr_0.8fr_auto] gap-2">
                        <input value={tier.name} onChange={(e) => setTiers((current) => current.map((row, i) => i === index ? { ...row, name: e.target.value } : row))} placeholder="Tier name" className="min-w-0 rounded-lg border bg-slate-50 px-3 py-2 text-sm" style={{ borderColor: BORDER }} />
                        <input type="number" min="0" value={tier.price} onChange={(e) => setTiers((current) => current.map((row, i) => i === index ? { ...row, price: e.target.value } : row))} placeholder="Price" className="min-w-0 rounded-lg border bg-slate-50 px-3 py-2 text-sm" style={{ borderColor: BORDER }} />
                        <input type="number" min="0" value={tier.quantity} onChange={(e) => setTiers((current) => current.map((row, i) => i === index ? { ...row, quantity: e.target.value } : row))} placeholder="Qty" className="min-w-0 rounded-lg border bg-slate-50 px-3 py-2 text-sm" style={{ borderColor: BORDER }} />
                        <button type="button" onClick={() => setTiers((current) => current.filter((_, i) => i !== index))} className="rounded-lg px-2 text-red-600 hover:bg-red-50" aria-label="Remove tier"><Delete02Icon size={17} /></button>
                      </div>
                      <textarea
                        rows={2}
                        value={tier.perks}
                        onChange={(e) => setTiers((current) => current.map((row, i) => i === index ? { ...row, perks: e.target.value } : row))}
                        placeholder="Perks (e.g. Front row seating, free drink, priority entry)"
                        className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ borderColor: BORDER, color: INK }}
                      />
                    </div>
                  ))}
                </div>
              )}

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
                  {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
