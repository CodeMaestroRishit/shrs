import { getQuickFilterRange } from '../utils/date'

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'this-week', label: 'This Week' },
  { key: 'next-week', label: 'Next Week' },
  { key: 'this-month', label: 'This Month' },
  { key: 'all', label: 'All Events' },
]

export default function QuickFilterTabs({ activePreset, onSelectPreset }) {
  function handleClick(key) {
    const range = key === 'all' ? { startDate: '', endDate: '' } : getQuickFilterRange(key)
    onSelectPreset(key, range)
  }

  return (
    <div className="quick-filter-tabs" role="tablist" aria-label="Filter events by date">
      {PRESETS.map((preset) => (
        <button
          key={preset.key}
          type="button"
          role="tab"
          aria-selected={activePreset === preset.key}
          className={`quick-filter-tab${activePreset === preset.key ? ' is-active' : ''}`}
          onClick={() => handleClick(preset.key)}
        >
          {preset.label}
        </button>
      ))}
    </div>
  )
}
