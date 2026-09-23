import { supabase } from '../lib/supabaseClient'

// Trimmed because a value pasted into a hosting dashboard very easily picks up
// a trailing newline. That shifts the length by one, which silently breaks the
// padding maths below and makes atob() throw InvalidCharacterError.
const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim()

// The Push API wants the VAPID key as a Uint8Array, but it ships as URL-safe base64.
function urlBase64ToUint8Array(base64String) {
  // Strip any whitespace anywhere, not just the ends -- none is ever valid here.
  const clean = String(base64String).replace(/\s/g, '')
  const padding = '='.repeat((4 - (clean.length % 4)) % 4)
  const base64 = (clean + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const bytes = Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))

  // A P-256 public key is always 65 bytes; anything else means a truncated or
  // corrupted value, and failing here is clearer than a cryptic subscribe error.
  if (bytes.length !== 65) {
    throw new Error(`VAPID public key decoded to ${bytes.length} bytes, expected 65`)
  }
  return bytes
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  // iPadOS 13+ reports itself as a Mac, so the touch-point check catches iPads
  // that the user-agent string alone would miss.
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

// True once the site is running from a home-screen icon rather than a browser tab.
// On iOS this is the difference between push working and being unavailable entirely.
export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

// iOS only exposes the Push API to home-screen installs.
export function canUsePush() {
  if (!isPushSupported()) return false
  if (isIOS() && !isStandalone()) return false
  return true
}

export async function getExistingSubscription() {
  if (!isPushSupported()) return null
  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

// A browser subscription alone is not enough -- if the matching row is missing
// (a failed write, or a subscription created outside this flow) the server has
// no address to send to, so the bell must not claim to be on.
export async function isSubscriptionSynced(userId) {
  if (!userId) return false
  const subscription = await getExistingSubscription()
  if (!subscription) return false

  const { endpoint } = subscription.toJSON()
  const { data } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('endpoint', endpoint)
    .maybeSingle()

  return Boolean(data)
}

export async function subscribeToPush(userId) {
  if (!userId) throw new Error('You must be signed in to enable notifications.')
  if (!canUsePush()) throw new Error('Notifications are not available in this browser.')
  if (!VAPID_PUBLIC_KEY) throw new Error('Notifications are not configured yet.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notifications were blocked. You can re-enable them in your browser settings.')
  }

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()

  let subscription = existing
  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    } catch (err) {
      // Keep the underlying reason visible -- a generic message here makes this
      // impossible to diagnose when it fails on someone else's device.
      console.error('push subscribe failed:', err)
      const detail = err?.message ? ` (${err.name}: ${err.message})` : ''
      throw new Error(
        `Couldn't turn on notifications${detail}. Private browsing windows don't support them — try a normal window, and check notifications aren't blocked for this site.`
      )
    }
  }

  const { endpoint, keys } = subscription.toJSON()

  // Upsert on endpoint: the same browser re-subscribing should update its row,
  // not collide with the unique constraint.
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'endpoint' }
    )

  if (error) {
    // Don't leave a live browser subscription with no matching row to send to.
    await subscription.unsubscribe().catch(() => {})
    throw new Error(error.message)
  }

  return subscription
}

export async function unsubscribeFromPush(userId) {
  const subscription = await getExistingSubscription()
  if (!subscription) return

  const { endpoint } = subscription.toJSON()

  if (userId) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  }

  await subscription.unsubscribe().catch(() => {})
}
