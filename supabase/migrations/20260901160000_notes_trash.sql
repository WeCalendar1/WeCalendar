-- Notes trash: soft-delete via deleted_at + cleanup for items older than 7 days
-- Idempotent: column may already exist from a prior preview or manual apply.

alter table public.notes
  add column if not exists deleted_at timestamptz default null;

create or replace function public.cleanup_old_trashed_notes()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.notes
  where deleted_at < (now() - interval '7 days');
$$;

grant execute on function public.cleanup_old_trashed_notes() to authenticated;
