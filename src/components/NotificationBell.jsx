import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  canUsePush,
  getExistingSubscription,
  isIOS,
  isPushSupported,
  isStandalone,
  subscribeToPush,
  unsubscribeFromPush,
} from '../utils/pushNotifications'

function BellIcon({ enabled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill={enabled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={enabled ? '0' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getExistingSubscription().then((sub) => {
      if (!cancelled) setEnabled(Boolean(sub))
    })
    return () => {
      cancelled = true
    }
  }, [user])

  // Signed-out visitors have nothing to subscribe, and browsers with no Push
  // API at all (older Safari, some in-app webviews) get nothing to click.
  if (!user || !isPushSupported()) return null

  async function handleClick() {
    setMessage(null)

    // On iPhone the Push API simply isn't exposed to browser tabs, so explain
    // the one path that works instead of failing silently.
    if (isIOS() && !isStandalone()) {
      setMessage('On iPhone, tap Share then "Add to Home Screen", then open RVibe from that icon to turn on notifications.')
      return
    }

    if (!canUsePush()) {
      setMessage('Notifications are not available in this browser.')
      return
    }

    setBusy(true)
    try {
      if (enabled) {
        await unsubscribeFromPush(user.id)
        setEnabled(false)
        setMessage('Notifications turned off.')
      } else {
        await subscribeToPush(user.id)
        setEnabled(true)
        setMessage("You're in. We'll ping you when a new event goes up.")
      }
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="notification-bell-wrap">
      <button
        type="button"
        className={`notification-bell${enabled ? ' is-enabled' : ''}`}
        onClick={handleClick}
        disabled={busy}
        aria-label={enabled ? 'Turn off event notifications' : 'Turn on event notifications'}
        title={enabled ? 'Notifications on' : 'Get notified about new events'}
      >
        <BellIcon enabled={enabled} />
      </button>

      {message && (
        <div className="notification-bell-toast" role="status">
          {message}
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
