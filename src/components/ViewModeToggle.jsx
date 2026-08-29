function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="4" x2="14" y2="4" />
      <line x1="2" y1="8" x2="14" y2="8" />
      <line x1="2" y1="12" x2="14" y2="12" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1.5" y="3" width="13" height="11.5" rx="1.5" />
      <line x1="1.5" y1="6" x2="14.5" y2="6" />
      <line x1="4.5" y1="1.5" x2="4.5" y2="4.5" />
      <line x1="11.5" y1="1.5" x2="11.5" y2="4.5" />
    </svg>
  )
}

export default function ViewModeToggle({ viewMode, onChangeViewMode }) {
  return (
    <div className="view-mode-toggle" role="radiogroup" aria-label="Event view mode">
      <button
        type="button"
        role="radio"
        aria-checked={viewMode === 'list'}
        className={`view-mode-btn${viewMode === 'list' ? ' is-active' : ''}`}
        onClick={() => onChangeViewMode('list')}
      >
        <ListIcon />
        <span>List</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={viewMode === 'calendar'}
        className={`view-mode-btn${viewMode === 'calendar' ? ' is-active' : ''}`}
        onClick={() => onChangeViewMode('calendar')}
      >
        <CalendarIcon />
        <span>Calendar</span>
      </button>
    </div>
  )
}
