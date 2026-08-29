const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})

export function formatEventDate(isoString) {
  if (!isoString) return ''
  return dateFormatter.format(new Date(isoString))
}

export function formatEventTime(isoString) {
  if (!isoString) return ''
  return timeFormatter.format(new Date(isoString))
}

export function formatEventDateRange(startIso, endIso) {
  if (!startIso) return ''
  const start = `${formatEventDate(startIso)} · ${formatEventTime(startIso)}`
  if (!endIso) return start
  const sameDay = new Date(startIso).toDateString() === new Date(endIso).toDateString()
  return sameDay ? `${start} – ${formatEventTime(endIso)}` : `${start} → ${formatEventDate(endIso)} · ${formatEventTime(endIso)}`
}

export function toDatetimeLocalValue(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

// Quick-filter date ranges, anchored to the browser's local date so "Today"
// always matches the viewer's calendar day rather than UTC.
export function getQuickFilterRange(preset) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay() // 0 = Sunday
  const startOfWeek = addDays(today, -dayOfWeek)

  switch (preset) {
    case 'today':
      return { startDate: toDateInputValue(today), endDate: toDateInputValue(today) }
    case 'this-week':
      return { startDate: toDateInputValue(startOfWeek), endDate: toDateInputValue(addDays(startOfWeek, 6)) }
    case 'next-week':
      return {
        startDate: toDateInputValue(addDays(startOfWeek, 7)),
        endDate: toDateInputValue(addDays(startOfWeek, 13)),
      }
    case 'this-month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) }
    }
    default:
      return { startDate: '', endDate: '' }
  }
}

/**
 * Determines whether an event is Happening Now, Starts Soon (Xh Ym),
 * Happening Tomorrow, or Starts in Xd.
 */
export function getHappeningStatus(startIso, endIso) {
  if (!startIso) return null
  const now = new Date()
  const start = new Date(startIso)
  if (isNaN(start.getTime())) return null

  const defaultEndMs = start.getTime() + 3 * 60 * 60 * 1000 // 3 hours default
  const end = endIso ? new Date(endIso) : new Date(defaultEndMs)
  const endMs = isNaN(end.getTime()) ? defaultEndMs : end.getTime()

  // Completed event check
  if (now.getTime() > endMs) return null

  // Happening Now check
  if (start.getTime() <= now.getTime() && now.getTime() <= endMs) {
    return {
      type: 'now',
      label: '● HAPPENING NOW',
      badgeClass: 'happening-badge happening-now',
    }
  }

  // Future event check
  if (start.getTime() > now.getTime()) {
    const diffMs = start.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours <= 24) {
      if (diffHours < 1) {
        const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)))
        return {
          type: 'soon',
          label: `Starts in ${mins}m`,
          badgeClass: 'happening-badge happening-soon',
        }
      }
      const hours = Math.floor(diffHours)
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const timeStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`

      const isToday = now.toDateString() === start.toDateString()
      return {
        type: 'soon',
        label: isToday ? `Starts in ${timeStr}` : `Starts in ${timeStr}`,
        badgeClass: 'happening-badge happening-soon',
      }
    }

    if (diffHours <= 48) {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const isTomorrow = tomorrow.toDateString() === start.toDateString()

      return {
        type: 'tomorrow',
        label: isTomorrow ? 'Happening Tomorrow' : 'Starts in 1d',
        badgeClass: 'happening-badge happening-tomorrow',
      }
    }

    const days = Math.ceil(diffHours / 24)
    return {
      type: 'future',
      label: `Starts in ${days}d`,
      badgeClass: 'happening-badge happening-future',
    }
  }

  return null
}

/**
 * Sorts events for the unified carousel:
 * 1. Excludes completed events (end_time < now).
 * 2. Places currently happening events FIRST.
 * 3. Places upcoming events chronologically by start_time.
 */
export function sortEventsUnified(events = []) {
  if (!events || !events.length) return []
  const now = new Date().getTime()

  // Filter out completed events
  const activeEvents = events.filter((e) => {
    if (!e.start_time) return false
    const startMs = new Date(e.start_time).getTime()
    const endMs = e.end_time ? new Date(e.end_time).getTime() : startMs + 3 * 60 * 60 * 1000
    return now <= endMs
  })

  // Separate currently happening vs upcoming
  const happeningNow = []
  const upcoming = []

  activeEvents.forEach((e) => {
    const status = getHappeningStatus(e.start_time, e.end_time)
    if (status && status.type === 'now') {
      happeningNow.push(e)
    } else {
      upcoming.push(e)
    }
  })

  // Sort upcoming chronologically
  upcoming.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  return [...happeningNow, ...upcoming]
}


