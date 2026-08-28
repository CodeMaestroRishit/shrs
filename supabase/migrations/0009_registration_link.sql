-- Optional external registration link (Google Form, Luma, etc.) shown as a
-- "Register now" call-to-action on the event detail page.

alter table public.events
  add column registration_url text;
