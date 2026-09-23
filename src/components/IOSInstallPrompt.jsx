import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isIOS, isStandalone } from '../utils/pushNotifications'

const STORAGE_KEY = 'rvibe_ios_install_dismissed'

// Apple's share glyph -- the students are looking for this exact shape in Safari's toolbar.
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    </svg>
  )
}

export default function IOSInstallPrompt() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY))
    } catch {
      return false
    }
  })

  // Only worth showing to a signed-in iPhone user who hasn't installed yet --
  // there is no API to trigger the install, so this is purely instructional.
  if (dismissed || !user || !isIOS() || isStandalone()) return null

  function handleDismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Private mode -- it just reappears next session, which is acceptable.
    }
    setDismissed(true)
  }

  return (
    <div className="ios-install-prompt" role="complementary">
      <div className="ios-install-prompt-body">
        <p className="ios-install-prompt-title">Get notified about new events</p>
        <p className="ios-install-prompt-steps">
          Tap <ShareIcon /> below, then <strong>Add to Home Screen</strong>. Open RVibe from that
          icon to turn notifications on.
        </p>
      </div>
      <button type="button" onClick={handleDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
