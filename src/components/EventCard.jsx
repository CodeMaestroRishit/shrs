import { Link } from 'react-router-dom'
import { formatEventDateRange } from '../utils/date'

export default function EventCard({ event, clubName }) {
  return (
    <Link to={event.id ? `/events/${event.id}` : '#'} className="event-card">
      <div className="event-card-poster">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title || 'Event poster'} />
        ) : (
          <div className="event-card-poster-placeholder">No poster</div>
        )}
      </div>
      <div className="event-card-body">
        <p className="event-card-club">{clubName || 'Club'}</p>
        <h3 className="event-card-title">{event.title || 'Untitled event'}</h3>
        <p className="event-card-date">{formatEventDateRange(event.start_time, event.end_time)}</p>
      </div>
    </Link>
  )
}
