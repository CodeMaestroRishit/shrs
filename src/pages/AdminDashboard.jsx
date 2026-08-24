import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatEventDateRange } from '../utils/date'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AdminDashboard() {
  const { adminClubIds } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  async function loadEvents() {
    setLoading(true)
    const { data, error: queryError } = await supabase
      .from('events')
      .select('*, clubs(name)')
      .in('club_id', adminClubIds)
      .order('start_time', { ascending: false })

    if (queryError) setError(queryError.message)
    else setEvents(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (adminClubIds.length > 0) loadEvents()
    else setLoading(false)
  }, [adminClubIds])

  async function handleDelete(eventId) {
    if (!window.confirm('Delete this event? This cannot be undone.')) return
    setDeletingId(eventId)
    const { error: deleteError } = await supabase.from('events').delete().eq('id', eventId)
    setDeletingId(null)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setEvents((current) => current.filter((e) => e.id !== eventId))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="page admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <h1>Your Club Events</h1>
          <p className="admin-dashboard-count">{events.length} event{events.length === 1 ? '' : 's'} across your clubs</p>
        </div>
        <Link to="/admin/events/new" className="button-primary">
          + New Event
        </Link>
      </div>

      {error && <p className="form-error">{error}</p>}
      {events.length === 0 && <p>No events yet. Create your first one.</p>}

      <div className="table-wrap">
        <table className="admin-events-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Club</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>
                  <Link to={`/events/${event.id}`}>{event.title}</Link>
                </td>
                <td>{event.clubs?.name}</td>
                <td className="mono">{formatEventDateRange(event.start_time, event.end_time)}</td>
                <td className="admin-events-table-actions">
                  <Link to={`/admin/events/${event.id}/edit`} className="button-ghost">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="button-danger-ghost"
                    onClick={() => handleDelete(event.id)}
                    disabled={deletingId === event.id}
                  >
                    {deletingId === event.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
