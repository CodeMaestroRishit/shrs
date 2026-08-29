import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RvuGoldCrest() {
  return (
    <svg width="38" height="38" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="rvu-crest-svg">
      {/* Decorative Shield Crest in Gold */}
      <path d="M50 8L78 22V50C78 68 66 84 50 92C34 84 22 68 22 50V22L50 8Z" stroke="#C8A86B" strokeWidth="4.5" fill="none" />
      <path d="M50 16L70 27V48C70 62 60 75 50 82C40 75 30 62 30 48V27L50 16Z" stroke="#C8A86B" strokeWidth="2" fill="rgba(200, 168, 107, 0.12)" />
      {/* Star / Crown Emblem */}
      <path d="M50 24L53 30L60 30L55 34L57 41L50 37L43 41L45 34L40 30L47 30L50 24Z" fill="#C8A86B" />
      {/* Open Book Emblem */}
      <path d="M38 52C42 50 47 50 50 53C53 50 58 50 62 52V68C58 66 53 66 50 69C47 66 42 66 38 68V52Z" stroke="#C8A86B" strokeWidth="3" fill="none" />
      <line x1="50" y1="53" x2="50" y2="69" stroke="#C8A86B" strokeWidth="2.5" />
      {/* Ribbon Motif */}
      <path d="M32 74C42 72 58 72 68 74" stroke="#C8A86B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function Navbar() {
  const { user, profile, isAnyClubAdmin, signInWithGoogle, signOut } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="rvu-brand-lockup">
          <RvuGoldCrest />
          <div className="rvu-brand-title">
            <span className="rvu-brand-name">RV UNIVERSITY</span>
            <span className="rvu-brand-motto">Go change the world</span>
          </div>
        </div>

        <span className="navbar-brand-divider" aria-hidden="true" />

        <div className="navbar-app-title">
          <span>CAMPUS EVENTS</span>
        </div>
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
          <button type="button" className="button-primary" onClick={() => signInWithGoogle()}>
            Sign in
          </button>
        )}
      </nav>
    </header>
  )
}
