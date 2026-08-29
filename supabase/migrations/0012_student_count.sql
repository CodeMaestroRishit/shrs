-- profiles is locked down to "self-readable only" (see 0003), so a plain
-- client-side count query against it returns 1 (or 0 for anon) instead of
-- the real total. This function exposes just the aggregate count -- never
-- individual rows -- so the landing page can show a real "students joined"
-- number without loosening profiles' row-level security.

create or replace function public.get_student_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer from public.profiles;
$$;

grant execute on function public.get_student_count() to anon, authenticated;
