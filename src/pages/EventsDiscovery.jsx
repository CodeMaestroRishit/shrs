import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import EventFilters from '../components/EventFilters'
import EventCalendar from '../components/EventCalendar'
import QuickFilterTabs from '../components/QuickFilterTabs'
import EventListItem from '../components/EventListItem'
import LoadingSpinner from '../components/LoadingSpinner'
import { getEventStatus, toDateInputValue } from '../utils/date'

const emptyFilters = { search: '', clubId: '', category: '', status: 'all', startDate: '', endDate: '' }
const POSTER_VARIANTS = ['a', 'b', 'c', 'd']

export default function EventsDiscovery() {
  const [clubs, setClubs] = useState([])
  const [events, setEvents] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [activePreset, setActivePreset] = useState('all')
  const [sort, setSort] = useState('soonest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadDiscoveryData() {
      setLoading(true); setError(null)
      const [{ data: clubRows }, { data: eventRows, error: eventError }] = await Promise.all([
        supabase.from('clubs').select('id, name').order('name'),
        supabase.from('events').select('*, clubs(id, name)').order('start_time', { ascending: true }),
      ])
      if (cancelled) return
      setClubs(clubRows ?? [])
      if (eventError) setError(eventError.message)
      else setEvents(eventRows ?? [])
      setLoading(false)
    }
    loadDiscoveryData()
    return () => { cancelled = true }
  }, [])

  const categories = useMemo(() => [...new Set(events.map((event) => event.category).filter(Boolean))].sort(), [events])
  const eventDates = useMemo(() => new Set(events.map((event) => toDateInputValue(new Date(event.start_time)))), [events])
  const filteredEvents = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    const matchingEvents = events.filter((event) => {
      const eventDate = toDateInputValue(new Date(event.start_time))
      const status = getEventStatus(event)
      const searchable = [event.title, event.description, event.category, event.clubs?.name].filter(Boolean).join(' ').toLowerCase()
      return (!search || searchable.includes(search)) &&
        (!filters.clubId || event.club_id === filters.clubId) &&
        (!filters.category || event.category === filters.category) &&
        (filters.status === 'all' || (filters.status === 'completed' ? status === 'completed' : status !== 'completed')) &&
        (!filters.startDate || eventDate >= filters.startDate) &&
        (!filters.endDate || eventDate <= filters.endDate)
    })

    return matchingEvents.sort((a, b) => {
      if (sort === 'latest') return new Date(b.start_time) - new Date(a.start_time)
      if (sort === 'added') return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      return new Date(a.start_time) - new Date(b.start_time)
    })
  }, [events, filters, sort])

  const upcomingEvents = filteredEvents.filter((event) => getEventStatus(event) !== 'completed')
  const completedEvents = filteredEvents.filter((event) => getEventStatus(event) === 'completed').sort((a, b) => sort === 'soonest' ? new Date(b.start_time) - new Date(a.start_time) : 0)
  const hasFilters = Object.entries(filters).some(([key, value]) => key !== 'status' ? Boolean(value) : value !== 'all')

  function resetFilters() { setFilters(emptyFilters); setActivePreset('all'); setFiltersOpen(false) }
  function handlePresetSelect(key, range) { setActivePreset(key); setFilters((current) => ({ ...current, ...range })) }
  function handleCalendarSelect(value) { setActivePreset(null); setFilters((current) => ({ ...current, startDate: value ?? '', endDate: value ?? '' })) }
  function handleFiltersChange(nextFilters) { setActivePreset(null); setFilters(nextFilters) }
  function renderEvents(rows, offset = 0) { return rows.map((event, index) => <EventListItem key={event.id} event={event} clubName={event.clubs?.name} posterVariant={POSTER_VARIANTS[(index + offset) % POSTER_VARIANTS.length]} />) }
  const filterControls = <EventFilters clubs={clubs} categories={categories} filters={filters} onChange={handleFiltersChange} onReset={resetFilters} />

  return <div className="page events-discovery">
    <section className="discovery-hero"><div className="discovery-hero-text"><p className="discovery-hero-eyebrow">RV University · Bengaluru</p><h1>Campus Events</h1><p className="discovery-hero-sub">Everything happening across RVU's clubs — workshops, screenings, tournaments, and more — in one place.</p></div></section>
    <div className="mobile-discovery-controls"><button type="button" className="button-ghost" onClick={() => setFiltersOpen(true)}>Filter events</button><span>{filteredEvents.length} events</span></div>
    {filtersOpen && <div className="filter-drawer" role="dialog" aria-modal="true" aria-label="Filter events"><div className="filter-drawer-header"><h2>Filter events</h2><button type="button" className="button-ghost" onClick={() => setFiltersOpen(false)}>Done</button></div>{filterControls}</div>}
    <div className="discovery-layout"><aside className="discovery-sidebar"><div className="desktop-filter-controls">{filterControls}</div><EventCalendar selectedDate={filters.startDate === filters.endDate ? filters.startDate : ''} onSelectDate={handleCalendarSelect} eventDates={eventDates} /></aside>
      <div className="discovery-main"><div className="discovery-toolbar"><QuickFilterTabs activePreset={activePreset} onSelectPreset={handlePresetSelect} /><label className="event-sort"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="soonest">Soonest first</option><option value="latest">Latest first</option><option value="added">Recently added</option></select></label></div>
        {loading && <div className="event-list-loading"><LoadingSpinner label="Loading events…" /></div>}
        {error && <div className="event-empty-state"><h2>Couldn’t load events</h2><p>{error}</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>}
        {!loading && !error && !filteredEvents.length && <div className="event-empty-state"><h2>No events found</h2><p>{hasFilters ? 'Try changing your filters or search terms.' : 'No upcoming events have been added yet.'}</p>{hasFilters && <button type="button" onClick={resetFilters}>Reset filters</button>}</div>}
        {!loading && !error && upcomingEvents.length > 0 && <section className="event-section"><div className="event-section-heading"><h2>Upcoming events</h2><span>{upcomingEvents.length}</span></div><div className="event-list">{renderEvents(upcomingEvents)}</div></section>}
        {!loading && !error && completedEvents.length > 0 && <section className="event-section event-section-completed"><div className="event-section-heading"><h2>Completed events</h2><span>Available for post-event feedback</span></div><div className="event-list">{renderEvents(completedEvents, upcomingEvents.length)}</div></section>}
      </div></div>
  </div>
}
