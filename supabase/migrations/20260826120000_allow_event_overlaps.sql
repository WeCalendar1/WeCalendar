-- Soft conflicts: allow overlapping events in a shared group.
-- Overlaps are detected and highlighted in the UI instead of rejected at write time.
alter table public.events
  drop constraint if exists events_no_overlapping_time;
