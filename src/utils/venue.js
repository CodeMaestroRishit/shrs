export function parseVenue(location) {
  if (!location) return { name: '', link: '' }
  if (typeof location === 'string') return { name: location, link: '' }
  return { name: location.name || '', link: location.link || '' }
}
