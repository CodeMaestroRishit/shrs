import { Link } from 'react-router-dom'
import { formatEventDate, formatEventDateRange } from '../utils/date'
import { parseVenue } from '../utils/venue'
import BookmarkButton from './BookmarkButton'


function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect x="1.5" y="3" width="13" height="11.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <line x1="1.5" y1="6" x2="14.5" y2="6" stroke="currentColor" strokeWidth="1.3" />
      <line x1="4.5" y1="1.5" x2="4.5" y2="4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="11.5" y1="1.5" x2="11.5" y2="4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5V8l2.6 1.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M8 14.5S13 9.9 13 6.3A5 5 0 0 0 3 6.3C3 9.9 8 14.5 8 14.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.3" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export default function EventListItem({ event, clubName, posterVariant = 'a' }) {
  const venue = parseVenue(event.location)

  return (
    <article className="event-list-item">
      <div className={`event-list-thumb poster-variant-${posterVariant}`}>
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} />
        ) : (
          <span className="event-list-thumb-mark">{(clubName || 'CE').slice(0, 2).toUpperCase()}</span>
        )}
      </div>

      <div className="event-list-body">
        <div className="event-list-meta">
          <span>
            <CalendarIcon /> {formatEventDate(event.start_time)}
          </span>
          <span>
            <ClockIcon /> {formatEventDateRange(event.start_time, event.end_time).split('·').slice(1).join('·').trim()}
          </span>
          {venue.name && (
            <span>
              <PinIcon /> {venue.name}
            </span>
          )}
        </div>

        <h3 className="event-list-title">
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>

        {event.description && <p className="event-list-desc">{event.description}</p>}

        <div className="event-list-footer">
          <div className="event-list-footer-actions">
            <Link to={`/events/${event.id}`} className="event-list-readmore">
              Read more →
            </Link>
            {event.id && <BookmarkButton eventId={event.id} className="event-list-bookmark" />}
          </div>
          {clubName && <span className="event-list-tag">{clubName}</span>}
        </div>
      </div>
    </article>
  )
}

