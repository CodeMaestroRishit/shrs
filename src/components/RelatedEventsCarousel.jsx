import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatEventDateRange } from '../utils/date'
import HappeningBadge from './HappeningBadge'

export default function RelatedEventsCarousel({ events = [] }) {
  const trackRef = useRef(null)

  if (!events || events.length === 0) return null

  function scroll(direction) {
    if (!trackRef.current) return
    const scrollAmount = 300
    trackRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <section className="event-detail-section related-events-section">
      <div className="related-events-header">
        <h2>You might also like</h2>
        {events.length > 2 && (
          <div className="related-events-nav-btns">
            <button
              type="button"
              className="related-nav-btn"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              title="Previous recommendations"
            >
              ‹
            </button>
            <button
              type="button"
              className="related-nav-btn"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              title="Next recommendations"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="related-events-carousel-track" ref={trackRef}>
        {events.map((item) => (
          <Link to={`/events/${item.id}`} key={item.id} className="related-amazon-card">
            <div className="related-amazon-image-box">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title || 'Event poster'} />
              ) : (
                <div className="related-amazon-placeholder">
                  <span>{(item.clubs?.name || 'CE').slice(0, 2).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="related-amazon-body">
              <div className="related-amazon-badge-row">
                <HappeningBadge startTime={item.start_time} endTime={item.end_time} />
              </div>
              <span className="related-amazon-club">{item.clubs?.name || 'Club Event'}</span>
              <h4 className="related-amazon-title">{item.title}</h4>
              <p className="related-amazon-date">
                {formatEventDateRange(item.start_time, item.end_time)}
              </p>
              <span className="related-amazon-btn">
                View Event <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>

        ))}
      </div>
    </section>
  )
}
