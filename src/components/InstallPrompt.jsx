import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isIOS, isStandalone } from '../utils/pushNotifications'

const STORAGE_KEY = 'rvibe_ios_install_dismissed'

// Apple's share glyph -- students are looking for this exact shape in Safari's toolbar.
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    </svg>
  )
}

export default function InstallPrompt() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY))
    } catch {
      return false
    }
  })
  // Chrome hands us the install event; iOS has no equivalent, hence two paths.
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    function onBeforeInstall(e) {
      // Prevent Chrome's own mini-infobar so we can offer install in context.
      e.preventDefault()
      setDeferredPrompt(e)
    }
    function onInstalled() {
      setDeferredPrompt(null)
      setDismissed(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const iosNeedsInstall = isIOS() && !isStandalone()
  const canPromptInstall = Boolean(deferredPrompt)

  if (dismissed || !user || isStandalone()) return null
  if (!iosNeedsInstall && !canPromptInstall) return null

  function handleDismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Private mode -- it reappears next session, which is acceptable.
    }
    setDismissed(true)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice.catch(() => {})
    // The event can only be used once.
    setDeferredPrompt(null)
  }

  return (
    <div className="ios-install-prompt" role="complementary">
      <div className="ios-install-prompt-body">
        <p className="ios-install-prompt-title">Get notified about new events</p>
        {iosNeedsInstall ? (
          <p className="ios-install-prompt-steps">
            Tap <ShareIcon /> below, then <strong>Add to Home Screen</strong>. Open RVibe from that
            icon to turn notifications on.
          </p>
        ) : (
          <p className="ios-install-prompt-steps">
            Install RVibe to keep getting event alerts even when your browser is closed.
          </p>
        )}
      </div>

      {canPromptInstall && !iosNeedsInstall && (
        <button type="button" className="install-prompt-cta" onClick={handleInstall}>
          Install
        </button>
      )}

      <button type="button" onClick={handleDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
