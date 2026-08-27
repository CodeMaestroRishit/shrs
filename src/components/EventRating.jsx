import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function EventRating({ eventId }) {
  const { user, signInWithGoogle } = useAuth()
  const [average, setAverage] = useState(null)
  const [count, setCount] = useState(0)
  const [myRating, setMyRating] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadRatings() {
      setLoading(true); setError(null)
      const { data, error: ratingsError } = await supabase.from('event_ratings').select('rating, user_id').eq('event_id', eventId)
      if (cancelled) return
      if (ratingsError) { setError('Ratings are unavailable right now.'); setLoading(false); return }
      const ratings = data ?? []
      setCount(ratings.length)
      setAverage(ratings.length ? ratings.reduce((total, item) => total + item.rating, 0) / ratings.length : null)
      setMyRating(ratings.find((item) => item.user_id === user?.id)?.rating ?? null)
      setLoading(false)
    }
    loadRatings()
    return () => { cancelled = true }
  }, [eventId, user?.id])

  async function submitRating(rating) {
    if (!user) { await signInWithGoogle(`/events/${eventId}`); return }
    setSaving(true); setError(null)
    const previousRating = myRating
    const { error: saveError } = await supabase.from('event_ratings').upsert(
      { event_id: eventId, user_id: user.id, rating },
      { onConflict: 'event_id,user_id' }
    )
    if (saveError) { setError("Rating couldn't be saved. Please try again."); setSaving(false); return }
    const nextCount = previousRating ? count : count + 1
    const nextTotal = (average ?? 0) * count - (previousRating ?? 0) + rating
    setMyRating(rating)
    setCount(nextCount)
    setAverage(nextTotal / nextCount)
    setSaving(false)
  }

  return <section className="event-rating" aria-labelledby="event-rating-heading">
    <div className="event-rating-heading"><div><p className="event-rating-eyebrow">Post-event feedback</p><h2 id="event-rating-heading">How was this event?</h2></div><div className="event-rating-summary" aria-label={count ? `${average.toFixed(1)} out of 5 from ${count} ratings` : 'No ratings yet'}><strong>{average ? average.toFixed(1) : '—'} <span aria-hidden="true">★</span></strong><span>{count ? `${count} rating${count === 1 ? '' : 's'}` : 'No ratings yet'}</span></div></div>
    {loading ? <p className="event-rating-note">Loading ratings…</p> : <><div className="star-rating" role="group" aria-label="Rate this event from one to five stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" disabled={saving} className={value <= (myRating || 0) ? 'is-selected' : ''} onClick={() => submitRating(value)} aria-label={`${value} star${value === 1 ? '' : 's'}`} aria-pressed={myRating === value}>★</button>)}</div><p className="event-rating-note">{user ? (myRating ? `Your rating: ${myRating} out of 5. Select another star to update it.` : 'Select a star to submit your rating.') : 'Sign in to submit a rating.'}</p></>}
    {error && <p className="form-error">{error}</p>}
  </section>
}
