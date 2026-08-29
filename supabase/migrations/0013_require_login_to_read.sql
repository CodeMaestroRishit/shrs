-- Three gaps closed:
--
-- 1. events/clubs SELECT policies still allowed `anon` -- a leftover from
--    when browsing didn't require login. The app now gates /events behind
--    sign-in (see ProtectedRoute), but the database itself still let
--    anyone read every event/club directly via the REST API using the
--    public anon key. Restrict both to `authenticated` so the database
--    actually enforces what the app now promises.
--
-- 2. The public landing page's stats strip (Home.jsx, rendered only for
--    logged-out visitors) queries clubs/events counts directly, so locking
--    those tables to `authenticated` would silently break it. Give it two
--    count-only functions instead -- same pattern as get_student_count():
--    the aggregate number is not sensitive, individual rows are never
--    exposed, and the underlying tables stay authenticated-only.
--
-- 3. expire_past_event_posters() had no execute restriction. Postgres
--    grants EXECUTE to PUBLIC by default on new functions, so any client
--    (anon or authenticated) could call it early via
--    supabase.rpc('expire_past_event_posters'). Not dangerous -- it only
--    touches posters already 48h past -- but nothing client-side should
--    be able to trigger it, so revoke it explicitly.

alter policy "clubs are publicly readable" on public.clubs
  rename to "clubs are readable by signed-in users";
alter policy "clubs are readable by signed-in users" on public.clubs
  to authenticated;

alter policy "events are publicly readable" on public.events
  rename to "events are readable by signed-in users";
alter policy "events are readable by signed-in users" on public.events
  to authenticated;

create or replace function public.get_club_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer from public.clubs;
$$;

create or replace function public.get_event_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer from public.events;
$$;

grant execute on function public.get_club_count() to anon, authenticated;
grant execute on function public.get_event_count() to anon, authenticated;

revoke execute on function public.expire_past_event_posters()
  from public, anon, authenticated;
