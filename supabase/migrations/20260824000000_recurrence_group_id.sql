-- Idempotent: column may already exist from a prior preview or manual apply.
alter table public.events
  add column if not exists recurrence_group_id uuid null;
