import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ requireClubAdmin = false, children }) {
  const { user, loading, isAnyClubAdmin } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (requireClubAdmin && !isAnyClubAdmin) return <Navigate to="/unauthorized" replace />

  return children
}
