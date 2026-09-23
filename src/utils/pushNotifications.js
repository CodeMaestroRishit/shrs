import { supabase } from '../lib/supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// The Push API wants the VAPID key as a Uint8Array, but it ships as URL-safe base64.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
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
      // Raw messages here are unhelpful ("Registration failed - permission
      // denied"), and this also fires in private/incognito windows where
      // Chrome disables the Push API with no way to feature-detect it.
      throw new Error(
        "Couldn't turn on notifications. Private browsing windows don't support them — try a normal window, and check notifications aren't blocked for this site in your browser settings."
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
