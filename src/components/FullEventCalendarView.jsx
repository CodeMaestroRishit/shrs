import { useState, useMemo } from 'react'
import EventListItem from './EventListItem'
import { toDateInputValue, formatEventDate } from '../utils/date'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABEL = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const POSTER_VARIANTS = ['a', 'b', 'c', 'd']

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay()
  const gridStart = new Date(year, month, 1 - startOffset)

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    return date
  })
}

export default function FullEventCalendarView({ events = [], allEvents = [] }) {
  const today = useMemo(() => new Date(), [])
  const todayValue = useMemo(() => toDateInputValue(today), [today])
  const [viewDate, setViewDate] = useState(() => today)
  const [selectedDateValue, setSelectedDateValue] = useState(() => todayValue)

  const sourceEvents = allEvents.length > 0 ? allEvents : events

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const days = useMemo(() => buildMonthGrid(year, month), [year, month])

  // Map YYYY-MM-DD -> Array of events
  const eventsByDate = useMemo(() => {
    const map = new Map()
    sourceEvents.forEach((event) => {
      if (!event.start_time) return
      const dateStr = toDateInputValue(new Date(event.start_time))
      if (!map.has(dateStr)) {
        map.set(dateStr, [])
      }
      map.get(dateStr).push(event)
    })
    return map
  }, [sourceEvents])

  function changeMonth(delta) {
    setViewDate(new Date(year, month + delta, 1))
  }

  function handleGoToday() {
    setViewDate(today)
    setSelectedDateValue(todayValue)
  }

  function handleDayClick(dateValue) {
    setSelectedDateValue((prev) => (prev === dateValue ? null : dateValue))
  }

  const selectedDateEvents = selectedDateValue ? (eventsByDate.get(selectedDateValue) ?? []) : []

  return (
    <div className="full-calendar-view">
      {/* Calendar Header with Controls */}
      <div className="full-calendar-header">
        <div className="full-calendar-month-title">
          <h2>{MONTH_LABEL.format(viewDate)}</h2>
        </div>

        <div className="full-calendar-nav">
          <button
            type="button"
            className="full-calendar-nav-btn"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            title="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            className="full-calendar-today-btn"
            onClick={handleGoToday}
          >
            Today
          </button>
          <button
            type="button"
            className="full-calendar-nav-btn"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            title="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday Header Row */}
      <div className="full-calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="full-calendar-weekday">
            {label}
          </div>
        ))}
      </div>

      {/* 42-Day Month Grid */}
      <div className="full-calendar-grid">
        {days.map((date) => {
          const dateValue = toDateInputValue(date)
          const inMonth = date.getMonth() === month
          const isToday = dateValue === todayValue
          const isSelected = dateValue === selectedDateValue
          const dayEvents = eventsByDate.get(dateValue) ?? []
          const hasEvents = dayEvents.length > 0

          return (
            <button
              type="button"
              key={dateValue}
              className={[
                'full-calendar-day',
                !inMonth && 'is-outside-month',
                isToday && 'is-today',
                isSelected && 'is-selected',
                hasEvents && 'has-events',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleDayClick(dateValue)}
            >
              <span className="full-calendar-day-num">{date.getDate()}</span>

              {hasEvents && (
                <div className="full-calendar-day-badge">
                  <span className="full-calendar-dot" />
                  <span className="full-calendar-count">{dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected Date Events Section */}
      <div className="full-calendar-selected-section">
        {selectedDateValue ? (
          <>
            <div className="full-calendar-section-header">
              <h3>
                Events for {formatEventDate(new Date(`${selectedDateValue}T00:00:00`))}
              </h3>
              <span className="full-calendar-section-count">
                {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="full-calendar-empty-day">
                <p>No events scheduled for this date.</p>
              </div>
            ) : (
              <div className="event-list">
                {selectedDateEvents.map((event, i) => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    clubName={event.clubs?.name}
                    posterVariant={POSTER_VARIANTS[i % POSTER_VARIANTS.length]}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="full-calendar-empty-day">
            <p>Click on any calendar date above to view scheduled events for that day.</p>
          </div>
        )}
      </div>
    </div>
  )
}
