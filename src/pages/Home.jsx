import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useInView } from '../hooks/useInView'

function FillWord({ children }) {
  const [ref, inView] = useInView({ threshold: 0.6, rootMargin: '0px 0px -25% 0px' })
  return (
    <span ref={ref} className={`fill-word${inView ? ' is-filled' : ''}`}>
      {children}
    </span>
  )
}

function ScrollFillText({ text, as: Tag = 'span', className }) {
  const words = text.split(' ')
  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <FillWord key={i}>{word}</FillWord>
      ))}
    </Tag>
  )
}

function StoryBeat({ image, alt, line, reverse, nodeRef }) {
  const [ref, inView] = useInView({ threshold: 0.25 })
  return (
    <div
      ref={ref}
      className={`story-beat${reverse ? ' story-beat--reverse' : ''}${inView ? ' is-visible' : ''}`}
    >
      <div className="story-beat-photo">
        <img src={image} alt={alt} loading="lazy" />
      </div>
      <div className="story-rail" aria-hidden="true">
        <span ref={nodeRef} className="story-node" />
      </div>
      <p className="story-beat-line">
        <ScrollFillText text={line} />
      </p>
    </div>
  )
}

const STORY_BEATS = [
  { image: '/story/robotics-kids.jpg', alt: 'Students wiring up a robotics project', line: 'This is where a robot moves for the first time.' },
  { image: '/story/sofmca.jpg', alt: 'Students filming with a camera on campus', line: 'This is where a film crew finds its shot.' },
  { image: '/story/students.jpg', alt: 'Students collaborating around a laptop', line: 'This is where you find your people.' },
  { image: '/story/infra-library.jpg', alt: 'Art installation of books in the RVU library', line: 'This is where you disappear into a book for an afternoon.' },
]

function StoryScroller() {
  const sectionRef = useRef(null)
  const nodeRefs = useRef([])
  const fillPathRef = useRef(null)
  const [pathD, setPathD] = useState('')
  const [dash, setDash] = useState({ length: 0, offset: 0 })

  useEffect(() => {
    function measure() {
      const section = sectionRef.current
      if (!section) return
      const sectionRect = section.getBoundingClientRect()
      const points = nodeRefs.current.filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2 - sectionRect.left, y: r.top + r.height / 2 - sectionRect.top }
      })
      if (points.length < 2) return

      let d = `M ${points[0].x} ${points[0].y - 60} L ${points[0].x} ${points[0].y}`
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i]
        const p1 = points[i + 1]
        const dy = (p1.y - p0.y) / 2
        d += ` C ${p0.x} ${p0.y + dy}, ${p1.x} ${p1.y - dy}, ${p1.x} ${p1.y}`
      }
      const last = points[points.length - 1]
      d += ` L ${last.x} ${last.y + 60}`
      setPathD(d)
    }

    measure()
    const settle = setTimeout(measure, 400)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      clearTimeout(settle)
    }
  }, [])

  useEffect(() => {
    const el = fillPathRef.current
    if (!el || !pathD) return
    const length = el.getTotalLength()

    function onScroll() {
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      const total = rect.height + vh * 0.5
      const scrolled = vh * 0.8 - rect.top
      const progress = Math.min(1, Math.max(0, scrolled / total))
      setDash({ length, offset: length * (1 - progress) })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathD])

  return (
    <section className="home-story" ref={sectionRef} aria-label="What happens at RVU">
      <svg className="story-trail-svg" aria-hidden="true">
        {pathD && <path d={pathD} className="story-trail-bg" />}
        {pathD && (
          <path
            ref={fillPathRef}
            d={pathD}
            className="story-trail-fill"
            style={{ strokeDasharray: dash.length || 1, strokeDashoffset: dash.offset }}
          />
        )}
      </svg>
      {STORY_BEATS.map((beat, i) => (
        <StoryBeat
          key={beat.image}
          {...beat}
          reverse={i % 2 === 1}
          nodeRef={(el) => { nodeRefs.current[i] = el }}
        />
      ))}
    </section>
  )
}

const CLUB_THEMES = [
  { key: 'dance', label: 'DANCE', image: '/story/theme-dance.jpg', color: '#c1543f' },
  { key: 'robotics', label: 'ROBOTICS', image: '/story/theme-robotics.jpg', color: '#2d6e6b' },
  { key: 'coding', label: 'CODE', image: '/story/theme-coding.jpg', color: '#C8A86B' },
  { key: 'design', label: 'DESIGN', image: '/story/theme-design.jpg', color: '#6f4f8f' },
  { key: 'poetry', label: 'POETRY', image: '/story/theme-poetry.jpg', color: '#2f4a68' },
]

