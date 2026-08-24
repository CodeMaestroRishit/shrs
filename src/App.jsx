import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import EventsDiscovery from './pages/EventsDiscovery'
import EventDetail from './pages/EventDetail'
import ClubProfile from './pages/ClubProfile'
import AdminDashboard from './pages/AdminDashboard'
import EventForm from './pages/EventForm'
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<EventsDiscovery />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/clubs/:clubId" element={<ClubProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireClubAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/new"
            element={
              <ProtectedRoute requireClubAdmin>
                <EventForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/:eventId/edit"
            element={
              <ProtectedRoute requireClubAdmin>
                <EventForm />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}
