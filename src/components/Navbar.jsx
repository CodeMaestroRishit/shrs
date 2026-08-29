import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Placeholder crest — swap for the real RV University logo file (e.g. an
// <img src="/rvu-logo.svg" .../>) once you have the brand asset.
function LogoMark() {
  return (
    <img src="/rvu-logo.png" className="navbar-logo" alt="RV University" />
  )
}

export default function Navbar() {
  const { user, profile, isAnyClubAdmin, signInWithGoogle, signOut } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <LogoMark />
        <span className="navbar-brand-label">RVibe</span>
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
