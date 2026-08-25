import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Placeholder crest — swap for the real RV University logo file (e.g. an
// <img src="/rvu-logo.svg" .../>) once you have the brand asset.
function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      RV
    </span>
  )
}

export default function Navbar() {
  const { user, profile, isAnyClubAdmin, signOut } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <LogoMark />
        <span className="navbar-brand-text">
          <strong>RV University</strong>
          <small>Campus Club Events</small>
        </span>
      </Link>
      <nav className="navbar-links">
        <Link to="/events">Events</Link>
        {isAnyClubAdmin && <Link to="/admin">Admin Dashboard</Link>}
        {user ? (
          <div className="navbar-user">
            <span>{profile?.name || user.email}</span>
            <button type="button" className="button-ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        ) : (
          <Link to="/" className="button-primary">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  )
}
