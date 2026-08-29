import { useState } from 'react'

export default function StarRating({ eventId, initialRating = 0, className = '' }) {
  const [rating, setRating] = useState(() => {
    try {
      const saved = localStorage.getItem(`event_rating_${eventId}`)
      return saved ? parseInt(saved, 10) : initialRating
    } catch {
      return initialRating
    }
  })
  const [hoverRating, setHoverRating] = useState(0)
  const [justRated, setJustRated] = useState(false)

  function handleRate(starValue) {
    setRating(starValue)
    setJustRated(true)
    try {
      localStorage.setItem(`event_rating_${eventId}`, starValue.toString())
    } catch {}
    setTimeout(() => setJustRated(false), 1200)
  }

  const activeStars = hoverRating || rating

  return (
    <div className={`star-rating-wrap ${className}`}>
      <span className="star-rating-label">Rate this event:</span>
      <div className="star-rating-stars" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeStars
          return (
            <button
              key={star}
              type="button"
              className={`star-btn ${isFilled ? 'is-active' : ''} ${justRated && star === rating ? 'just-rated' : ''}`}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              aria-label={`Rate ${star} out of 5 stars`}
            >
              ★
            </button>
          )
        })}
      </div>
      {rating > 0 && <span className="star-rating-value">{rating}.0 / 5</span>}
    </div>
  )
}
