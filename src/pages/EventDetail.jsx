import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatEventDateRange } from '../utils/date'
import { extractYouTubeId } from '../utils/youtube'
import LoadingSpinner from '../components/LoadingSpinner'

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

    return () => {
      cancelled = true
    }
  }, [eventId])

  if (loading) return <LoadingSpinner />
  if (error) return <p className="form-error">{error}</p>
  if (!event) return <p>Event not found.</p>

  const mapsQuery = event.location ? encodeURIComponent(`RV University, Bengaluru, ${event.location}`) : ''
  const youtubeId = extractYouTubeId(event.youtube_video_url)

  return (
    <div className="page event-detail">
      {event.image_url && (
        <div className="event-detail-hero">
          <img src={event.image_url} alt={event.title} />
        </div>
      )}

      <h1>{event.title}</h1>

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

      {event.detail_poster_url && (
        <div className="event-detail-poster">
          <img src={event.detail_poster_url} alt={`${event.title} poster`} />
        </div>
      )}

      {youtubeId && (
        <div className="event-detail-video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title={`${event.title} — video`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {event.description && <p className="event-detail-description">{event.description}</p>}
    </div>
  )
}
