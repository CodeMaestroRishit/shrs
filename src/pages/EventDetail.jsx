import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
<<<<<<< Updated upstream
import { formatEventDateRange } from '../utils/date'
=======
import { formatEventDateRange, getEventStatus } from '../utils/date'
import { extractYouTubeId } from '../utils/youtube'
>>>>>>> Stashed changes
import LoadingSpinner from '../components/LoadingSpinner'
import EventRating from '../components/EventRating'
import EventStatusBadge from '../components/EventStatusBadge'

function ShareIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="15.5" cy="4.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="4.5" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="15.5" cy="15.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m6.3 9 7.4-3.7M6.3 11l7.4 3.7" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
}

function CalendarIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M2.5 7.5h15M6 2.5v3M14 2.5v3M6.5 12l2.2 2.2 4.8-4.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function wasAddedToCalendar(eventId) {
  try { return sessionStorage.getItem(`calendar-added:${eventId}`) === 'true' } catch { return false }
}

export default function EventDetail() {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareMessage, setShareMessage] = useState('')
  const [calendarAdded, setCalendarAdded] = useState(() => wasAddedToCalendar(eventId))

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null); setShareMessage(''); setCalendarAdded(wasAddedToCalendar(eventId))

    supabase
      .from('events')
      .select('*, clubs(id, name, logo_url)')
      .eq('id', eventId)
      .single()
      .then(({ data, error: queryError }) => {
        if (cancelled) return
        if (queryError) setError(queryError.message)
        else setEvent(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [eventId])

  if (loading) return <LoadingSpinner />
  if (error) return <p className="form-error">{error}</p>
  if (!event) return <p>Event not found.</p>

  const mapsQuery = event.location ? encodeURIComponent(event.location) : ''
<<<<<<< Updated upstream
=======
  const youtubeId = extractYouTubeId(event.youtube_video_url)
  const isCompleted = getEventStatus(event) === 'completed'

  async function shareEvent() {
    const url = window.location.href
    setShareMessage('')
    async function copyLink() {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        return
      }
      const input = document.createElement('textarea')
      input.value = url; input.setAttribute('readonly', '')
      input.style.position = 'fixed'; input.style.opacity = '0'
      document.body.appendChild(input); input.select()
      const copied = document.execCommand('copy')
      input.remove()
      if (!copied) throw new Error('Clipboard unavailable')
    }
    try {
      if (navigator.share) { await navigator.share({ title: event.title, url }); setShareMessage('Thanks for sharing this event.') }
      else {
        await copyLink()
        setShareMessage('Event link copied.')
      }
    } catch (shareError) {
      if (shareError.name !== 'AbortError') {
        try { await copyLink(); setShareMessage('Event link copied.') }
        catch { setShareMessage('Unable to share this event link.') }
      }
    }
  }

  function escapeIcsValue(value = '') {
    return String(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
  }

  function downloadCalendarFile() {
    const toIcsDate = (value) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RVU Campus Events//EN', 'BEGIN:VEVENT',
      `UID:${event.id}@rvu-campus-events`, `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(event.start_time)}`,
      event.end_time ? `DTEND:${toIcsDate(event.end_time)}` : '',
      `SUMMARY:${escapeIcsValue(event.title)}`,
      event.location ? `LOCATION:${escapeIcsValue(event.location)}` : '',
      event.description ? `DESCRIPTION:${escapeIcsValue(event.description)}` : '',
      'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean)
    const file = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url; link.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'event'}.ics`
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
    try { sessionStorage.setItem(`calendar-added:${eventId}`, 'true') } catch { /* session storage is optional */ }
    setCalendarAdded(true)
  }
>>>>>>> Stashed changes

  return (
    <div className="page event-detail">
      {event.image_url && (
        <div className="event-detail-hero">
          <img src={event.image_url} alt={event.title} />
        </div>
      )}

      <div className="event-detail-heading">
        <div><EventStatusBadge event={event} /><h1>{event.title}</h1></div>
        <div className="event-detail-actions">
          <button type="button" className="button-ghost event-action-share" onClick={shareEvent} aria-label="Share this event"><ShareIcon /><span>Share</span></button>
          <button type="button" className={`button-primary event-action-calendar${calendarAdded ? ' is-added' : ''}`} onClick={downloadCalendarFile} disabled={calendarAdded} aria-label={calendarAdded ? 'Added to calendar' : 'Add event to calendar'}><CalendarIcon /><span>{calendarAdded ? '✓ Added to calendar' : 'Add to calendar'}</span></button>
        </div>
      </div>
      {shareMessage && <p className="event-share-message" role="status">{shareMessage}</p>}
      {calendarAdded && <p className="event-calendar-message" role="status">Calendar file downloaded. Open it to finish adding this event to your calendar.</p>}

      {event.clubs && (
        <Link to={`/clubs/${event.clubs.id}`} className="event-detail-club">
          {event.clubs.logo_url && <img src={event.clubs.logo_url} alt={event.clubs.name} />}
          <span>{event.clubs.name}</span>
        </Link>
      )}

      <p className="event-detail-datetime">{formatEventDateRange(event.start_time, event.end_time)}</p>

      {event.location && (
        <p className="event-detail-location">
          📍 {event.location}{' '}
          <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noreferrer">
            View on map
          </a>
        </p>
      )}

      {event.description && <p className="event-detail-description">{event.description}</p>}

      {isCompleted && <EventRating eventId={event.id} />}
    </div>
  )
}
