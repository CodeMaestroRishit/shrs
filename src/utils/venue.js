// `location` remains the persisted field for compatibility with the existing
// Supabase schema. A second line is used only when an optional link is present,
// keeping existing one-line venue values readable by older clients too.
export function parseVenue(location) {
  const [name = '', ...linkParts] = (location ?? '').split('\n')
  const link = linkParts.join('\n').trim()

  return { name: name.trim(), link: isValidVenueLink(link) ? link : '' }
}

export function serializeVenue(name, link) {
  const cleanName = name.trim()
  const cleanLink = link.trim()
  return cleanLink ? `${cleanName}\n${cleanLink}` : cleanName
}

export function isValidVenueLink(value) {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
