-- RVU issues some accounts on the Bengaluru subdomain (name@blr.rvu.edu.in).
-- The check in 0002 matches the full domain exactly, so a subdomain is not
-- covered by the existing 'rvu.edu.in' row and needs its own entry -- without
-- this, those students are rejected at sign-in with
-- "Sign-in is restricted to college email addresses."

insert into public.allowed_email_domains (domain)
values ('blr.rvu.edu.in')
on conflict (domain) do nothing;
