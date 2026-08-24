// Read-side smoke test, run from the client's point of view with only the
// public anon key (the same credential the deployed frontend uses).
//
// Usage:
//   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node supabase/tests/anon_access_check.mjs
//
// It checks that:
//   - anonymous reads of clubs/events succeed (no RLS/permission error)
//   - anonymous writes to clubs/events are rejected by RLS
// It does not need Docker, a DB password, or a signed-in user, so it's a
// safe complement to supabase/tests/rls_smoke_test.sql (which covers the
// authenticated / club-admin side that needs a real JWT).

import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the environment first.')
  process.exit(1)
}

const supabase = createClient(url, key)
let failures = 0

function report(name, passed, detail) {
  console.log(`${passed ? 'PASS' : 'FAIL'} — ${name}${detail ? ` (${detail})` : ''}`)
  if (!passed) failures += 1
}

const { error: clubsReadError } = await supabase.from('clubs').select('id').limit(1)
report('anonymous can read clubs', !clubsReadError, clubsReadError?.message)

const { error: eventsReadError } = await supabase.from('events').select('id').limit(1)
report('anonymous can read events', !eventsReadError, eventsReadError?.message)

const { error: eventsWriteError } = await supabase
  .from('events')
  .insert({ club_id: '00000000-0000-0000-0000-000000000000', title: 'anon smoke test', start_time: new Date().toISOString() })
report('anonymous cannot insert events', Boolean(eventsWriteError), eventsWriteError?.message ?? 'insert unexpectedly succeeded')

const { error: clubsWriteError } = await supabase.from('clubs').insert({ name: 'anon smoke test club' })
report('anonymous cannot insert clubs', Boolean(clubsWriteError), clubsWriteError?.message ?? 'insert unexpectedly succeeded')

console.log(failures === 0 ? '\nAll anon-access checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
