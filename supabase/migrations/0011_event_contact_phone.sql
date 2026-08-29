-- Optional contact number for an event, shown to attendees on the event
-- page so they have someone to reach out to with questions. Per-event
-- (not per-club) since different events under the same club can have
-- different organizers fielding questions.

alter table public.events
  add column contact_phone text;
