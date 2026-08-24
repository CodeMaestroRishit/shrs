-- Row Level Security. This is the real permission boundary for the app --
-- the frontend route guards are only a UX convenience on top of this.

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_admins enable row level security;
alter table public.events enable row level security;

-- profiles: a user can only see and modify their own row. Inserts happen
-- exclusively through the SECURITY DEFINER trigger in 0002, so there is no
-- insert policy for authenticated clients.
create policy "profiles are self-readable"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are self-updatable"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- clubs: publicly readable (students browse without logging in). Creating
-- new clubs / assigning admins is an out-of-band operation done via the
-- Supabase SQL editor for the MVP (see README) -- there is deliberately no
-- insert policy for authenticated clients. Existing club admins may update
-- their own club's profile info.
create policy "clubs are publicly readable"
  on public.clubs for select
  to anon, authenticated
  using (true);

create policy "club admins can update their club"
  on public.clubs for update
  using (
    exists (
      select 1 from public.club_admins ca
      where ca.club_id = clubs.id and ca.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.club_admins ca
      where ca.club_id = clubs.id and ca.user_id = auth.uid()
    )
  );

-- club_admins: a user can see which clubs they administer. Membership is
-- managed out-of-band (Supabase SQL editor / dashboard) for the MVP, so
-- there are no insert/update/delete policies for authenticated clients.
create policy "users can read their own admin memberships"
  on public.club_admins for select
  using (auth.uid() = user_id);

-- events: publicly readable, including anonymous visitors. Writes are only
-- allowed for a user listed in club_admins for that event's club_id --
-- this is the actual authorization check for the "club admin" role,
-- resolved from the database on every write.
create policy "events are publicly readable"
  on public.events for select
  to anon, authenticated
  using (true);

create policy "club admins can insert their club's events"
  on public.events for insert
  with check (
    exists (
      select 1 from public.club_admins ca
      where ca.club_id = events.club_id and ca.user_id = auth.uid()
    )
  );

create policy "club admins can update their club's events"
  on public.events for update
  using (
    exists (
      select 1 from public.club_admins ca
      where ca.club_id = events.club_id and ca.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.club_admins ca
      where ca.club_id = events.club_id and ca.user_id = auth.uid()
    )
  );

create policy "club admins can delete their club's events"
  on public.events for delete
  using (
    exists (
      select 1 from public.club_admins ca
      where ca.club_id = events.club_id and ca.user_id = auth.uid()
    )
  );
