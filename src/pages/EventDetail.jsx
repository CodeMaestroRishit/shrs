import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatEventDateRange } from '../utils/date'
function extractYouTubeId(url) {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

function parseVenue(location) {
  if (!location) return { name: '', link: '' }
  if (typeof location === 'string') return { name: location, link: '' }
  return { name: location.name || '', link: location.link || '' }
}

import LoadingSpinner from '../components/LoadingSpinner'
import BookmarkButton from '../components/BookmarkButton'
import EventCountdown from '../components/EventCountdown'
import RelatedEventsCarousel from '../components/RelatedEventsCarousel'
import ShareButton from '../components/ShareButton'
import AddToCalendarButton from '../components/AddToCalendarButton'



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
  const [relatedEvents, setRelatedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function loadEventAndRelated() {
      const { data, error: queryError } = await supabase
        .from('events')
        .select('*, clubs(id, name, logo_url)')
        .eq('id', eventId)
        .single()

      if (cancelled) return

      if (queryError) {
        setError(queryError.message)
        setLoading(false)
        return
      }

      setEvent(data)

      // Fetch potential related events
      const { data: candidates } = await supabase
        .from('events')
        .select('*, clubs(id, name)')
        .neq('id', eventId)

      if (cancelled || !candidates) {
        setLoading(false)
        return
      }

      const now = Date.now()
      const currentStart = data.start_time ? new Date(data.start_time).getTime() : now

      // Rank candidate events client-side
      const scored = candidates.map((cand) => {
        let score = 0
        // 1. Same club match
        if (cand.club_id && cand.club_id === data.club_id) {
          score += 50
        }
        // 2. Upcoming events over completed
        const candStart = cand.start_time ? new Date(cand.start_time).getTime() : 0
        if (candStart >= now) {
          score += 30
        }
        // 3. Proximity in date/time
        const diffDays = Math.abs(candStart - currentStart) / (1000 * 60 * 60 * 24)
        score += Math.max(0, 20 - diffDays)

        return { cand, score }
      })

      scored.sort((a, b) => b.score - a.score)
      setRelatedEvents(scored.slice(0, 6).map((s) => s.cand))
      setLoading(false)
    }

    loadEventAndRelated()

    return () => {
      cancelled = true
    }
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
          <div className="event-detail-title-row">
            <h1>{event.title}</h1>
            <BookmarkButton eventId={event.id} showLabel className="event-detail-bookmark-btn" />
          </div>
        </header>

        <div className="event-detail-meta">
          <div><span className="event-detail-meta-label">When</span><p>{formatEventDateRange(event.start_time, event.end_time)}</p></div>
          {venue.name && <div><span className="event-detail-meta-label">Venue</span><p>{venue.name}</p>{mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="event-location-link"><MapPinIcon /> View on Maps <span aria-hidden="true">↗</span></a>}</div>}
          <div>
            <span className="event-detail-meta-label">Status</span>
            <EventCountdown startTime={event.start_time} endTime={event.end_time} />
          </div>
        </div>

        {/* Interactive Actions Row */}
        <div className="event-detail-actions-row">
          {event.registration_url && (
            <a href={event.registration_url} target="_blank" rel="noreferrer" className="button-primary event-detail-register">
              Register now <span aria-hidden="true">↗</span>
            </a>
          )}
          <AddToCalendarButton event={event} />
          <ShareButton title={event.title} />
        </div>

        {event.description && <section className="event-detail-section"><h2>About this event</h2><p className="event-detail-description">{event.description}</p></section>}


        {event.detail_poster_url && <section className="event-detail-section"><h2>Event details</h2><div className="event-detail-poster"><img src={event.detail_poster_url} alt={`${event.title} detailed poster`} /></div></section>}

        {youtubeId && <section className="event-detail-section"><h2>Watch</h2><div className="event-detail-video"><iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}`} title={`${event.title} video`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></section>}

        {/* Amazon-Style Horizontal Related Events Carousel */}
        <RelatedEventsCarousel events={relatedEvents} />
      </div>
    </article>
  )
}



