import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import rvuLogo from '../assets/rvu-logo.png'

export default function Navbar() {
  const { user, profile, isAnyClubAdmin, signInWithGoogle, signOut } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand" title="RV University · Campus Events">
        <img src={rvuLogo} alt="RV University Logo" className="navbar-logo-img" />

        <span className="navbar-brand-divider" aria-hidden="true" />

        <div className="navbar-app-title">
          <span>CAMPUS EVENTS</span>
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
