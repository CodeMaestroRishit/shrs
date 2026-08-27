-- A second, optional poster shown only on an event's own detail page (not
-- in cards/list/grid views elsewhere), separate from events.image_url
-- which stays the compact thumbnail used across the site. Kept on the same
-- Supabase bucket/size cap as image_url -- deliberately not offloaded to a
-- third-party host (Drive/imgbb): this asset only loads on single event
-- page views, so its egress footprint is already low, and keeping it on
-- Supabase avoids depending on a free consumer image host with no SLA.

alter table public.events
  add column detail_poster_url text;
