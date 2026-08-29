export function parseVenue(location) {
  if (!location) return { name: '', link: '' }

  let name = ''
  let link = ''

  if (typeof location === 'object' && location !== null) {
    name = location.name || ''
    link = location.link || location.url || ''
  } else if (typeof location === 'string') {
    const trimmed = location.trim()

    // 1. Try parsing JSON if location is a JSON string
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        name = parsed.name || parsed.venue || ''
        link = parsed.link || parsed.url || ''
        return { name, link }
      } catch {
        // fallback to text parsing below
      }
    }

    // 2. Extract URL from string if embedded
    const urlMatch = trimmed.match(/https?:\/\/[^\s]+/)
    if (urlMatch) {
      link = urlMatch[0]
      name = trimmed.replace(urlMatch[0], '').trim()
    } else {
      name = trimmed
    }
  }

  return { name, link }
}

export function isValidVenueLink(url) {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function serializeVenue({ name = '', link = '' }) {
  const trimmedName = name.trim()
  const trimmedLink = link.trim()
  if (!trimmedName && !trimmedLink) return ''
  if (!trimmedLink) return trimmedName
  return JSON.stringify({ name: trimmedName, link: trimmedLink })
}
