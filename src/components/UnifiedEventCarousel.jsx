import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatEventDateRange, sortEventsUnified } from '../utils/date'
import HappeningBadge from './HappeningBadge'
import BookmarkButton from './BookmarkButton'

function parseVenue(location) {
  if (!location) return { name: '', link: '' }
  if (typeof location === 'string') return { name: location, link: '' }
  return { name: location.name || '', link: location.link || '' }
}



export default function UnifiedEventCarousel({
  title = 'Featured & Upcoming Events',
  badge = '★ Campus Showcase',
  events = [],
  emptyNote = 'No events happening soon.',
}) {
  const sortedEvents = sortEventsUnified(events)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef(null)
  const touchEndX = useRef(null)

  useEffect(() => {
    if (activeIndex >= sortedEvents.length) {
      setActiveIndex(0)
    }
  }, [sortedEvents.length, activeIndex])

  useEffect(() => {
    if (sortedEvents.length <= 1 || isPaused) return

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sortedEvents.length)
    }, 7000)

    return () => clearInterval(timer)
  }, [sortedEvents.length, isPaused])

  function nextSlide() {
    if (!sortedEvents.length) return
    setActiveIndex((prev) => (prev + 1) % sortedEvents.length)
  }

  function prevSlide() {
    if (!sortedEvents.length) return
    setActiveIndex((prev) => (prev - 1 + sortedEvents.length) % sortedEvents.length)
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchMove(e) {
    touchEndX.current = e.touches[0].clientX
  }

  function handleTouchEnd() {
    if (!touchStartX.current || !touchEndX.current) return
    const diff = touchStartX.current - touchEndX.current
    const minSwipeDistance = 40

    if (diff > minSwipeDistance) {
      nextSlide()
    } else if (diff < -minSwipeDistance) {
      prevSlide()
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  // 0 Events Case
  if (!sortedEvents || sortedEvents.length === 0) {
    return (
      <section className="unified-carousel-section unified-empty-wrapper">
        <div className="unified-header">
          <div className="unified-title-group">
            {badge && <span className="unified-badge">{badge}</span>}
            <h2>{title}</h2>
          </div>
        </div>
        <div className="unified-empty-note">
          <p>{emptyNote}</p>
        </div>
      </section>
    )
  }

  const currentEvent = sortedEvents[activeIndex] || sortedEvents[0]
  const currentVenue = parseVenue(currentEvent.location)

  return (
    <section className="unified-carousel-section" aria-label={title}>
      <div className="unified-header">
        <div className="unified-title-group">
          {badge && <span className="unified-badge">{badge}</span>}
          <h2>{title}</h2>
        </div>
      </div>

      <div
        className="hero-banner-wrapper"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="hero-banner-container hero-banner-split-default">
          {/* Dark Grid Pattern Background (Matching Top Hero Banner) */}
          <div className="hero-banner-grid-backdrop" aria-hidden="true" />

          {/* LEFT SIDE: Event Details */}
          <div className="hero-banner-details-left">
            <HappeningBadge startTime={currentEvent.start_time} endTime={currentEvent.end_time} />

            <h3 className="hero-banner-title">{currentEvent.title}</h3>

            <p className="hero-banner-club">{currentEvent.clubs?.name || 'Club Event'}</p>

            {currentEvent.description && (
              <p className="hero-banner-desc">{currentEvent.description}</p>
            )}

            <div className="hero-banner-meta-group">
              <div className="hero-banner-meta-item">
                <span className="hero-banner-meta-label">When</span>
                <p>{formatEventDateRange(currentEvent.start_time, currentEvent.end_time)}</p>
              </div>
              {currentVenue?.name && (
                <div className="hero-banner-meta-item">
                  <span className="hero-banner-meta-label">Venue</span>
                  <p>{currentVenue.name}</p>
                </div>
              )}
            </div>

            <div className="hero-banner-cta-group">
              <Link to={`/events/${currentEvent.id}`} className="button-primary hero-banner-cta">
                View Event <span aria-hidden="true">→</span>
              </Link>
              {currentEvent.id && (
                <BookmarkButton
                  eventId={currentEvent.id}
                  showLabel
                  className="hero-banner-bookmark-btn"
                />
              )}
            </div>
          </div>


          {/* RIGHT SIDE: Default Size Uncropped Poster Image */}
          <div className="hero-banner-poster-right">
            {currentEvent.image_url ? (
              <img
                src={currentEvent.image_url}
                alt={currentEvent.title || 'Event poster'}
                className="hero-banner-poster-img-default"
              />
            ) : (
              <div className="hero-banner-poster-placeholder">
                <span>{(currentEvent.clubs?.name || 'CE').slice(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Bottom Right Direct Link Arrow Button */}
          {currentEvent.id && (
            <Link
              to={`/events/${currentEvent.id}`}
              className="hero-banner-bottom-right-arrow"
              aria-label={`View ${currentEvent.title}`}
              title="View Event"
            >
              <span aria-hidden="true">→</span>
            </Link>
          )}




          {/* Floating Slide Navigation Controls */}
          {sortedEvents.length > 1 && (
            <>
              <button
                type="button"
                className="hero-nav-btn hero-nav-btn--prev"
                onClick={prevSlide}
                aria-label="Previous event"
                title="Previous event"
              >
                ‹
              </button>
              <button
                type="button"
                className="hero-nav-btn hero-nav-btn--next"
                onClick={nextSlide}
                aria-label="Next event"
                title="Next event"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Pagination Dots Below Hero Banner */}
        {sortedEvents.length > 1 && (
          <div className="hero-banner-dots" role="tablist" aria-label="Select slide">
            {sortedEvents.map((ev, index) => (
              <button
                key={ev.id || index}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Go to slide ${index + 1}`}
                className={`hero-dot${index === activeIndex ? ' is-active' : ''}`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
