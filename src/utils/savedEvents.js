import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useSavedEvents() {
  const { user } = useAuth()
  const [savedIds, setSavedIds] = useState([])

  useEffect(() => {
    if (!user) {
      setSavedIds([])
      return
    }

    let cancelled = false
    supabase
      .from('saved_events')
      .select('event_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (cancelled) return
        setSavedIds((data ?? []).map((row) => row.event_id))
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const isSaved = useCallback((eventId) => savedIds.includes(eventId), [savedIds])

  const toggleSave = useCallback(
    async (eventId) => {
      if (!user || !eventId) return

      if (savedIds.includes(eventId)) {
        setSavedIds((current) => current.filter((id) => id !== eventId))
        const { error } = await supabase
          .from('saved_events')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId)
        if (error) setSavedIds((current) => [...current, eventId])
      } else {
        setSavedIds((current) => [...current, eventId])
        const { error } = await supabase
          .from('saved_events')
          .insert({ user_id: user.id, event_id: eventId })
        if (error) setSavedIds((current) => current.filter((id) => id !== eventId))
      }
    },
    [user, savedIds]
  )

  return {
    savedIds,
    count: savedIds.length,
    isSaved,
    toggleSave,
  }
}
