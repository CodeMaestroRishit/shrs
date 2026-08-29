import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RvuOfficialCrest() {
  return (
    <svg width="44" height="44" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="rvu-official-crest-svg">
      {/* 5 Leaf / Petal Motifs at top */}
      <path d="M70 12C70 12 64 22 70 30C76 22 70 12 70 12Z" fill="#C8A86B" stroke="#C8A86B" strokeWidth="1.5" />
      <path d="M54 18C54 18 52 28 60 34C64 27 54 18 54 18Z" fill="#C8A86B" stroke="#C8A86B" strokeWidth="1.5" />
      <path d="M86 18C86 18 88 28 80 34C76 27 86 18 86 18Z" fill="#C8A86B" stroke="#C8A86B" strokeWidth="1.5" />
      <path d="M40 28C40 28 42 37 52 40C54 33 40 28 40 28Z" fill="#C8A86B" stroke="#C8A86B" strokeWidth="1.5" />
      <path d="M100 28C100 28 98 37 88 40C86 33 100 28 100 28Z" fill="#C8A86B" stroke="#C8A86B" strokeWidth="1.5" />

      {/* Open Book Pages Motif */}
      <path d="M36 46C50 42 66 42 70 47C74 42 90 42 104 46V60C90 56 74 56 70 61C66 56 50 56 36 60V46Z" stroke="#C8A86B" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M38 52C50 48 64 48 68 53" stroke="#C8A86B" strokeWidth="2" fill="none" />
      <path d="M102 52C90 48 76 48 72 53" stroke="#C8A86B" strokeWidth="2" fill="none" />
      <line x1="70" y1="47" x2="70" y2="61" stroke="#C8A86B" strokeWidth="2.5" />

      {/* Wavy Sunburst Shield Base */}
      <path d="M34 60C34 84 50 96 70 102C90 96 106 84 106 60H34Z" stroke="#C8A86B" strokeWidth="3" fill="rgba(200, 168, 107, 0.06)" />
      <path d="M44 64C48 78 58 88 70 92C82 88 92 78 96 64" stroke="#C8A86B" strokeWidth="2" fill="none" />
      <path d="M56 66C58 75 64 82 70 85C76 82 82 75 84 66" stroke="#C8A86B" strokeWidth="1.5" fill="none" />
      <circle cx="70" cy="98" r="6" stroke="#C8A86B" strokeWidth="2" fill="none" />

      {/* Ribbon Banner at bottom */}
      <path d="M26 106L36 100H104L114 106L106 114H34L26 106Z" stroke="#C8A86B" strokeWidth="2.5" fill="#1E1E1E" />
      <path d="M38 107H102" stroke="#C8A86B" strokeWidth="1" />
    </svg>
  )
}

export default function Navbar() {
  const { user, profile, isAnyClubAdmin, signInWithGoogle, signOut } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand" title="RV University · Campus Events">
        <div className="rvu-brand-lockup">
          <RvuOfficialCrest />
          <div className="rvu-brand-text-stack">
            <span className="rvu-text-rv">RV</span>
            <span className="rvu-text-univ">UNIVERSITY</span>
            <span className="rvu-gold-line" aria-hidden="true" />
            <span className="rvu-text-motto">Go, change the world</span>
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
