-- Fixes a gap from 0002: allowed_email_domains was created without RLS,
-- which left it publicly readable/writable via the Data API despite living
-- in the public schema -- anyone could have called the REST API to add
-- their own domain or delete the real one, bypassing the signup
-- restriction entirely. Run this once against any project that already
-- applied 0002 before this fix existed.

alter table public.allowed_email_domains enable row level security;
