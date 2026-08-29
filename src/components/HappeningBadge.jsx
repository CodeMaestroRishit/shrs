import { getHappeningStatus } from '../utils/date'

export default function HappeningBadge({ startTime, endTime, className = '' }) {
  const status = getHappeningStatus(startTime, endTime)

  if (!status) return null

  return (
    <span className={`${status.badgeClass} ${className}`}>
      <span className="happening-indicator-dot" aria-hidden="true" />
      {status.label}
    </span>
  )
}
