import { useState } from 'react'
import { useSavedEvents } from '../utils/savedEvents'

function BookmarkIcon({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? '0' : '2'}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export default function BookmarkButton({ eventId, showLabel = false, className = '' }) {
  const { isSaved, toggleSave } = useSavedEvents()
  const saved = isSaved(eventId)
  const [animating, setAnimating] = useState(false)

  if (!eventId) return null

  function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    setAnimating(true)
    toggleSave(eventId)
    setTimeout(() => setAnimating(false), 300)
  }

  return (
    <button
      type="button"
      className={`bookmark-btn${saved ? ' is-saved' : ''}${animating ? ' is-animating' : ''} ${className}`.trim()}
      onClick={handleClick}
      aria-label={saved ? 'Unsave event' : 'Save event'}
      title={saved ? 'Unsave event' : 'Save event'}
    >
      <BookmarkIcon filled={saved} />
      {showLabel && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  )
}