function HeroScatter() {
  const cards = [...CLUB_THEMES, ...CLUB_THEMES.slice(0, 5)]
  return (
    <div className="hero-scatter" aria-hidden="true">
      {cards.map((theme, i) => (
        <div key={i} className="hero-scatter-card">
          <img src={theme.image} alt="" loading="lazy" />
          <span>{theme.label}</span>
        </div>
      ))}
    </div>
  )
}

function StatsStrip() {
  const [ref, inView] = useInView({ threshold: 0.4 })
  const [stats, setStats] = useState({ clubs: null, events: null, students: null })

  useEffect(() => {
    Promise.all([
      supabase.rpc('get_club_count'),
      supabase.rpc('get_event_count'),
      supabase.rpc('get_student_count'),
    ]).then(([clubsRes, eventsRes, studentsRes]) => {
      setStats({ clubs: clubsRes.data ?? 0, events: eventsRes.data ?? 0, students: studentsRes.data ?? 0 })
    })
  }, [])

  return (
    <section ref={ref} className={`stats-strip${inView ? ' is-visible' : ''}`} aria-label="RVibe by the numbers">
      <div className="stat-tile">
        <strong>{stats.students ?? '—'}</strong>
        <span>Students joined</span>
      </div>
      <div className="stat-tile">
        <strong>{stats.clubs ?? '—'}</strong>
        <span>Clubs</span>
      </div>
      <div className="stat-tile">
        <strong>{stats.events ?? '—'}</strong>
        <span>Events posted</span>
      </div>
      <div className="stat-tile">
        <strong>Free</strong>
        <span>To attend, always</span>
      </div>
    </section>
  )
}

function HomeFooter({ onSignIn }) {
  return (
    <footer className="home-footer">
      <div className="footer-dots" aria-hidden="true" />

      <div className="footer-tagline">
        <h2>
          Go find <em>your people.</em>
        </h2>
        <button type="button" className="hero-signin" onClick={onSignIn}>
          Sign in to get started
        </button>
      </div>

      <div className="footer-grid">
        <div className="footer-brand">
          <p className="footer-brand-wordmark">RVibe</p>
          <p>Everything happening across RVU&apos;s clubs, in one place.</p>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">Explore</p>
          <Link to="/events">Upcoming events</Link>
          <button type="button" onClick={onSignIn}>
            Sign in
          </button>
        </div>

        <div className="footer-col footer-col-about">
          <p className="footer-col-title">About</p>
          <p className="footer-about-text">
            An unofficial, student-built project made to make finding and
            registering for RVU club events easier — a small community
            service, not affiliated with or endorsed by RV University.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <span>RVibe — unofficial, student-run</span>
        <span>&copy; {new Date().getFullYear()}</span>
      </div>
    </footer>
  )
}

export default function Home() {
  const { user, isAnyClubAdmin, signInWithGoogle } = useAuth()

  if (user) return <Navigate to={isAnyClubAdmin ? '/admin' : '/events'} replace />

  return (
    <div className="page home-page">
      <section className="home-hero">
        <HeroScatter />
        <div className="hero-content">
          <p className="home-eyebrow">RV UNIVERSITY / BENGALURU / CAMPUS LIFE</p>
          <h1 className="home-title"><span className="title-rv">RV</span><em>ibe.</em></h1>
          <p className="home-sub">Everything happening across RVU&apos;s clubs, in one place.</p>
          <div className="hero-actions">
            <button type="button" className="hero-signin" onClick={() => signInWithGoogle()}>Sign in to get started</button>
          </div>
        </div>
      </section>

      <section className="home-manifesto">
        <h2 className="manifesto-quote">The syllabus ends in four years. The people you meet in a club don&apos;t.</h2>
        <p>Discover the people, clubs and gatherings that make RVU move. Free to attend. Open to everyone on campus.</p>
      </section>

      <StoryScroller />

      <section className="home-gate">
        <div className="home-gate-photo">
          <img src="/story/gate.jpg" alt="RV University main gate" loading="lazy" />
        </div>
        <div className="home-gate-text">
          <p className="home-eyebrow">On campus</p>
          <h2>Every event on this page happens somewhere real.</h2>
          <p>From A Block to the amphitheatre, RVU&apos;s campus is where clubs actually meet, build, rehearse and compete. Browse what&apos;s on and go see it in person.</p>
          <Link to="/events" className="button-primary">See what&apos;s on</Link>
        </div>
      </section>

      <StatsStrip />
      <HomeFooter onSignIn={() => signInWithGoogle()} />
    </div>
  )
}
