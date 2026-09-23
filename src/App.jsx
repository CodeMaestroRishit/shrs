import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Preloader from './components/Preloader'
import IOSInstallPrompt from './components/IOSInstallPrompt'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import EventsDiscovery from './pages/EventsDiscovery'
import EventDetail from './pages/EventDetail'
import ClubProfile from './pages/ClubProfile'
import AdminDashboard from './pages/AdminDashboard'
import EventForm from './pages/EventForm'
import Unauthorized from './pages/Unauthorized'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <Preloader />
      <IOSInstallPrompt />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsDiscovery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <ProtectedRoute>
                <EventDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs/:clubId"
            element={
              <ProtectedRoute>
                <ClubProfile />
              </ProtectedRoute>
            }
          />
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
