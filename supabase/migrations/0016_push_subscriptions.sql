-- Web Push notifications when a club publishes a new event.
--
-- Delivery is free and unmetered: the Vercel route below hands each message to
-- the browser vendor's own push service (Google/Mozilla/Apple), so nothing here
-- scales with the number of students.
--
-- Prerequisite (one-time, run manually in the SQL editor before this works):
--   select vault.create_secret('<random hex>', 'push_webhook_secret');
-- The same value must be set as PUSH_WEBHOOK_SECRET in the Vercel project.

-- Opt-in per event. Defaults to false so that a test/draft event -- or any
-- INSERT from outside the admin form -- can never blast every subscriber.
alter table public.events add column should_notify boolean not null default false;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- One row per browser/device, not per user: the endpoint is the unique
  -- address the push service hands out, so the same student on a phone and a
  -- laptop legitimately has two rows.
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "users manage their own push subscriptions"
  on public.push_subscriptions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create function public.notify_new_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  webhook_secret text;
begin
  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'push_webhook_secret';

  -- Never fail the INSERT because notifications are misconfigured -- publishing
  -- an event must still succeed even if nobody can be told about it.
  if webhook_secret is null then
    raise warning 'notify_new_event: push_webhook_secret not set in Vault, skipping';
    return new;
  end if;

  -- pg_net queues this asynchronously, so a slow or down endpoint does not
  -- block the INSERT.
  perform net.http_post(
    url := 'https://shrs-beta.vercel.app/api/send-event-notification',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || webhook_secret,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('event_id', new.id, 'title', new.title)
  );

  return new;
end;
$$;

-- The WHEN clause is the guard: the function is never even entered unless the
-- admin explicitly ticked "Notify students".
create trigger on_event_created
  after insert on public.events
  for each row
  when (new.should_notify = true)
  execute function public.notify_new_event();
