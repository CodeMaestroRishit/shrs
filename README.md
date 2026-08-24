# Campus Events

College Club & Events Platform. Students browse events; club admins manage
events for the clubs they administer. React (Vite) frontend, Supabase
(Auth + Postgres + Storage) backend.

## Stack

- Frontend: React + Vite, deployed to Vercel
- Backend: Supabase (Auth, Postgres, Storage)
- Auth: Google OAuth via Supabase Auth, restricted to a college email domain
- Authorization boundary: Postgres Row Level Security — the frontend route
  guards are a UX convenience only, not the real security boundary

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, enable **Google** and fill in your
   Google OAuth client ID/secret (create one in Google Cloud Console with an
   authorized redirect URI of `https://<your-project-ref>.supabase.co/auth/v1/callback`).
3. In **Authentication → URL Configuration**, add your local dev URL
   (`http://localhost:5173`) and your Vercel URL to the redirect allow list.

## 2. Run the migrations

The SQL in `supabase/migrations/` is plain Postgres SQL, run in order:

- `0001_schema.sql` — profiles, clubs, club_admins, events tables
- `0002_auth_domain_restriction.sql` — allow-listed email domains + a trigger
  that creates a profile on signup and **rejects sign-ins outside the
  allowed domain at the database level**
- `0003_rls_policies.sql` — Row Level Security policies
- `0004_storage.sql` — the `event-posters` storage bucket + its policies

Run them via the Supabase SQL Editor (paste each file's contents in order),
or with the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

**Set your college's email domain** before going live — the migration seeds
`allowed_email_domains` with the placeholder `rvu.edu.in`. Change it in the
SQL Editor:

```sql
update public.allowed_email_domains set domain = 'yourcollege.edu' where domain = 'rvu.edu.in';
-- or, to allow more than one domain:
insert into public.allowed_email_domains (domain) values ('yourcollege.edu');
```

### Seeding clubs and admins

There's no self-serve "create a club" flow in the MVP. Add clubs and
promote users to club admin directly via the SQL Editor:

```sql
insert into public.clubs (name, description) values ('Robotics Club', 'Builds robots.');

-- after the user has signed in at least once (so their profiles row exists):
insert into public.club_admins (user_id, club_id)
values (
  (select id from public.profiles where email = 'admin@yourcollege.edu'),
  (select id from public.clubs where name = 'Robotics Club')
);
```

## 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in from **Project Settings → API**:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Never commit `.env` (already gitignored) and never hardcode these values —
the anon key is safe to ship to the browser only because RLS enforces the
real permissions.

## 4. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`.

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel (framework preset: Vite).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel
   environment variables (Project Settings → Environment Variables).
4. Add the deployed Vercel URL to Supabase's Auth redirect allow list
   (Authentication → URL Configuration).
5. Deploy.

## How authorization actually works

- `profiles.role` is informational only — it is never checked to authorize
  a write.
- The real check is: "is there a row in `club_admins` linking this
  `auth.uid()` to this `club_id`?" This is enforced in RLS policies on
  `events`, `clubs`, and `storage.objects` (poster uploads), so it holds
  even if the frontend is bypassed entirely.
- Domain restriction is enforced by a trigger on `auth.users`, not by the
  frontend — a disallowed sign-in fails before any session or profile is
  created.

## Testing that the database actually enforces this

`supabase/tests/` has two scripts, since fully testing this needs both an
anonymous client and a real authenticated club admin — and simulating the
latter without a live Google sign-in has to happen at the SQL level:

- **`rls_smoke_test.sql`** — the main test. Paste it into the Supabase SQL
  Editor and run it after the four migrations are applied. It creates
  throwaway clubs/users/events, impersonates anon / a club admin / a
  non-admin student / a different club's admin (the same role + JWT-claim
  impersonation technique [Supabase's own RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security#testing-policies)
  recommend), and asserts test things like "admin A can edit their own event",
  "admin A cannot touch admin B's event", "a signed-out visitor can read
  but not write". Everything runs inside one transaction that ends in
  `rollback;`, so it never touches your real data. Read the PASS/FAIL table
  in the Results pane.
- **`anon_access_check.mjs`** — a small Node script hitting the project
  with only the public anon key (what the deployed frontend uses), to
  confirm anonymous reads work and anonymous writes are rejected:
  ```bash
  VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node supabase/tests/anon_access_check.mjs
  ```

Run the `.sql` one first — it's the one that actually exercises the
club-admin write paths.

## Designed for future phases (not built yet)

- **Transactional email**: no SMTP is wired up. When needed, add a
  Supabase Database Webhook on `events` (or a new `notifications` table)
  that calls a Supabase Edge Function — no schema changes required here.
- **RSVPs**: `events.id` is a stable uuid primary key, so an `rsvps` table
  (`event_id → events.id`, `user_id → profiles.id`) can be added later
  without reshaping `events`.
- Search/categories/realtime were intentionally left out of this MVP.

## Project structure

```
src/
  lib/supabaseClient.js   Supabase client, reads env vars
  context/AuthContext.jsx Session, profile, and admin-club-ids state
  components/             EventCard, EventFilters, Navbar, ImageUpload, ProtectedRoute
  pages/                  EventsDiscovery, EventDetail, ClubProfile, AdminDashboard, EventForm, Login
supabase/migrations/      SQL migrations, run in numeric order
```
