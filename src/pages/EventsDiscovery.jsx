import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import EventFilters from '../components/EventFilters'
import EventCalendar from '../components/EventCalendar'
import QuickFilterTabs from '../components/QuickFilterTabs'
import EventListItem from '../components/EventListItem'
import LoadingSpinner from '../components/LoadingSpinner'
import { toDateInputValue } from '../utils/date'

const emptyFilters = { search: '', clubId: '', startDate: '', endDate: '' }
const POSTER_VARIANTS = ['a', 'b', 'c', 'd']

export default function EventsDiscovery() {
  const [clubs, setClubs] = useState([])
  const [events, setEvents] = useState([])
  const [eventDates, setEventDates] = useState(new Set())
  const [filters, setFilters] = useState(emptyFilters)
  const [activePreset, setActivePreset] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('clubs')
      .select('id, name')
      .order('name')
      .then(({ data }) => setClubs(data ?? []))

    supabase
      .from('events')
      .select('start_time')
      .then(({ data }) => {
        setEventDates(new Set((data ?? []).map((row) => toDateInputValue(new Date(row.start_time)))))
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function loadEvents() {
      let query = supabase
        .from('events')
        .select('*, clubs(id, name)')
        .order('start_time', { ascending: true })

      if (filters.clubId) query = query.eq('club_id', filters.clubId)
      if (filters.startDate) query = query.gte('start_time', new Date(`${filters.startDate}T00:00:00`).toISOString())
      if (filters.endDate) query = query.lte('start_time', new Date(`${filters.endDate}T23:59:59`).toISOString())
      if (filters.search.trim()) {
        query = query.or(`title.ilike.%${filters.search.trim()}%,description.ilike.%${filters.search.trim()}%`)
      }

      const { data, error: queryError } = await query
      if (cancelled) return

      if (queryError) setError(queryError.message)
      else setEvents(data ?? [])
      setLoading(false)
    }

    loadEvents()
    return () => {
      cancelled = true
    }
  }, [filters])

  function handlePresetSelect(key, range) {
    setActivePreset(key)
    setFilters((f) => ({ ...f, ...range }))
  }

  function handleCalendarSelect(dateValue) {
    setActivePreset(null)
    setFilters((f) => ({ ...f, startDate: dateValue ?? '', endDate: dateValue ?? '' }))
  }

  function handleFiltersChange(nextFilters) {
    setActivePreset(null)
    setFilters(nextFilters)
  }

  return (
    <div className="page events-discovery">
      <section className="discovery-hero">
        <div className="discovery-hero-text">
          <p className="discovery-hero-eyebrow">RV University · Bengaluru</p>
          <h1>RVibe</h1>
          <p className="discovery-hero-sub">
            Everything happening across RVU's clubs — workshops, screenings, tournaments, and more — in one place.
          </p>
        </div>
      </section>

      <div className="discovery-layout">
        <aside className="discovery-sidebar">
          <EventFilters clubs={clubs} filters={filters} onChange={handleFiltersChange} />
          <EventCalendar
            selectedDate={filters.startDate === filters.endDate ? filters.startDate : ''}
            onSelectDate={handleCalendarSelect}
            eventDates={eventDates}
          />
        </aside>

        <div className="discovery-main">
          <QuickFilterTabs activePreset={activePreset} onSelectPreset={handlePresetSelect} />

          {loading && <LoadingSpinner label="Loading events…" />}
          {error && <p className="form-error">{error}</p>}
          {!loading && !error && events.length === 0 && <p>No events match your filters.</p>}

          <div className="event-list">
            {events.map((event, i) => (
              <EventListItem
                key={event.id}
                event={event}
                clubName={event.clubs?.name}
                posterVariant={POSTER_VARIANTS[i % POSTER_VARIANTS.length]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
