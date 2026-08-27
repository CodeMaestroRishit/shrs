import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatEventDateRange, getEventStatus } from '../utils/date'
import { extractYouTubeId } from '../utils/youtube'
import { parseVenue } from '../utils/venue'
import LoadingSpinner from '../components/LoadingSpinner'
import EventRating from '../components/EventRating'
import EventStatusBadge from '../components/EventStatusBadge'

function ShareIcon() { return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="15.5" cy="4.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="4.5" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="15.5" cy="15.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m6.3 9 7.4-3.7M6.3 11l7.4 3.7" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg> }
function CalendarIcon() { return <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M2.5 7.5h15M6 2.5v3M14 2.5v3M6.5 12l2.2 2.2 4.8-4.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function wasAddedToCalendar(eventId) { try { return sessionStorage.getItem(`calendar-added:${eventId}`) === 'true' } catch { return false } }

function MapPinIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path d="M8 14.2s4.4-4.1 4.4-7.7A4.4 4.4 0 1 0 3.6 6.5C3.6 10.1 8 14.2 8 14.2Z" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round" />
      <circle cx="8" cy="6.35" r="1.45" fill="none" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  )
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
    supabase.from('events').select('*, clubs(id, name, logo_url)').eq('id', eventId).single().then(({ data, error: queryError }) => {
      if (cancelled) return
      if (queryError) setError(queryError.message); else setEvent(data)
      setLoading(false)
    })
    setLoading(true)
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
    return () => { cancelled = true }
  }, [eventId])

  if (loading) return <LoadingSpinner />
  if (error) return <p className="form-error" role="alert">{error}</p>
  if (!event) return <p>Event not found.</p>

  const venue = parseVenue(event.location)
  const mapsQuery = venue.name ? encodeURIComponent(`RV University, Bengaluru, ${venue.name}`) : ''
  const mapsUrl = venue.link || (mapsQuery ? `https://maps.google.com/?q=${mapsQuery}` : '')
  const youtubeId = extractYouTubeId(event.youtube_video_url)
  const isCompleted = getEventStatus(event) === 'completed'
  async function shareEvent() {
    const url = window.location.href; setShareMessage('')
    async function copyLink() { if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(url); const input = document.createElement('textarea'); input.value = url; input.setAttribute('readonly', ''); input.style.position = 'fixed'; input.style.opacity = '0'; document.body.appendChild(input); input.select(); const copied = document.execCommand('copy'); input.remove(); if (!copied) throw new Error('Clipboard unavailable') }
    try { if (navigator.share) { await navigator.share({ title: event.title, text: `Check out ${event.title} at RVU.`, url }); setShareMessage('Thanks for sharing this event.') } else { await copyLink(); setShareMessage('Event link copied.') } } catch (shareError) { if (shareError.name !== 'AbortError') { try { await copyLink(); setShareMessage('Event link copied.') } catch { setShareMessage('Unable to share this event link.') } } }
  }
  function escapeIcsValue(value = '') { return String(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n') }
  function downloadCalendarFile() {
    const toIcsDate = (value) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RVU Campus Events//EN', 'BEGIN:VEVENT', `UID:${event.id}@rvu-campus-events`, `DTSTAMP:${toIcsDate(new Date())}`, `DTSTART:${toIcsDate(event.start_time)}`, event.end_time ? `DTEND:${toIcsDate(event.end_time)}` : '', `SUMMARY:${escapeIcsValue(event.title)}`, event.location ? `LOCATION:${escapeIcsValue(event.location)}` : '', event.description ? `DESCRIPTION:${escapeIcsValue(event.description)}` : '', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean)
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'event'}.ics`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
    try { sessionStorage.setItem(`calendar-added:${eventId}`, 'true') } catch { /* optional browser storage */ }
    setCalendarAdded(true)
  }

  return <div className="page event-detail">
    {event.image_url && <div className="event-detail-hero"><img src={event.image_url} alt={event.title} /></div>}
    <div className="event-detail-heading"><div><EventStatusBadge event={event} /><h1>{event.title}</h1></div><div className="event-detail-actions"><button type="button" className="button-ghost event-action-share" onClick={shareEvent} aria-label="Share this event"><ShareIcon /><span>Share</span></button><button type="button" className={`button-primary event-action-calendar${calendarAdded ? ' is-added' : ''}`} onClick={downloadCalendarFile} disabled={calendarAdded} aria-label={calendarAdded ? 'Added to calendar' : 'Add event to calendar'}><CalendarIcon /><span>{calendarAdded ? '✓ Added to calendar' : 'Add to calendar'}</span></button></div></div>
    {shareMessage && <p className="event-share-message" role="status">{shareMessage}</p>}{calendarAdded && <p className="event-calendar-message" role="status">Calendar file downloaded. Open it to finish adding this event to your calendar.</p>}
    {event.clubs && <Link to={`/clubs/${event.clubs.id}`} className="event-detail-club">{event.clubs.logo_url && <img src={event.clubs.logo_url} alt={event.clubs.name} />}<span>{event.clubs.name}</span></Link>}
    <p className="event-detail-datetime">{formatEventDateRange(event.start_time, event.end_time)}</p>
    {event.location && <p className="event-detail-location">📍 {event.location} <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noreferrer">View on map</a></p>}
    {event.detail_poster_url && <div className="event-detail-poster"><img src={event.detail_poster_url} alt={`${event.title} poster`} /></div>}
    {youtubeId && <div className="event-detail-video"><iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}`} title={`${event.title} — video`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}
    {event.description && <p className="event-detail-description">{event.description}</p>}
    {isCompleted && <EventRating eventId={event.id} />}
  </div>
  return (
    <article className="page event-detail">
      {event.image_url && (
        <div className="event-detail-hero">
          <div
            className="event-detail-hero-atmosphere"
            style={{ backgroundImage: `url("${event.image_url}")` }}
            aria-hidden="true"
          />
          <div className="event-detail-hero-glow" aria-hidden="true" />
          <img src={event.image_url} alt={`${event.title} poster`} />
        </div>
      )}

      <div className={`event-detail-content${event.image_url ? ' has-hero' : ''}`}>
        <header className="event-detail-header">
          {event.clubs && (
            <Link to={`/clubs/${event.clubs.id}`} className="event-detail-club">
              {event.clubs.logo_url && <img src={event.clubs.logo_url} alt="" />}
              <span>{event.clubs.name}</span>
            </Link>
          )}
          <h1>{event.title}</h1>
        </header>

        <div className="event-detail-meta">
          <div><span className="event-detail-meta-label">When</span><p>{formatEventDateRange(event.start_time, event.end_time)}</p></div>
          {venue.name && <div><span className="event-detail-meta-label">Venue</span><p>{venue.name}</p>{mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="event-location-link"><MapPinIcon /> View on Maps <span aria-hidden="true">↗</span></a>}</div>}
        </div>

        {event.description && <section className="event-detail-section"><h2>About this event</h2><p className="event-detail-description">{event.description}</p></section>}

        {event.detail_poster_url && <section className="event-detail-section"><h2>Event details</h2><div className="event-detail-poster"><img src={event.detail_poster_url} alt={`${event.title} detailed poster`} /></div></section>}

        {youtubeId && <section className="event-detail-section"><h2>Watch</h2><div className="event-detail-video"><iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}`} title={`${event.title} video`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></section>}
      </div>
    </article>
  )
}
