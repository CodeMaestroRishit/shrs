import { getEventStatus } from '../utils/date'

const labels = {
  upcoming: 'Upcoming',
  soon: 'Happening soon',
  ongoing: 'Ongoing',
  completed: 'Completed',
}

export default function EventStatusBadge({ event }) {
  const status = getEventStatus(event)
  return <span className={`event-status event-status-${status}`}>{labels[status]}</span>
}
