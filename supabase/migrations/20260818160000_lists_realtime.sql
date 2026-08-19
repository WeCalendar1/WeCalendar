-- Enable live updates when lists are created/renamed/deleted in a workspace.
do $$
begin
  alter publication supabase_realtime add table public.lists;
exception when duplicate_object then null;
end $$;
