import { useState, useEffect } from 'react'

function calculateCountdown(startTime, endTime) {
  if (!startTime) return { status: 'completed', label: 'Event Completed', badgeClass: 'countdown-badge countdown-completed' }

  const now = new Date().getTime()
  const start = new Date(startTime).getTime()
  if (isNaN(start)) return { status: 'completed', label: 'Event Completed', badgeClass: 'countdown-badge countdown-completed' }

  const defaultEndMs = start + 3 * 60 * 60 * 1000 // 3 hours default
  const end = endTime ? new Date(endTime).getTime() : defaultEndMs
  const endMs = isNaN(end) ? defaultEndMs : end

  // Completed check
  if (now > endMs) {
    return {
      status: 'completed',
      label: 'Event Completed',
      badgeClass: 'countdown-badge countdown-completed',
    }
  }

  // Happening Now check
  if (now >= start && now <= endMs) {
    return {
      status: 'now',
      label: 'Happening Now',
      badgeClass: 'countdown-badge countdown-now',
    }
  }

  // Upcoming check
  const diffMs = start - now
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const secs = Math.floor((diffMs % (1000 * 60)) / 1000)

  let formatted = ''

  if (days >= 2) {
    formatted = `${days}d ${hours}h`
  } else if (days === 1) {
    formatted = `1d ${hours}h`
  } else if (hours >= 1) {
    formatted = `${hours}h ${mins}m`
  } else if (mins >= 1) {
    formatted = `${mins}m ${secs}s`
  } else {
    formatted = `${secs}s`
  }

  return {
    status: 'upcoming',
    label: `Starts in ${formatted}`,
    badgeClass: 'countdown-badge countdown-upcoming',
  }
}

export default function EventCountdown({ startTime, endTime }) {
  const [countdown, setCountdown] = useState(() => calculateCountdown(startTime, endTime))

  useEffect(() => {
    // Initial calculation
    const current = calculateCountdown(startTime, endTime)
    setCountdown(current)

    if (current.status === 'completed') return

    // Tick interval
    const interval = setInterval(() => {
      const next = calculateCountdown(startTime, endTime)
      setCountdown(next)
      if (next.status === 'completed') {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, endTime])

  return (
    <div className={countdown.badgeClass} role="status" aria-live="polite">
      {countdown.status === 'now' && <span className="countdown-pulse-dot" aria-hidden="true" />}
      <span>{countdown.label}</span>
    </div>
  )
}
