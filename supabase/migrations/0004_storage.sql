-- Storage bucket for event posters. Files are uploaded under a
-- `{club_id}/{filename}` path so policies can check the club_id segment
-- against club_admins, the same way the events table policies do.

insert into storage.buckets (id, name, public)
values ('event-posters', 'event-posters', true)
on conflict (id) do nothing;

create policy "event posters are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'event-posters');

create policy "club admins can upload posters for their club"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-posters'
    and exists (
      select 1 from public.club_admins ca
      where ca.user_id = auth.uid()
        and ca.club_id::text = (storage.foldername(name))[1]
    )
  );

create policy "club admins can update posters for their club"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'event-posters'
    and exists (
      select 1 from public.club_admins ca
      where ca.user_id = auth.uid()
        and ca.club_id::text = (storage.foldername(name))[1]
    )
  );

create policy "club admins can delete posters for their club"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-posters'
    and exists (
      select 1 from public.club_admins ca
      where ca.user_id = auth.uid()
        and ca.club_id::text = (storage.foldername(name))[1]
    )
  );
