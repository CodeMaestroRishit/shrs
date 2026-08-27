-- A single, user-owned 1–5 star rating per event. No review content is stored.
create table public.event_ratings (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index event_ratings_event_id_idx on public.event_ratings (event_id);

alter table public.event_ratings enable row level security;

create policy "event ratings are publicly readable"
  on public.event_ratings for select
  to anon, authenticated
  using (true);

create policy "authenticated users can rate completed events"
  on public.event_ratings for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.events
      where events.id = event_ratings.event_id
        and coalesce(events.end_time, events.start_time) < now()
    )
  );

create policy "users can update their own completed-event rating"
  on public.event_ratings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.events
      where events.id = event_ratings.event_id
        and coalesce(events.end_time, events.start_time) < now()
    )
  );
