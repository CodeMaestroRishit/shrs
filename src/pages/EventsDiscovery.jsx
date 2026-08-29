import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import EventFilters from '../components/EventFilters'
import EventCalendar from '../components/EventCalendar'
import QuickFilterTabs from '../components/QuickFilterTabs'
import EventListItem from '../components/EventListItem'
import UnifiedEventCarousel from '../components/UnifiedEventCarousel'
import ViewModeToggle from '../components/ViewModeToggle'
import FullEventCalendarView from '../components/FullEventCalendarView'
import LoadingSpinner from '../components/LoadingSpinner'
import { toDateInputValue } from '../utils/date'
import { useSavedEvents } from '../utils/savedEvents'

const emptyFilters = { search: '', clubId: '', startDate: '', endDate: '' }
const POSTER_VARIANTS = ['a', 'b', 'c', 'd']

export default function EventsDiscovery() {
  const [clubs, setClubs] = useState([])
  const [events, setEvents] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [eventDates, setEventDates] = useState(new Set())
  const [filters, setFilters] = useState(emptyFilters)
  const [activePreset, setActivePreset] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { savedIds, isSaved } = useSavedEvents()

  useEffect(() => {
    supabase
      .from('clubs')
      .select('id, name')
      .order('name')
      .then(({ data }) => setClubs(data ?? []))

    supabase
      .from('events')
      .select('*, clubs(id, name)')
      .order('start_time', { ascending: true })
      .then(({ data }) => {
        const rows = data ?? []
        setAllEvents(rows)
        setEventDates(new Set(rows.map((row) => toDateInputValue(new Date(row.start_time)))))
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

  const isSavedPreset = activePreset === 'saved'
  const displayedEvents = isSavedPreset
    ? events.filter((e) => isSaved(e.id))
    : events

  const isDefaultView = !filters.search && !filters.clubId && !filters.startDate && (activePreset === 'all' || !activePreset)

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

      {/* Single Unified Event Carousel combining Happening Now & Upcoming events */}
      {isDefaultView && (
        <UnifiedEventCarousel
          title="Featured & Upcoming Events"
          badge="★ Campus Showcase"
          events={allEvents}
          emptyNote="No events happening soon."
        />
      )}

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
          <div className="discovery-controls-bar">
            <QuickFilterTabs activePreset={activePreset} onSelectPreset={handlePresetSelect} />
            <ViewModeToggle viewMode={viewMode} onChangeViewMode={setViewMode} />
          </div>

          {loading && <LoadingSpinner label="Loading events…" />}
          {error && <p className="form-error">{error}</p>}

          {!loading && !error && viewMode === 'calendar' && (
            <FullEventCalendarView events={displayedEvents} allEvents={allEvents} />
          )}

          {!loading && !error && viewMode === 'list' && (
            <>
              {isSavedPreset && displayedEvents.length === 0 && (
                <div className="saved-empty-state">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <h3>No saved events yet</h3>
                  <p>Click the bookmark icon on any event card to save it for quick access later.</p>
                </div>
              )}
              {!isSavedPreset && events.length === 0 && <p>No events match your filters.</p>}

              <div className="event-list">
                {displayedEvents.map((event, i) => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    clubName={event.clubs?.name}
                    posterVariant={POSTER_VARIANTS[i % POSTER_VARIANTS.length]}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}




