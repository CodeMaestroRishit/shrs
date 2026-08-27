import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import EventCard from '../components/EventCard'
import ImageUpload from '../components/ImageUpload'
import LoadingSpinner from '../components/LoadingSpinner'
import { toDatetimeLocalValue } from '../utils/date'
import { extractYouTubeId } from '../utils/youtube'

const emptyForm = {
  club_id: '',
  title: '',
  description: '',
  location: '',
  start_time: '',
  end_time: '',
  image_url: '',
  detail_poster_url: '',
  youtube_url: '',
}

export default function EventForm() {
  const { eventId } = useParams()
  const isEditing = Boolean(eventId)
  const navigate = useNavigate()
  const { adminClubIds } = useAuth()

  const [adminClubs, setAdminClubs] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (adminClubIds.length === 0) return
    supabase
      .from('clubs')
      .select('id, name')
      .in('id', adminClubIds)
      .then(({ data }) => {
        setAdminClubs(data ?? [])
        if (!isEditing && data?.length === 1) {
          setForm((f) => ({ ...f, club_id: data[0].id }))
        }
      })
  }, [adminClubIds, isEditing])

  useEffect(() => {
    if (!isEditing) return
    supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError(queryError.message)
        } else if (data) {
          setForm({
            club_id: data.club_id,
            title: data.title,
            description: data.description ?? '',
            location: data.location ?? '',
            start_time: toDatetimeLocalValue(data.start_time),
            end_time: toDatetimeLocalValue(data.end_time),
            image_url: data.image_url ?? '',
            detail_poster_url: data.detail_poster_url ?? '',
            youtube_url: data.youtube_video_url ?? '',
          })
        }
        setLoading(false)
      })
  }, [eventId, isEditing])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (form.youtube_url && !extractYouTubeId(form.youtube_url)) {
      setError("That doesn't look like a YouTube link — paste a youtube.com/watch or youtu.be URL.")
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      club_id: form.club_id,
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
      end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
      image_url: form.image_url || null,
      detail_poster_url: form.detail_poster_url || null,
      youtube_video_url: form.youtube_url || null,
    }

    const { error: saveError } = isEditing
      ? await supabase.from('events').update(payload).eq('id', eventId)
      : await supabase.from('events').insert(payload)

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    navigate('/admin')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="page event-form-page">
      <h1>{isEditing ? 'Edit Event' : 'Create Event'}</h1>

      <div className="event-form-layout">
        <form onSubmit={handleSubmit} className="event-form">
          {adminClubs.length > 1 && (
            <label>
              Club
              <select value={form.club_id} onChange={(e) => update('club_id', e.target.value)} required>
                <option value="">Select a club</option>
                {adminClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Title
            <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} required />
          </label>

          <label>
            Description
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={5} />
          </label>

          <label>
            Venue
            <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} />
          </label>

          <label>
            Start time
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => update('start_time', e.target.value)}
              required
            />
          </label>

          <label>
            End time
            <input type="datetime-local" value={form.end_time} onChange={(e) => update('end_time', e.target.value)} />
          </label>

          <label>
            Poster
            {form.club_id ? (
              <ImageUpload clubId={form.club_id} value={form.image_url} onChange={(url) => update('image_url', url)} />
            ) : (
              <p>Select a club first.</p>
            )}
          </label>
          <p className="form-hint">Shown as the thumbnail on cards and listings across the site.</p>

          <label>
            Detailed poster
            {form.club_id ? (
              <ImageUpload
                clubId={form.club_id}
                value={form.detail_poster_url}
                onChange={(url) => update('detail_poster_url', url)}
              />
            ) : (
              <p>Select a club first.</p>
            )}
          </label>
          <p className="form-hint">
            Optional. A bigger, more detailed poster shown only on this event's own page — not on
            cards or listings.
          </p>

          <label>
            YouTube video link
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=…"
              value={form.youtube_url}
              onChange={(e) => update('youtube_url', e.target.value)}
            />
          </label>
          <p className="form-hint">
            Optional. Shown as an embedded preview on the event page — hosted by YouTube, so it
            costs us no storage or bandwidth.
          </p>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="button-primary" disabled={saving || !form.club_id}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Publish event'}
          </button>
        </form>

        <div className="event-form-preview">
          <h2>Preview</h2>
          <EventCard
            event={form}
            clubName={adminClubs.find((c) => c.id === form.club_id)?.name}
          />
        </div>
      </div>
    </div>
  )
}
