import { useEffect, useState } from 'react'

const STORAGE_KEY = 'rvibe_seen_intro'

export default function Preloader() {
  const [visible, setVisible] = useState(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
      return !localStorage.getItem(STORAGE_KEY)
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!visible) return

    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Storage unavailable (private mode etc.) — the animation still plays once for this load.
    }

    const timer = setTimeout(() => setVisible(false), 1500)
    return () => clearTimeout(timer)
  }, [visible])

  if (!visible) return null

  return (
    <div className="preloader" aria-hidden="true">
      <div className="preloader-text">
        <span className="preloader-eyebrow">Welcome to</span>
        <span className="preloader-vibe">Our vibe.</span>
      </div>
    </div>
  )
}
