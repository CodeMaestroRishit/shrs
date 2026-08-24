-- RLS / schema smoke test for the Campus Events platform.
--
-- Run this in the Supabase SQL Editor (or `psql` connected to your project)
-- AFTER the four migrations in supabase/migrations/ have been applied.
--
-- It creates synthetic clubs/users/events, exercises every RLS policy by
-- impersonating anon / authenticated roles (the same technique Supabase's
-- own docs recommend for testing RLS: https://supabase.com/docs/guides/database/postgres/row-level-security#testing-policies),
-- and prints a PASS/FAIL table. The whole thing runs inside one transaction
-- that is ROLLED BACK at the end, so nothing it creates is kept and your
-- real data is never touched.
--
-- Read the final SELECT's output in the "Results" pane after running.

begin;

create temp table test_fixtures (key text primary key, value uuid);
create temp table test_results (seq serial primary key, name text not null, passed boolean not null, detail text);

-- =====================================================================
-- Fixtures (run as the SQL Editor's own role, which bypasses RLS)
-- =====================================================================
do $$
declare
  v_club_a uuid := gen_random_uuid();
  v_club_b uuid := gen_random_uuid();
  v_admin_a uuid := gen_random_uuid();
  v_admin_b uuid := gen_random_uuid();
  v_student uuid := gen_random_uuid();
  v_event_a uuid := gen_random_uuid();
  v_event_b uuid := gen_random_uuid();
  v_allowed_domain text;
begin
  select domain into v_allowed_domain from public.allowed_email_domains limit 1;
  if v_allowed_domain is null then
    raise exception 'No row in public.allowed_email_domains -- run migration 0002 first.';
  end if;

  insert into public.clubs (id, name, description) values
    (v_club_a, '__TEST__ Club A', 'RLS smoke test fixture'),
    (v_club_b, '__TEST__ Club B', 'RLS smoke test fixture');

  -- Inserting into auth.users exercises the real signup trigger (0002) --
  -- it will auto-create the matching profiles row for each of these.
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values
    ('00000000-0000-0000-0000-000000000000', v_admin_a, 'authenticated', 'authenticated', '__test_admin_a@' || v_allowed_domain, crypt('test-password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Admin A"}'),
    ('00000000-0000-0000-0000-000000000000', v_admin_b, 'authenticated', 'authenticated', '__test_admin_b@' || v_allowed_domain, crypt('test-password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Admin B"}'),
    ('00000000-0000-0000-0000-000000000000', v_student, 'authenticated', 'authenticated', '__test_student@' || v_allowed_domain, crypt('test-password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Student"}');

  insert into public.club_admins (user_id, club_id) values
    (v_admin_a, v_club_a),
    (v_admin_b, v_club_b);

  insert into public.events (id, club_id, title, start_time, location) values
    (v_event_a, v_club_a, '__TEST__ Club A Event', now() + interval '1 day', 'Test Hall A'),
    (v_event_b, v_club_b, '__TEST__ Club B Event', now() + interval '1 day', 'Test Hall B');

  insert into test_fixtures (key, value) values
    ('club_a', v_club_a), ('club_b', v_club_b),
    ('admin_a', v_admin_a), ('admin_b', v_admin_b), ('student', v_student),
    ('event_a', v_event_a), ('event_b', v_event_b);
end $$;

-- =====================================================================
-- Test 1: domain-restricted signup trigger rejects a disallowed domain
-- =====================================================================
do $$
declare
  v_rejected boolean := false;
  v_detail text;
begin
  begin
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', '__test_outsider@not-allowed.example', crypt('x', gen_salt('bf')), now(), now(), now());
  exception when others then
    v_rejected := true;
    v_detail := sqlerrm;
  end;

  insert into test_results (name, passed, detail) values (
    'Signup with disallowed domain is rejected by the auth.users trigger',
    v_rejected,
    coalesce(v_detail, 'no exception was raised -- the row was allowed in')
  );
end $$;

-- =====================================================================
-- Test 2: allowed-domain signup auto-creates a profiles row
-- =====================================================================
do $$
declare
  v_admin_a uuid := (select value from test_fixtures where key = 'admin_a');
  v_found boolean;
begin
  select exists(select 1 from public.profiles where id = v_admin_a and email like '__test_admin_a@%') into v_found;
  insert into test_results (name, passed, detail) values (
    'Allowed-domain signup auto-creates a matching profiles row',
    v_found,
    case when v_found then 'profiles row present' else 'profiles row missing' end
  );
end $$;

-- =====================================================================
-- Become: anonymous visitor
-- =====================================================================
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);

do $$
declare
  v_event_a uuid := (select value from test_fixtures where key = 'event_a');
  v_visible boolean;
begin
  select exists(select 1 from public.events where id = v_event_a) into v_visible;
  insert into test_results (name, passed, detail) values (
    'Anonymous visitor can read events',
    v_visible,
    case when v_visible then 'test event visible' else 'test event NOT visible (should be public)' end
  );
end $$;

do $$
declare
  v_club_a uuid := (select value from test_fixtures where key = 'club_a');
  v_blocked boolean := false;
  v_detail text;
begin
  begin
    insert into public.events (club_id, title, start_time) values (v_club_a, '__TEST__ anon insert', now());
  exception when others then
    v_blocked := true;
    v_detail := sqlerrm;
  end;
  insert into test_results (name, passed, detail) values (
    'Anonymous visitor cannot insert events',
    v_blocked,
    coalesce(v_detail, 'insert unexpectedly succeeded')
  );
end $$;

-- =====================================================================
-- Become: admin_a (administers Club A only)
-- =====================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', (select value::text from test_fixtures where key = 'admin_a'), true);
select set_config('request.jwt.claims', (select json_build_object('sub', value, 'role', 'authenticated')::text from test_fixtures where key = 'admin_a'), true);

do $$
declare
  v_club_a uuid := (select value from test_fixtures where key = 'club_a');
  v_new_id uuid;
  v_ok boolean := false;
  v_detail text;
begin
  begin
    insert into public.events (club_id, title, start_time, location)
    values (v_club_a, '__TEST__ admin_a new event', now() + interval '2 days', 'Room 1')
    returning id into v_new_id;
    v_ok := true;
    v_detail := 'inserted event ' || v_new_id;
  exception when others then
    v_detail := sqlerrm;
  end;
  if v_ok then
    insert into test_fixtures (key, value) values ('admin_a_new_event', v_new_id);
  end if;
  insert into test_results (name, passed, detail) values (
    'Club admin can insert an event for their own club',
    v_ok,
    v_detail
  );
end $$;

do $$
declare
  v_club_b uuid := (select value from test_fixtures where key = 'club_b');
  v_blocked boolean := false;
  v_detail text;
begin
  begin
    insert into public.events (club_id, title, start_time) values (v_club_b, '__TEST__ admin_a cross-club insert', now());
  exception when others then
    v_blocked := true;
    v_detail := sqlerrm;
  end;
  insert into test_results (name, passed, detail) values (
    'Club admin cannot insert an event for a club they do not administer',
    v_blocked,
    coalesce(v_detail, 'cross-club insert unexpectedly succeeded')
  );
end $$;

do $$
declare
  v_event_a uuid := (select value from test_fixtures where key = 'event_a');
  v_rows int;
begin
  update public.events set title = '__TEST__ Club A Event (updated)' where id = v_event_a;
  get diagnostics v_rows = row_count;
  insert into test_results (name, passed, detail) values (
    'Club admin can update their own club''s event',
    v_rows = 1,
    v_rows || ' row(s) updated (expected 1)'
  );
end $$;

do $$
declare
  v_event_b uuid := (select value from test_fixtures where key = 'event_b');
  v_rows int;
begin
  update public.events set title = '__TEST__ tampered' where id = v_event_b;
  get diagnostics v_rows = row_count;
  insert into test_results (name, passed, detail) values (
    'Club admin cannot update another club''s event',
    v_rows = 0,
    v_rows || ' row(s) updated (expected 0)'
  );
end $$;

do $$
declare
  v_event_b uuid := (select value from test_fixtures where key = 'event_b');
  v_rows int;
begin
  delete from public.events where id = v_event_b;
  get diagnostics v_rows = row_count;
  insert into test_results (name, passed, detail) values (
    'Club admin cannot delete another club''s event',
    v_rows = 0,
    v_rows || ' row(s) deleted (expected 0)'
  );
end $$;

do $$
declare
  v_new_event uuid := (select value from test_fixtures where key = 'admin_a_new_event');
  v_rows int;
begin
  delete from public.events where id = v_new_event;
  get diagnostics v_rows = row_count;
  insert into test_results (name, passed, detail) values (
    'Club admin can delete their own club''s event',
    v_rows = 1,
    v_rows || ' row(s) deleted (expected 1)'
  );
end $$;

do $$
declare
  v_admin_a uuid := (select value from test_fixtures where key = 'admin_a');
  v_rows int;
begin
  update public.profiles set name = 'Updated Name' where id = v_admin_a;
  get diagnostics v_rows = row_count;
  insert into test_results (name, passed, detail) values (
    'A user can update their own profile',
    v_rows = 1,
    v_rows || ' row(s) updated (expected 1)'
  );
end $$;

do $$
declare
  v_student uuid := (select value from test_fixtures where key = 'student');
  v_rows int;
begin
  update public.profiles set name = 'Hijacked' where id = v_student;
  get diagnostics v_rows = row_count;
  insert into test_results (name, passed, detail) values (
    'A user cannot update another user''s profile',
    v_rows = 0,
    v_rows || ' row(s) updated (expected 0)'
  );
end $$;

do $$
declare
  v_admin_b uuid := (select value from test_fixtures where key = 'admin_b');
  v_count int;
begin
  select count(*) into v_count from public.club_admins where user_id = v_admin_b;
  insert into test_results (name, passed, detail) values (
    'A user cannot see another user''s club_admins rows',
    v_count = 0,
    v_count || ' row(s) visible (expected 0)'
  );
end $$;

-- =====================================================================
-- Become: student (authenticated, no club_admins rows)
-- =====================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', (select value::text from test_fixtures where key = 'student'), true);
select set_config('request.jwt.claims', (select json_build_object('sub', value, 'role', 'authenticated')::text from test_fixtures where key = 'student'), true);

do $$
declare
  v_club_a uuid := (select value from test_fixtures where key = 'club_a');
  v_blocked boolean := false;
  v_detail text;
begin
  begin
    insert into public.events (club_id, title, start_time) values (v_club_a, '__TEST__ student insert', now());
  exception when others then
    v_blocked := true;
    v_detail := sqlerrm;
  end;
  insert into test_results (name, passed, detail) values (
    'A signed-in student (no club_admins row) cannot insert events',
    v_blocked,
    coalesce(v_detail, 'insert unexpectedly succeeded')
  );
end $$;

-- =====================================================================
-- Storage: event-posters bucket policies (skipped gracefully if the
-- storage schema on this project differs from what 0004 assumes)
-- =====================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', (select value::text from test_fixtures where key = 'admin_a'), true);
select set_config('request.jwt.claims', (select json_build_object('sub', value, 'role', 'authenticated')::text from test_fixtures where key = 'admin_a'), true);

do $$
declare
  v_club_a uuid := (select value from test_fixtures where key = 'club_a');
  v_club_b uuid := (select value from test_fixtures where key = 'club_b');
  v_ok boolean := false;
  v_detail text;
begin
  begin
    insert into storage.objects (bucket_id, name) values ('event-posters', v_club_a::text || '/__test.png');
    v_ok := true;
  exception when others then
    v_detail := sqlerrm;
  end;
  insert into test_results (name, passed, detail) values (
    'Club admin can upload a poster under their own club''s storage path',
    v_ok,
    coalesce(v_detail, 'uploaded ok')
  );

  v_ok := false;
  v_detail := null;
  begin
    insert into storage.objects (bucket_id, name) values ('event-posters', v_club_b::text || '/__test.png');
  exception when others then
    v_ok := true;
    v_detail := sqlerrm;
  end;
  insert into test_results (name, passed, detail) values (
    'Club admin cannot upload a poster under another club''s storage path',
    v_ok,
    coalesce(v_detail, 'cross-club upload unexpectedly succeeded')
  );
end $$;

-- =====================================================================
-- Results
-- =====================================================================
select
  seq,
  name,
  case when passed then 'PASS' else 'FAIL' end as result,
  detail
from test_results
order by seq;

select
  count(*) filter (where passed) as passed,
  count(*) filter (where not passed) as failed
from test_results;

-- Nothing above is kept -- fixtures, events, profiles, and storage rows
-- created by this script are all undone here.
rollback;
