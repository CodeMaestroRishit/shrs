function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <circle cx="6.8" cy="6.8" r="4.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <line x1="10.4" y1="10.4" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function EventFilters({ clubs, categories, filters, onChange, onReset }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value })
  }

  return (
    <div className="event-filters">
      <label className="event-search-field">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search events…"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
        />
      </label>

      <label className="event-filter-select">
        <span>Club</span>
        <select value={filters.clubId} onChange={(e) => update('clubId', e.target.value)}>
          <option value="">All clubs</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </label>

      {categories.length > 0 && (
        <label className="event-filter-select">
          <span>Category</span>
          <select value={filters.category} onChange={(e) => update('category', e.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
      )}

      <label className="event-filter-select">
        <span>Event status</span>
        <select value={filters.status} onChange={(e) => update('status', e.target.value)}>
          <option value="all">All events</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
        </select>
      </label>

      <button type="button" className="filter-reset" onClick={onReset}>Reset filters</button>
    </div>
  )
}
