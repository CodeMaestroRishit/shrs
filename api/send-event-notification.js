import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Tuned so a large fan-out still finishes inside Vercel's function timeout
// without opening hundreds of sockets at once.
const BATCH_SIZE = 50

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // This endpoint can push to every student, so it is only ever callable by the
  // database trigger holding the shared secret -- never from a browser.
  const expected = process.env.PUSH_WEBHOOK_SECRET
  const provided = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!expected || provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, SUPABASE_SERVICE_ROLE_KEY } = process.env

  // The frontend already defines VITE_SUPABASE_URL and it is the same value, so
  // accept either rather than requiring the URL to be entered twice. (The VITE_
  // prefix only affects Vite's build-time inlining; every env var is readable
  // here at runtime.)
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return res.status(500).json({ error: 'VAPID keys are not configured' })
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials are not configured' })
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  const { event_id: eventId, title } = req.body || {}
  if (!eventId || !title) {
    return res.status(400).json({ error: 'event_id and title are required' })
  }

  // Service role: this needs to read every subscriber's row, which RLS
  // deliberately prevents any individual user from doing.
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (error) {
    return res.status(500).json({ error: error.message })
  }
  if (!subscriptions?.length) {
    return res.status(200).json({ sent: 0, failed: 0, note: 'no subscribers' })
  }

  const payload = JSON.stringify({
    title: 'New event on RVibe',
    body: title,
    url: `/events/${eventId}`,
  })

  let sent = 0
  let failed = 0
  const staleEndpoints = []

  for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
    const batch = subscriptions.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(
      batch.map((row) =>
        webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          payload
        )
      )
    )

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        sent += 1
        return
      }
      failed += 1
      // 404/410 mean the browser threw this subscription away (app uninstalled,
      // site data cleared). Collect them so the table self-cleans.
      const statusCode = result.reason?.statusCode
      if (statusCode === 404 || statusCode === 410) {
        staleEndpoints.push(batch[index].endpoint)
      }
    })
  }

  if (staleEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints)
  }

  return res.status(200).json({ sent, failed, pruned: staleEndpoints.length })
}
