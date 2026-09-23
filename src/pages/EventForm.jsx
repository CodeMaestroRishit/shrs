import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import EventCard from '../components/EventCard'
import ImageUpload from '../components/ImageUpload'
import LoadingSpinner from '../components/LoadingSpinner'
import { toDatetimeLocalValue } from '../utils/date'
import { extractYouTubeId } from '../utils/youtube'
import { isValidVenueLink, parseVenue, serializeVenue } from '../utils/venue'

const WORD_LIMIT = 200

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function WordCount({ text }) {
  const count = countWords(text)
  return (
    <span className={`form-word-count${count > WORD_LIMIT ? ' is-over-limit' : ''}`}>
      {count}/{WORD_LIMIT} words
    </span>
  )
}

const emptyForm = {
  club_id: '',
  title: '',
  description: '',
  venue_name: '',
  venue_link: '',
  start_time: '',
  end_time: '',
  image_url: '',
  detail_poster_url: '',
  youtube_url: '',
  registration_url: '',
  contact_phone: '',
  should_notify: true,
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
  const [invalidFields, setInvalidFields] = useState(new Set())

  useEffect(() => {
    if (adminClubIds.length === 0) return
    supabase
      .from('clubs')
      .select('id, name')
      .in('id', adminClubIds)
      .then(({ data }) => {
        setAdminClubs(data ?? [])
        if (!isEditing && data?.length === 1) setForm((current) => ({ ...current, club_id: data[0].id }))
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
          const venue = parseVenue(data.location)
          setForm({
            club_id: data.club_id,
            title: data.title,
            description: data.description ?? '',
            venue_name: venue.name,
            venue_link: venue.link,
            start_time: toDatetimeLocalValue(data.start_time),
            end_time: toDatetimeLocalValue(data.end_time),
            image_url: data.image_url ?? '',
            detail_poster_url: data.detail_poster_url ?? '',
            youtube_url: data.youtube_video_url ?? '',
            registration_url: data.registration_url ?? '',
            contact_phone: data.contact_phone ?? '',
            // Notifications only fire on INSERT, so editing can never re-notify.
            should_notify: false,
          })
        }
        setLoading(false)
      })
  }, [eventId, isEditing])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setInvalidFields((current) => {
      if (!current.has(field)) return current
      const next = new Set(current)
      next.delete(field)
      return next
    })
  }

  function fieldClass(field, base = '') {
    return invalidFields.has(field) ? `${base} is-invalid`.trim() : base
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const title = form.title.trim()
    const invalid = new Set()
    const errors = []

    if (!form.club_id) {
      invalid.add('club_id')
      errors.push('Select a club before publishing.')
    }
    if (!title) {
      invalid.add('title')
      errors.push('Add an event title before publishing.')
    } else if (countWords(title) > WORD_LIMIT) {
      invalid.add('title')
      errors.push(`Event title must be ${WORD_LIMIT} words or fewer.`)
    }
    if (countWords(form.description) > WORD_LIMIT) {
      invalid.add('description')
      errors.push(`Description must be ${WORD_LIMIT} words or fewer.`)
    }
    if (countWords(form.venue_name) > WORD_LIMIT) {
      invalid.add('venue_name')
      errors.push(`Venue name must be ${WORD_LIMIT} words or fewer.`)
    }
    if (countWords(form.contact_phone) > WORD_LIMIT) {
      invalid.add('contact_phone')
      errors.push(`Contact number must be ${WORD_LIMIT} words or fewer.`)
    }
    if (!form.start_time) {
      invalid.add('start_time')
      errors.push('Add a start date and time before publishing.')
    }
    if (form.end_time && form.start_time && new Date(form.end_time) < new Date(form.start_time)) {
      invalid.add('end_time')
      errors.push('The end time must be after the start time.')
    }
    if (form.venue_link && !isValidVenueLink(form.venue_link)) {
      invalid.add('venue_link')
      errors.push('Venue link must be a full http:// or https:// URL.')
    }
    if (form.youtube_url && !extractYouTubeId(form.youtube_url)) {
      invalid.add('youtube_url')
      errors.push('Enter a valid YouTube watch or short URL.')
    }
    if (form.registration_url && !isValidVenueLink(form.registration_url)) {
      invalid.add('registration_url')
      errors.push('Registration link must be a full http:// or https:// URL.')
    }

    if (errors.length > 0) {
      setInvalidFields(invalid)
      setError(errors[0])
      return
    }

    setInvalidFields(new Set())
    setSaving(true)
    setError(null)
    const payload = {
      club_id: form.club_id,
      title,
      description: form.description.trim() || null,
      // Kept in the existing field so no database migration is required.
      location: serializeVenue({ name: form.venue_name, link: form.venue_link }) || null,
      start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
      end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
      image_url: form.image_url || null,
      detail_poster_url: form.detail_poster_url || null,
      youtube_video_url: form.youtube_url || null,
      registration_url: form.registration_url.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      should_notify: form.should_notify,
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

  const selectedClub = adminClubs.find((club) => club.id === form.club_id)?.name
  return (
    <div className="page event-form-page">
      <div className="event-form-heading">
        <div>
          <p className="eyebrow">Event management</p>
          <h1>{isEditing ? 'Edit Event' : 'Create Event'}</h1>
        </div>
        <p>Fields marked <span aria-hidden="true">*</span> are required.</p>
      </div>

      <div className="event-form-layout">
        <form onSubmit={handleSubmit} className="event-form">
          <fieldset className="event-form-section">
            <legend>Event details</legend>
            {adminClubs.length > 1 && (
              <label className="form-field">
                Club <span aria-hidden="true">*</span>
                <select className={fieldClass('club_id')} value={form.club_id} onChange={(e) => update('club_id', e.target.value)} required>
                  <option value="">Select a club</option>
                  {adminClubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
                </select>
              </label>
            )}
            <label className="form-field">
              Event title <span aria-hidden="true">*</span>
              <input className={fieldClass('title')} type="text" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Design Sprint 2026" required />
              <WordCount text={form.title} />
            </label>
            <label className="form-field">
              Description
              <textarea className={fieldClass('description')} value={form.description} onChange={(e) => update('description', e.target.value)} rows={5} placeholder="Share what attendees can expect." />
              <WordCount text={form.description} />
            </label>
          </fieldset>

          <fieldset className="event-form-section">
            <legend>Date, time and venue</legend>
            <div className="form-logistics-stack">
              <div className="form-logistics-group">
                <p className="form-subheading">Date and time</p>
                <label className="form-field">
                  Starts <span aria-hidden="true">*</span>
                  <input className={fieldClass('start_time')} type="datetime-local" value={form.start_time} onChange={(e) => update('start_time', e.target.value)} required />
                </label>
                <label className="form-field">
                  Ends <span className="form-optional">Optional</span>
                  <input className={fieldClass('end_time')} type="datetime-local" value={form.end_time} onChange={(e) => update('end_time', e.target.value)} min={form.start_time || undefined} />
                </label>
              </div>
              <div className="form-logistics-group">
                <p className="form-subheading">Venue</p>
                <label className="form-field">
                  Venue name
                  <input className={fieldClass('venue_name')} type="text" value={form.venue_name} onChange={(e) => update('venue_name', e.target.value)} placeholder="e.g. Main Auditorium" />
                </label>
                <label className="form-field">
                  Venue link <span className="form-optional">Optional</span>
                  <input className={fieldClass('venue_link')} type="url" value={form.venue_link} onChange={(e) => update('venue_link', e.target.value)} placeholder="https://maps.google.com/..." />
                </label>
              </div>
            </div>
            <p className="form-hint">Add a Google Maps or venue URL so attendees can open the location directly.</p>
          </fieldset>

          <fieldset className="event-form-section">
            <legend>Registration &amp; contact</legend>
            <label className="form-field">
              Registration link <span className="form-optional">Optional</span>
              <input
                className={fieldClass('registration_url')}
                type="url"
                value={form.registration_url}
                onChange={(e) => update('registration_url', e.target.value)}
                placeholder="https://forms.gle/..."
              />
            </label>
            <p className="form-hint">
              A Google Form or sign-up link. When set, a "Register now" button appears at the top
              of the event page.
            </p>
            <label className="form-field">
              Contact number <span className="form-optional">Optional</span>
              <input
                className={fieldClass('contact_phone')}
                type="tel"
                value={form.contact_phone}
                onChange={(e) => update('contact_phone', e.target.value)}
                placeholder="+91 98765 43210"
              />
            </label>
            <p className="form-hint">
              Shown on the event page so attendees with questions have someone to reach out to.
            </p>
          </fieldset>

          <fieldset className="event-form-section">
            <legend>Event media</legend>
            <div className="media-field">
              <div><h2>Poster</h2><p className="form-hint">Used on event cards and listings.</p></div>
              {form.club_id ? <ImageUpload clubId={form.club_id} value={form.image_url} onChange={(url) => update('image_url', url)} label="poster" /> : <p className="form-hint">Select a club before adding media.</p>}
            </div>
            <div className="media-field">
              <div><h2>Long poster <span className="form-optional">Optional</span></h2><p className="form-hint">Shown only on the event page for detailed information.</p></div>
              {form.club_id ? <ImageUpload clubId={form.club_id} value={form.detail_poster_url} onChange={(url) => update('detail_poster_url', url)} label="long poster" /> : <p className="form-hint">Select a club before adding media.</p>}
            </div>
            <label className="form-field">
              YouTube video link <span className="form-optional">Optional</span>
              <input className={fieldClass('youtube_url')} type="url" placeholder="https://youtube.com/watch?v=..." value={form.youtube_url} onChange={(e) => update('youtube_url', e.target.value)} />
            </label>
            <p className="form-hint">A valid YouTube link is embedded on the event page.</p>
          </fieldset>

          {!isEditing && (
            <label className="notify-toggle">
              <input
                type="checkbox"
                checked={form.should_notify}
                onChange={(e) => update('should_notify', e.target.checked)}
              />
              <span>
                <strong>Notify students</strong>
                <span className="notify-toggle-hint">
                  Sends a push notification to everyone who turned notifications on. Uncheck for
                  test or draft events.
                </span>
              </span>
            </label>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="event-form-actions">
            <button type="button" className="button-ghost form-cancel" onClick={() => navigate('/admin')} disabled={saving}>Cancel</button>
            <button type="submit" className="button-primary" disabled={saving || !form.club_id}>{saving ? 'Saving...' : isEditing ? 'Save changes' : 'Publish event'}</button>
          </div>
        </form>

        <aside className="event-form-preview" aria-label="Event card preview">
          <p className="eyebrow">Live preview</p>
          <EventCard event={{ ...form, location: serializeVenue({ name: form.venue_name, link: form.venue_link }) }} clubName={selectedClub} />
          {form.detail_poster_url && <div className="event-form-preview-detail-poster"><h2>Long poster preview</h2><img src={form.detail_poster_url} alt="Long poster preview" /></div>}
        </aside>
      </div>
    </div>
  )
}
