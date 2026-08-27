import { Link } from 'react-router-dom'
import { formatEventDateRange } from '../utils/date'
import { parseVenue } from '../utils/venue'

export default function EventCard({ event, clubName }) {
  const venue = parseVenue(event.location)

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
        <div className="event-card-meta">
          <div>
            <span className="event-card-meta-label">When</span>
            <p>{formatEventDateRange(event.start_time, event.end_time)}</p>
          </div>
          {venue.name && (
            <div>
              <span className="event-card-meta-label">Venue</span>
              <p>{venue.name}</p>
            </div>
          )}
        </div>
        {event.id && <span className="event-card-more">View event <span aria-hidden="true">→</span></span>}
      </div>
    </Link>
  )
}
