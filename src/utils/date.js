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
