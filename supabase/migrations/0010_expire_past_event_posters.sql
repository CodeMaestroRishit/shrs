-- Reclaims storage/egress on the free tier by clearing out event posters
-- once they're 48h past (no one views a poster for an event that's already
-- happened). The event row itself is kept -- it's a few hundred bytes and
-- club profiles rely on it for "Past Events" history, so there's no reason
-- to delete it.
--
-- Deleting storage.objects rows directly only removes the metadata and can
-- orphan the underlying file bytes, which would still count against the
-- storage cap. So this goes through the real Storage REST API via pg_net,
-- authenticated with the service_role key.
--
-- MANUAL STEP (run once, in the Supabase SQL editor -- never commit the key
-- to git): store the service role key in Vault so this function can read it:
--   select vault.create_secret('<your-service-role-key>', 'service_role_key');

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create or replace function public.expire_past_event_posters()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  project_url constant text := 'https://dlzyquzqdjpntdpvwkfh.supabase.co';
  service_key text;
  ev record;
  object_path text;
begin
  select decrypted_secret into service_key
  from vault.decrypted_secrets
  where name = 'service_role_key';

  if service_key is null then
    raise warning 'expire_past_event_posters: service_role_key not set in Vault, skipping';
    return;
  end if;

  for ev in
    select id, image_url, detail_poster_url
    from public.events
    where coalesce(end_time, start_time) < now() - interval '48 hours'
      and (image_url is not null or detail_poster_url is not null)
  loop
    if ev.image_url is not null then
      object_path := substring(ev.image_url from '/event-posters/(.*)$');
      if object_path is not null then
        perform net.http_delete(
          url := project_url || '/storage/v1/object/event-posters/' || object_path,
          headers := jsonb_build_object('Authorization', 'Bearer ' || service_key)
        );
      end if;
    end if;

    if ev.detail_poster_url is not null then
      object_path := substring(ev.detail_poster_url from '/event-posters/(.*)$');
      if object_path is not null then
        perform net.http_delete(
          url := project_url || '/storage/v1/object/event-posters/' || object_path,
          headers := jsonb_build_object('Authorization', 'Bearer ' || service_key)
        );
      end if;
    end if;

    update public.events
    set image_url = null, detail_poster_url = null
    where id = ev.id;
  end loop;
end;
$$;

select cron.schedule(
  'expire-past-event-posters',
  '0 * * * *', -- hourly
  $$select public.expire_past_event_posters();$$
);
