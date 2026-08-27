-- Tightens the event-posters bucket cap from 2 MiB to 500 KiB to cut into
-- egress further -- smaller files served to every visitor loading the
-- events feed adds up fast against the free tier's bandwidth quota.

update storage.buckets
set file_size_limit = 512000 -- 500 KiB
where id = 'event-posters';
