import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Unauthorized() {
  const { user, signOut } = useAuth()

  return (
    <div className="page unauthorized-page">
      <article className="unauthorized-card">
        <p className="home-eyebrow">Access restricted</p>
        <h1>You&apos;re not on the admin list</h1>
        <p>
          {user?.email ? <><strong>{user.email}</strong> isn&apos;t</> : "This account isn't"} an
          approved club admin, so there&apos;s nothing to manage here. If that&apos;s a mistake,
          check with your club to get added.
        </p>
        <div className="unauthorized-actions">
          <Link to="/events" className="button-primary">Browse events instead</Link>
          <button type="button" className="button-ghost" onClick={signOut}>Sign out &amp; try another account</button>
        </div>
      </article>
    </div>
  )
}
