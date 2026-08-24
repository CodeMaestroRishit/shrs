-- Core schema for the College Club & Events Platform
-- Tables: profiles, clubs, club_admins, events

create extension if not exists pgcrypto;

-- profiles.role is informational only (shown in UI, defaults new users to
-- 'student'). It is NEVER used to authorize writes -- actual admin
-- permissions are always resolved through club_admins. See 0003_rls_policies.sql.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'student' check (role in ('student', 'club_admin')),
  created_at timestamptz not null default now()
);

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.club_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, club_id)
);

-- start_time/end_time as timestamptz (not a single "date") so future
-- filtering/sorting and an eventual `rsvps` table (rsvps.event_id ->
-- events.id) both work without reshaping this table.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz,
  created_at timestamptz not null default now()
);

create index events_club_id_idx on public.events (club_id);
create index events_start_time_idx on public.events (start_time);
create index club_admins_user_id_idx on public.club_admins (user_id);
create index club_admins_club_id_idx on public.club_admins (club_id);
