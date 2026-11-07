-- Hardening for public.places (applied after 20261107200000_places.sql):
-- 1. Enable REPLICA IDENTITY FULL on public.places so DELETE WAL records retain group_id for Supabase Realtime RLS filtering.
-- 2. Enforce that events.place_id and notes.place_id belong to the same workspace (group_id).

alter table public.places replica identity full;

create or replace function public.is_place_in_group(p_place_id uuid, p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.places p
    where p.id = p_place_id
      and p.group_id = p_group_id
  );
$$;

alter function public.is_place_in_group(uuid, uuid) owner to postgres;
revoke all on function public.is_place_in_group(uuid, uuid) from public, anon;
grant execute on function public.is_place_in_group(uuid, uuid) to authenticated;

create or replace function public.enforce_place_same_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.place_id is not null and not public.is_place_in_group(new.place_id, new.group_id) then
    raise exception 'Place does not belong to the target workspace';
  end if;
  return new;
end;
$$;

alter function public.enforce_place_same_group() owner to postgres;
revoke all on function public.enforce_place_same_group() from public, anon;

drop trigger if exists events_enforce_place_same_group on public.events;
create trigger events_enforce_place_same_group
  before insert or update of place_id, group_id on public.events
  for each row execute function public.enforce_place_same_group();

drop trigger if exists notes_enforce_place_same_group on public.notes;
create trigger notes_enforce_place_same_group
  before insert or update of place_id, group_id on public.notes
  for each row execute function public.enforce_place_same_group();

