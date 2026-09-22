-- A super-admin flag so the site owner can moderate/delete any event
-- regardless of which club posted it, not just clubs they're an admin of.

alter table public.profiles add column is_super_admin boolean not null default false;

update public.profiles set is_super_admin = true where email = 'rishitg.btech23@rvu.edu.in';

-- Close a privilege-escalation hole this column would otherwise open: the
-- existing self-update policy let a user change ANY column on their own
-- profile row, including (after this migration) is_super_admin itself.
-- Pin it to its current stored value for client-driven updates; direct
-- SQL-editor/service-role changes bypass RLS entirely and are unaffected.
drop policy "profiles are self-updatable" on public.profiles;

create policy "profiles are self-updatable"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_super_admin is not distinct from (
      select p.is_super_admin from public.profiles p where p.id = auth.uid()
    )
  );

drop policy "club admins can delete their club's events" on public.events;

create policy "club admins or super admins can delete events"
  on public.events for delete
  using (
    exists (
      select 1 from public.club_admins ca
      where ca.club_id = events.club_id and ca.user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );
