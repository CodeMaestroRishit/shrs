import { useState, useEffect } from 'react'

const STORAGE_KEY = 'rvu_saved_event_ids'

export function getSavedEventIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Error reading saved events from localStorage:', err)
    return []
  }
}

export function isEventSaved(eventId) {
  if (!eventId) return false
  const saved = getSavedEventIds()
  return saved.includes(String(eventId))
}

export function toggleSaveEvent(eventId) {
  if (!eventId) return false
  const idStr = String(eventId)
  const saved = getSavedEventIds()
  const exists = saved.includes(idStr)
  let updated

  if (exists) {
    updated = saved.filter((id) => id !== idStr)
  } else {
    updated = [...saved, idStr]
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('rvu-saved-events-changed', { detail: updated }))
  } catch (err) {
    console.error('Error saving event to localStorage:', err)
  }

  return !exists
}

export function useSavedEvents() {
  const [savedIds, setSavedIds] = useState(() => getSavedEventIds())

  useEffect(() => {
    function handleChange() {
      setSavedIds(getSavedEventIds())
    }

    window.addEventListener('rvu-saved-events-changed', handleChange)
    window.addEventListener('storage', handleChange)

    return () => {
      window.removeEventListener('rvu-saved-events-changed', handleChange)
      window.removeEventListener('storage', handleChange)
    }
  }, [])

  return {
    savedIds,
    count: savedIds.length,
    isSaved: (id) => savedIds.includes(String(id)),
    toggleSave: (id) => toggleSaveEvent(id),
  }
}
