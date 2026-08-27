import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user, isAnyClubAdmin, signInWithGoogle } = useAuth()
  if (user) return <Navigate to={isAnyClubAdmin ? '/admin' : '/events'} replace />

  return <div className="page home-page">
    <section className="home-hero">
      <p className="home-eyebrow">RV UNIVERSITY / BENGALURU / CAMPUS LIFE</p>
      <h1 className="home-title">Campus<br />Events.</h1>
      <div className="home-hero-bottom"><p className="home-sub">Everything happening across RVU&apos;s clubs, in one place.</p><Link className="hero-cta" to="/events">Browse events <span>↗</span></Link></div>
    </section>
    <section className="home-quick-links" aria-label="Choose your access">
      <article className="quick-link"><span>01</span><div><strong>I&apos;m a Student</strong><p>Browse events from every club on campus — workshops, screenings, tournaments, and more.</p></div><button type="button" className="button-primary" onClick={() => signInWithGoogle('/events')}>Continue</button></article>
      <article className="quick-link"><span>02</span><div><strong>I&apos;m a Club Admin</strong><p>Create, edit, and manage events for the club(s) you administer.</p><small>Only pre-approved club admins can manage events.</small></div><button type="button" className="button-primary" onClick={() => signInWithGoogle('/admin')}>Continue</button></article>
    </section>
    <section className="home-manifesto"><p className="home-eyebrow">DISCOVER RVU</p><div><h2>Make time for the conversations that change your point of view.</h2><p>Discover the people, clubs and gatherings that make RVU move. Free to attend. Open to everyone on campus.</p><Link className="text-link" to="/events">Just want to look around? Browse events without signing in →</Link></div></section>
  </div>
}
