import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, profile, isAnyClubAdmin, signInWithGoogle, signOut } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand" title="RVibe">
        <div className="navbar-app-title">
          <span>RVIBE</span>
        </div>
      </Link>

      <nav className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/events">Upcoming</Link>
        {isAnyClubAdmin && <Link to="/admin">Admin Dashboard</Link>}
        {user ? (
          <div className="navbar-user">
            <span>{profile?.name || user.email}</span>
            <button type="button" className="button-ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        ) : (
          <button type="button" className="button-primary" onClick={() => signInWithGoogle()}>
            Sign in
          </button>
        )}
      </nav>
    </header>
  )
}
