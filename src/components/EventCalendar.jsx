import { useState } from 'react'
import { toDateInputValue } from '../utils/date'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABEL = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

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

export default function EventCalendar({ selectedDate, onSelectDate, eventDates }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(() => selectedDate ? new Date(selectedDate) : today)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const days = buildMonthGrid(year, month)
  const todayValue = toDateInputValue(today)

  function changeMonth(delta) {
    setViewDate(new Date(year, month + delta, 1))
  }

  function handleDayClick(date) {
    const value = toDateInputValue(date)
    onSelectDate(value === selectedDate ? null : value)
  }

  return (
    <div className="event-calendar" aria-label="Filter events by date">
      <div className="event-calendar-header">
        <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>
          ‹
        </button>
        <span>{MONTH_LABEL.format(viewDate)}</span>
        <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>
          ›
        </button>
      </div>

      <p className="event-calendar-help">Select a date to filter events.</p>

      <div className="event-calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="event-calendar-grid">
        {days.map((date) => {
          const value = toDateInputValue(date)
          const inMonth = date.getMonth() === month
          const isToday = value === todayValue
          const isSelected = value === selectedDate
          const hasEvents = eventDates?.has(value)

          return (
            <button
              type="button"
              key={value}
              className={[
                'event-calendar-day',
                !inMonth && 'is-outside',
                isToday && 'is-today',
                isSelected && 'is-selected',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleDayClick(date)}
              aria-pressed={isSelected}
              aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${hasEvents ? ', has events' : ''}`}
            >
              {date.getDate()}
              {hasEvents && <span className="event-calendar-dot" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
