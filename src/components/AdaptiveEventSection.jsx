import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import EventCard from './EventCard'
import HappeningBadge from './HappeningBadge'
import { formatEventDateRange } from '../utils/date'
import { parseVenue } from '../utils/venue'

export default function AdaptiveEventSection({ title, badge, events = [], emptyNote = null }) {
  const trackRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  function updateScrollButtons() {
    if (!trackRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5)
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    updateScrollButtons()
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    window.addEventListener('resize', updateScrollButtons)

    return () => {
      el.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [events])

  function scroll(direction) {
    if (!trackRef.current) return
    const offset = trackRef.current.clientWidth * 0.75
    const left = direction === 'left' ? -offset : offset
    trackRef.current.scrollBy({ left, behavior: 'smooth' })
  }

  // 0 Events case
  if (!events || events.length === 0) {
    if (!emptyNote) return null
    return (
      <section className="adaptive-event-section adaptive-section-empty-wrapper">
        <div className="adaptive-section-header">
          <div className="adaptive-title-group">
            {badge && <span className="adaptive-badge">{badge}</span>}
            <h2>{title}</h2>
          </div>
        </div>
        <div className="adaptive-empty-note">
          <p>{emptyNote}</p>
        </div>
      </section>
    )
  }

  const singleEvent = events.length === 1 ? events[0] : null
  const singleVenue = singleEvent ? parseVenue(singleEvent.location) : null

  return (
    <section className="adaptive-event-section" aria-label={title}>
      <div className="adaptive-section-header">
        <div className="adaptive-title-group">
          {badge && <span className="adaptive-badge">{badge}</span>}
          <h2>{title}</h2>
        </div>

        {events.length >= 3 && (
          <div className="adaptive-carousel-nav">
            <button
              type="button"
              className="carousel-nav-btn"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              ‹
            </button>
            <button
              type="button"
              className="carousel-nav-btn"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Case 1: Single Event Banner Layout */}
      {events.length === 1 && singleEvent && (
        <div className="single-event-banner">
          <div className="single-event-banner-poster">
            <HappeningBadge startTime={singleEvent.start_time} endTime={singleEvent.end_time} />
            {singleEvent.image_url ? (
              <img src={singleEvent.image_url} alt={singleEvent.title || 'Event poster'} />
            ) : (
              <div className="event-card-poster-placeholder">No poster</div>
            )}
          </div>
          <div className="single-event-banner-body">
            <span className="single-event-club">{singleEvent.clubs?.name || 'Club Event'}</span>
            <h3 className="single-event-title">{singleEvent.title}</h3>
            {singleEvent.description && (
              <p className="single-event-desc">{singleEvent.description}</p>
            )}
            <div className="single-event-meta">
              <div>
                <span className="single-event-meta-label">When</span>
                <p>{formatEventDateRange(singleEvent.start_time, singleEvent.end_time)}</p>
              </div>
              {singleVenue?.name && (
                <div>
                  <span className="single-event-meta-label">Venue</span>
                  <p>{singleVenue.name}</p>
                </div>
              )}
            </div>
            <Link to={`/events/${singleEvent.id}`} className="button-primary single-event-cta">
              View event details <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}

      {/* Case 2: 2 Events Balanced Grid Layout */}
      {events.length === 2 && (
        <div className="adaptive-grid-2">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} clubName={ev.clubs?.name} />
          ))}
        </div>
      )}

      {/* Case 3: 3+ Events Responsive Carousel Layout */}
      {events.length >= 3 && (
        <div className="adaptive-carousel-wrapper">
          <div className="adaptive-carousel-track" ref={trackRef}>
            {events.map((ev) => (
              <div key={ev.id} className="adaptive-carousel-item">
                <EventCard event={ev} clubName={ev.clubs?.name} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
