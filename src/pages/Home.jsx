import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user, isAnyClubAdmin, signInWithGoogle } = useAuth()

  if (user) {
    return <Navigate to={isAnyClubAdmin ? '/admin' : '/events'} replace />
  }

  return (
    <div className="page home-page">
      <div className="home-hero">
        <p className="home-eyebrow">RV University · Bengaluru</p>
        <h1 className="home-title">Campus Events</h1>
        <p className="home-sub">Everything happening across RVU's clubs, in one place.</p>
      </div>

      <div className="home-choices">
        <div className="home-choice-card">
          <h2>I'm a Student</h2>
          <p>Browse events from every club on campus — workshops, screenings, tournaments, and more.</p>
          <button type="button" className="button-primary" onClick={() => signInWithGoogle('/events')}>
            Continue as Student
          </button>
        </div>

        <div className="home-choice-card">
          <h2>I'm a Club Admin</h2>
          <p>Create, edit, and manage events for the club(s) you administer.</p>
          <button type="button" className="button-primary" onClick={() => signInWithGoogle('/admin')}>
            Continue as Club Admin
          </button>
          <p className="home-choice-note">
            Only pre-approved club admins can manage events — ask your moderator to add your email if you don't have
            access yet.
          </p>
        </div>
      </div>

      <p className="home-browse-link">
        Just want to look around? <Link to="/events">Browse events without signing in →</Link>
      </p>
    </div>
  )
}
