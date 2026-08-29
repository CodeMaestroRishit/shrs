-- Adds a YouTube video link to events (rendered as an embedded preview on
-- the event detail page) and tightens storage bucket limits.
--
-- YouTube hosts the video's bandwidth and storage, not us -- this is the
-- cheap way to offer event video without touching the Supabase free tier's
-- storage quota. We only store the URL/id, a few bytes of text.
--
-- The file_size_limit + allowed_mime_types on the poster bucket are a
-- server-side backstop for the free tier's storage cap: the frontend
-- already asks admins to upload compressed images, but a client-side check
-- alone is bypassable, so the real limit has to live here too.

alter table public.events
  add column youtube_video_url text;

update storage.buckets
set file_size_limit = 2097152, -- 2 MiB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'event-posters';
