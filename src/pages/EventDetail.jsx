import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatEventDateRange } from '../utils/date'
import { extractYouTubeId } from '../utils/youtube'
import { parseVenue } from '../utils/venue'
import LoadingSpinner from '../components/LoadingSpinner'

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

  useEffect(() => {
    let cancelled = false
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

        {event.registration_url && (
          <a href={event.registration_url} target="_blank" rel="noreferrer" className="button-primary event-detail-register">
            Register now <span aria-hidden="true">↗</span>
          </a>
        )}

        {event.description && <section className="event-detail-section"><h2>About this event</h2><p className="event-detail-description">{event.description}</p></section>}

        {event.detail_poster_url && <section className="event-detail-section"><h2>Event details</h2><div className="event-detail-poster"><img src={event.detail_poster_url} alt={`${event.title} detailed poster`} /></div></section>}

        {youtubeId && <section className="event-detail-section"><h2>Watch</h2><div className="event-detail-video"><iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}`} title={`${event.title} video`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></section>}

        {event.contact_phone && (
          <section className="event-detail-section event-detail-contact">
            <h2>Questions?</h2>
            <p>
              Reach out at{' '}
              <a href={`tel:${event.contact_phone.replace(/[^\d+]/g, '')}`}>{event.contact_phone}</a>
            </p>
          </section>
        )}
      </div>
    </article>
  )
}
