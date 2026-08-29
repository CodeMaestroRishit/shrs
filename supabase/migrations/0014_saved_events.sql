-- Per-user saved/bookmarked events, so the bookmark button persists across
-- devices instead of living only in localStorage.

create table public.saved_events (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index saved_events_user_id_idx on public.saved_events (user_id);

alter table public.saved_events enable row level security;

create policy "users manage their own saved events"
  on public.saved_events
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
