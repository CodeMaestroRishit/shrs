# Database implementation & testing notes

This documents what the schema/RLS layer actually does, how we tested it,
and the bugs we hit along the way — written so it's easy to explain out
loud, not just to run.

## 1. The schema, and why it's shaped this way

Four tables (`supabase/migrations/0001_schema.sql`):

```
profiles      id (= auth.users.id), email, name, role, created_at
clubs         id, name, description, logo_url
club_admins   id, user_id -> profiles, club_id -> clubs
events        id, club_id -> clubs, title, description, image_url,
              location, start_time, end_time
```

The one design decision worth being able to explain: **`profiles.role` is
informational only.** It's never read by any RLS policy or any write path.
The actual question "can this user edit this event?" is always answered by
one thing: *does a row exist in `club_admins` linking this `auth.uid()` to
this `club_id`?* Putting authorization in a join table instead of a status
column means:

- one person can admin multiple clubs (or none) without any schema change
- adding/removing an admin is a plain row insert/delete, no code deploy
- it composes cleanly with RLS: every policy is just an `exists(select 1
  from club_admins where ...)` subquery, so there's exactly one source of
  truth instead of authorization logic scattered across the app and the DB

## 2. Enforcement layers

**A trigger, not application code, restricts sign-up domain.**
`0002_auth_domain_restriction.sql` adds an `AFTER INSERT ON auth.users`
trigger (`SECURITY DEFINER`, so it can write to `public.profiles` despite
RLS). It checks the new user's email domain against
`public.allowed_email_domains`; if it's not there, it `RAISE EXCEPTION`s,
which aborts the `INSERT` — so a disallowed sign-up never even gets a
`auth.users` row, let alone a session. If it's allowed, the same trigger
inserts the matching `profiles` row. This is why the frontend can't be
tricked into letting someone in: the rejection happens before any session
exists, at the database transaction level.

**RLS policies are the only thing standing between the anon key and your
data** (`0003_rls_policies.sql`, `0004_storage.sql`). The anon/publishable
key is deliberately safe to ship in client JS — Supabase's whole model is
that the key identifies *an app*, and RLS policies (keyed off `auth.uid()`,
which comes from the caller's JWT) decide what that specific caller can
actually touch. Summary of what's enforced:

| Table | Read | Write |
|---|---|---|
| `clubs` | public | admins of that club can update; nobody can insert/delete via the API (seeded manually) |
| `events` | public | only `club_admins` for that `event.club_id` |
| `profiles` | self only | self only |
| `club_admins` | self only (can't see who else admins a club) | nobody via the API (seeded manually) |
| `storage.objects` (posters) | public | only `club_admins` for the club_id encoded in the file path |

## 3. How we tested it without a real login

The hard part: RLS policies check `auth.uid()`, which only exists inside a
real authenticated request. There's no way to fire one of those from a
plain SQL script — you'd need an actual Google OAuth session. Supabase's
own docs solve this with a technique that works entirely at the SQL level:
[testing policies by impersonating a role](https://supabase.com/docs/guides/database/postgres/row-level-security#testing-policies).

`auth.uid()` is defined (roughly) as:

```sql
select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid
```

It just reads a Postgres session variable that PostgREST normally
populates from the caller's JWT before running their query. Nothing stops
*us* from setting that variable ourselves and then switching to the
`anon` or `authenticated` Postgres role with `SET ROLE`:

```sql
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '<uuid>', 'role', 'authenticated')::text, true);
```

From that point on, for the rest of the transaction, every query we run is
evaluated by RLS exactly as if that user had made the request over the
API — because as far as `auth.uid()` and the effective role are concerned,
it did. `rls_smoke_test.sql` uses this to become four different personas
in turn (anonymous visitor → admin of Club A → admin of Club B → a signed-
in student with no admin rights) and fire real `insert`/`update`/`delete`
statements as each one, asserting what should and shouldn't succeed.

The whole script runs inside `begin; ... rollback;`, so none of the
synthetic clubs/users/events it creates are ever actually kept — safe to
run against the real production project.

## 4. Two real bugs the test run surfaced (not false positives)

These were genuine `42501 permission denied` errors from Postgres, caught
*because* we tried to actually exercise the impersonation technique end to
end rather than trusting the RLS policy SQL by inspection:

1. **Temp tables aren't visible to a role you `SET ROLE` into.**
   `test_fixtures`/`test_results` were created by the SQL Editor's own
   connecting role. The moment the script did `set local role anon`, that
   role had zero privileges on those temp tables — table ownership doesn't
   transfer or share just because you're in the same transaction. Fix:
   explicit `grant select, insert, update, delete on test_fixtures to
   anon, authenticated;` (and same for `test_results`) issued *before* any
   `set local role`.

2. **A `serial` column is backed by its own sequence object.** Granting
   `insert` on `test_results` wasn't enough to let `anon`/`authenticated`
   insert into it, because generating the next value for the `seq` column
   requires separately using its sequence (`test_results_seq_seq`), which
   has its own privilege grant, independent of the table's. Fix: `grant
   usage, select on all sequences in schema pg_temp to anon,
   authenticated;`.

Both are Postgres privilege-model quirks around temp objects and
identity/serial columns — worth knowing generally, not specific to
Supabase or RLS.

## 5. The actual false positives

Separately, the IDE's inline SQL diagnostics threw syntax errors on:

- `alter table ... enable row level security;`
- `declare v_club_b uuid := gen_random_uuid();`
- `grant usage, select on all sequences in schema pg_temp to ...;`

All three are valid, ordinary Postgres/PL-pgSQL. The diagnostics were
false positives from a generic SQL linter that isn't Postgres-dialect-
aware (it appeared to be parsing against something closer to T-SQL, going
by the specific error codes it raised, like expecting `ALTTAB_EN_...`
tokens that only exist in SQL Server's grammar). The tell: the queries ran
correctly in the actual Postgres target (Supabase's SQL Editor) despite
the IDE flagging them — the IDE's static check and the real database
disagreeing is the signal that it's the linter's dialect assumption at
fault, not the SQL.

## 6. Final result

All 16 assertions in `rls_smoke_test.sql` passed on the live project:

- domain-restricted signup rejects outsiders and accepts + auto-profiles allowed domains
- anonymous visitors can read but not write `events`
- a club admin can insert/update/delete their own club's events, and is
  blocked from all three on another club's events
- a signed-in user with no `club_admins` row can't write anything
- profile updates are self-only
- `club_admins` rows are invisible to everyone except the user they belong to
- poster uploads are accepted for an admin's own club's storage path and
  rejected for another club's

`anon_access_check.mjs` separately confirms the same read/write boundary
from the actual client side, using only the public anon key over the real
REST API (no simulated roles) — the two together cover both "does the
policy logic work" (SQL-level) and "does it actually hold over the real
API surface the frontend uses" (client-level).
