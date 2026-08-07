-- First-come scheduling: no overlapping events within the same shared group.
-- The first insert/update that claims a time range wins; later overlapping writes fail.

create extension if not exists btree_gist;

-- Half-open ranges [start, end) so back-to-back events (10:00-11:00 and 11:00-12:00) are allowed.
alter table public.events
  drop constraint if exists events_no_overlapping_time;

alter table public.events
  add constraint events_no_overlapping_time
  exclude using gist (
    group_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  );
