-- Add deleted_at column to notes
alter table public.notes
add column deleted_at timestamp with time zone default null;

-- Function to permanently delete notes that have been in the trash for more than 7 days
create or replace function public.cleanup_old_trashed_notes()
returns void
language sql
security definer
as $$
  delete from public.notes
  where deleted_at < (now() - interval '7 days');
$$;
