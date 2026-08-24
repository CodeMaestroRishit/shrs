import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import EventCard from '../components/EventCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ClubProfile() {
  const { clubId } = useParams()
  const [club, setClub] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      const [{ data: clubData, error: clubError }, { data: eventData, error: eventsError }] = await Promise.all([
        supabase.from('clubs').select('*').eq('id', clubId).single(),
        supabase.from('events').select('*').eq('club_id', clubId).order('start_time', { ascending: false }),
      ])

      if (cancelled) return
      if (clubError) setError(clubError.message)
      else if (eventsError) setError(eventsError.message)
      else {
        setClub(clubData)
        setEvents(eventData ?? [])
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [clubId])

  if (loading) return <LoadingSpinner />
  if (error) return <p className="form-error">{error}</p>
  if (!club) return <p>Club not found.</p>

  const now = new Date()
  const upcoming = events.filter((e) => new Date(e.start_time) >= now).reverse()
  const past = events.filter((e) => new Date(e.start_time) < now)

  return (
    <div className="page club-profile">
      <div className="club-profile-header">
        {club.logo_url && <img src={club.logo_url} alt={club.name} />}
        <div>
          <h1>{club.name}</h1>
          {club.description && <p>{club.description}</p>}
        </div>
      </div>

      <h2>Upcoming Events</h2>
      {upcoming.length === 0 ? (
        <p>No upcoming events.</p>
      ) : (
        <div className="event-grid">
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} clubName={club.name} />
          ))}
        </div>
      )}

      <h2>Past Events</h2>
      {past.length === 0 ? (
        <p>No past events.</p>
      ) : (
        <div className="event-grid">
          {past.map((event) => (
            <EventCard key={event.id} event={event} clubName={club.name} />
          ))}
        </div>
      )}
    </div>
  )
}
