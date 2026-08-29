import { useState } from 'react'

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function ShareButton({ title, className = '' }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.href
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
        return
      } catch (e) {
        // fallback below
      }
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: title || document.title, url })
        return
      } catch (e) {
        // cancelled
      }
    }
  }

  return (
    <button
      type="button"
      className={`share-btn ${copied ? 'is-copied' : ''} ${className}`}
      onClick={handleShare}
      title={copied ? 'Link copied to clipboard!' : 'Share event link'}
    >
      <span className="share-btn-icon" aria-hidden="true">
        {copied ? <CheckIcon /> : <ShareIcon />}
      </span>
      <span>{copied ? 'Link Copied!' : 'Share Event'}</span>
    </button>
  )
}
