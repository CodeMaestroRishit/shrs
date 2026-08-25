-- Restrict sign-in to an allow-listed college email domain, enforced at the
-- database layer (not just the frontend). Any Google OAuth sign-in whose
-- email domain isn't in allowed_email_domains is rejected: the auth.users
-- insert itself is aborted, so no session/profile is ever created for them.

create table public.allowed_email_domains (
  domain text primary key
);

-- RLS enabled with zero policies: deny-all via the Data API. Nothing
-- client-side ever needs to read or write this table -- only the
-- SECURITY DEFINER trigger below does, and it runs as the table owner,
-- which is exempt from RLS. Leaving this table open would let anyone call
-- the REST API directly to add their own domain or delete the real one,
-- defeating the whole point of the restriction.
alter table public.allowed_email_domains enable row level security;

-- Placeholder domain -- change this for your college, e.g.:
--   update public.allowed_email_domains set domain = 'yourcollege.edu' where domain = 'rvu.edu.in';
insert into public.allowed_email_domains (domain) values ('rvu.edu.in');

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email_domain text;
begin
  email_domain := lower(split_part(new.email, '@', 2));

  if not exists (
    select 1 from public.allowed_email_domains ad where ad.domain = email_domain
  ) then
    raise exception 'Sign-in is restricted to college email addresses.';
  end if;

  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
