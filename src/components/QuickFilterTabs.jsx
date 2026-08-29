import { getQuickFilterRange } from '../utils/date'
import { useSavedEvents } from '../utils/savedEvents'

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'this-week', label: 'This Week' },
  { key: 'next-week', label: 'Next Week' },
  { key: 'this-month', label: 'This Month' },
  { key: 'all', label: 'All Events' },
  { key: 'saved', label: 'Saved' },
]

export default function QuickFilterTabs({ activePreset, onSelectPreset }) {
  const { count: savedCount } = useSavedEvents()

  function handleClick(key) {
    const range = key === 'all' || key === 'saved' ? { startDate: '', endDate: '' } : getQuickFilterRange(key)
    onSelectPreset(key, range)
  }

  return (
    <div className="quick-filter-tabs" role="tablist" aria-label="Filter events by date">
      {PRESETS.map((preset) => {
        const isSavedTab = preset.key === 'saved'
        const label = isSavedTab && savedCount > 0 ? `Saved (${savedCount})` : preset.label

        return (
          <button
            key={preset.key}
            type="button"
            role="tab"
            aria-selected={activePreset === preset.key}
            className={`quick-filter-tab${activePreset === preset.key ? ' is-active' : ''}${isSavedTab ? ' quick-filter-tab--saved' : ''}`}
            onClick={() => handleClick(preset.key)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

