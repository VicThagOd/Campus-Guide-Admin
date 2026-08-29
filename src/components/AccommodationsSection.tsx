import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadMediaFile, deleteMediaFile } from '../lib/media'
import {
  CallIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Edit01Icon,
  Image02Icon,
  Location01Icon,
  PlusSignIcon,
  RefreshIcon,
  Upload02Icon,
  Video02Icon,
} from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'
const SECTION_BG = '#F7F8FA'

export interface AccommodationItem {
  id: string
  title: string
  description: string | null
  price: number | null
  location: string | null
  distance_from_school: string | null
  room_type: string | null
  amenities: string[] | null
  contact_info: string | null
  image_urls: string[]
  video_url: string | null
  created_at: string
}

export default function AccommodationsSection() {
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AccommodationItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [distanceFromSchool, setDistanceFromSchool] = useState('')
  const [roomType, setRoomType] = useState('')
  const [amenitiesInput, setAmenitiesInput] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const fetchAccommodations = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching accommodations:', error)
      setError(error.message)
    } else {
      setAccommodations(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAccommodations()
  }, [])

  const openCreateModal = () => {
    setEditingItem(null)
    setTitle('')
    setDescription('')
    setPrice('')
    setLocation('')
    setDistanceFromSchool('')
    setRoomType('')
    setAmenitiesInput('')
    setContactInfo('')
    setImageUrls([])
    setVideoUrl('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: AccommodationItem) => {
    setEditingItem(item)
    setTitle(item.title)
    setDescription(item.description || '')
    setPrice(item.price !== null ? String(item.price) : '')
    setLocation(item.location || '')
    setDistanceFromSchool(item.distance_from_school || '')
    setRoomType(item.room_type || '')
    setAmenitiesInput(item.amenities ? item.amenities.join(', ') : '')
    setContactInfo(item.contact_info || '')
    setImageUrls(item.image_urls || [])
    setVideoUrl(item.video_url || '')
    setIsModalOpen(true)
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum photo size is 10MB.`)
          continue
        }
        const url = await uploadMediaFile(file, 'accommodations')
        uploaded.push(url)
      }
      setImageUrls((prev) => [...prev, ...uploaded])
    } catch (err: any) {
      alert(`Photo upload failed: ${err.message || 'Please try again.'}`)
    } finally {
      setUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      if (!file.type.startsWith('video/')) {
        alert('Please choose a video file.')
        return
      }
      if (file.size > 100 * 1024 * 1024) {
        alert('Video is too large. Maximum size is 100MB.')
        return
      }
      const url = await uploadMediaFile(file, 'accommodations')
      setVideoUrl(url)
    } catch (err: any) {
      alert(`Video upload failed: ${err.message || 'Please try again.'}`)
    } finally {
      setUploading(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const handleRemoveImage = async (index: number) => {
    const removed = imageUrls[index]
    if (removed) await deleteMediaFile(removed)
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveVideo = async () => {
    if (videoUrl) await deleteMediaFile(videoUrl)
    setVideoUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)

    const amenitiesArray = amenitiesInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      price: price ? parseFloat(price) : null,
      location: location.trim() || null,
      distance_from_school: distanceFromSchool.trim() || null,
      room_type: roomType.trim() || null,
      amenities: amenitiesArray,
      contact_info: contactInfo.trim() || null,
      image_urls: imageUrls,
      video_url: videoUrl.trim() || null,
    }

    if (editingItem) {
      const { error } = await supabase
        .from('accommodations')
        .update(payload)
        .eq('id', editingItem.id)

      if (error) {
        alert(`Failed to update: ${error.message}`)
      } else {
        setIsModalOpen(false)
        fetchAccommodations()
      }
    } else {
      const { error } = await supabase
        .from('accommodations')
        .insert([payload])

      if (error) {
        alert(`Failed to create: ${error.message}`)
      } else {
        setIsModalOpen(false)
        fetchAccommodations()
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete accommodation "${itemTitle}"?`)) return

    const item = accommodations.find((a) => a.id === id)
    const { error } = await supabase
      .from('accommodations')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`Failed to delete: ${error.message}`)
    } else {
      if (item) {
        ;(item.image_urls || []).forEach((url) => deleteMediaFile(url))
        if (item.video_url) deleteMediaFile(item.video_url)
      }
      setAccommodations((prev) => prev.filter((a) => a.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
            Accommodations Management
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Listings, room details, prices, contact info, photo & video media.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAccommodations}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-medium transition-colors hover:bg-white"
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
            Add Accommodation
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
          Loading accommodations...
        </div>
      ) : accommodations.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
          <p style={{ color: MUTED }}>No accommodations listed yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accommodations.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between overflow-hidden rounded-xl border bg-white shadow-sm"
              style={{ borderColor: BORDER }}
            >
              <div>
                {/* Photo Thumbnail */}
                <div className="relative h-44 w-full" style={{ backgroundColor: '#ECEEF1' }}>
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <img
                      src={item.image_urls[0]}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" style={{ color: MUTED }}>
                      <Image02Icon size={32} />
                    </div>
                  )}
                  {item.price && (
                    <span className="absolute bottom-2 right-2 rounded-lg bg-slate-900/90 px-3 py-1 text-sm font-bold text-white shadow">
                      ₦{item.price.toLocaleString()}/yr
                    </span>
                  )}
                </div>

                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold" style={{ color: INK }}>
                      {item.title}
                    </h3>
                    {item.room_type && (
                      <span className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: '#EEF2FC', color: PRIMARY }}>
                        {item.room_type}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="line-clamp-2 text-sm" style={{ color: MUTED }}>
                      {item.description}
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs" style={{ color: MUTED }}>
                    {item.location && (
                      <div className="flex items-center gap-1.5">
                        <Location01Icon size={14} className="shrink-0" color={PRIMARY} />
                        <span>{item.location} {item.distance_from_school ? `(${item.distance_from_school})` : ''}</span>
                      </div>
                    )}
                    {item.contact_info && (
                      <div className="flex items-center gap-1.5">
                        <CallIcon size={14} className="shrink-0" color={PRIMARY} />
                        <span>{item.contact_info}</span>
                      </div>
                    )}
                  </div>

                  {item.amenities && item.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ backgroundColor: SECTION_BG, color: INK }}
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: BORDER }}>
                <span className="text-xs" style={{ color: MUTED }}>
                  {item.image_urls?.length || 0} photos {item.video_url ? '• 1 video' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="rounded-lg p-1.5 transition-colors hover:bg-slate-100"
                    style={{ color: PRIMARY }}
                    title="Edit Accommodation"
                  >
                    <Edit01Icon size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                    title="Delete Accommodation"
                  >
                    <Delete02Icon size={18} />
                  </button>
                </div>
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
                {editingItem ? 'Edit Accommodation' : 'Add Accommodation Listing'}
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
                  placeholder="e.g. Royal Palms Luxury Self-Contain"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Price (₦ / year)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="250000"
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Room Type
                  </label>
                  <input
                    type="text"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    placeholder="Self-Contain / 1 Bedroom / Shared"
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Distance from School
                  </label>
                  <input
                    type="text"
                    value={distanceFromSchool}
                    onChange={(e) => setDistanceFromSchool(e.target.value)}
                    placeholder="5 mins walk from Choba Gate"
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Location / Area
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Choba, Port Harcourt"
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                    Contact Info / Agent Phone
                  </label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="08012345678"
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
                  placeholder="Water supply, security features, light condition..."
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  value={amenitiesInput}
                  onChange={(e) => setAmenitiesInput(e.target.value)}
                  placeholder="Water, 24/7 Security, Prepaid Meter, Tiled Floor"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              {/* Photo Uploads */}
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Photos (upload from device)
                </label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                  style={{ borderColor: BORDER, color: MUTED }}
                >
                  {uploading ? (
                    <>
                      <RefreshIcon size={24} className="animate-spin" color={PRIMARY} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload02Icon size={24} color={PRIMARY} />
                      Click to upload photos (JPG, PNG, max 10MB each)
                    </>
                  )}
                </button>

                {imageUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {imageUrls.map((url, index) => (
                      <div key={url} className="group relative overflow-hidden rounded-lg border" style={{ borderColor: BORDER }}>
                        <img src={url} alt={`Uploaded photo ${index + 1}`} className="h-20 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-opacity hover:opacity-80"
                          title="Remove photo"
                        >
                          <Cancel01Icon size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Video (upload from device, optional)
                </label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                  style={{ borderColor: BORDER, color: MUTED }}
                >
                  {uploading ? (
                    <>
                      <RefreshIcon size={18} className="animate-spin" color={PRIMARY} />
                      Uploading...
                    </>
                  ) : videoUrl ? (
                    <>
                      <Video02Icon size={18} color={PRIMARY} />
                      Video attached (click to replace)
                    </>
                  ) : (
                    <>
                      <Video02Icon size={18} color={PRIMARY} />
                      Click to upload video (MP4, max 100MB)
                    </>
                  )}
                </button>
                {videoUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <video src={videoUrl} controls className="max-h-32 w-48 rounded-lg bg-black" />
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                    >
                      <Delete02Icon size={14} />
                      Remove video
                    </button>
                  </div>
                )}
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
                  {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Save Accommodation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}