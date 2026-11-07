-- Shared workspace places: map pins (favorite / want_to_go) linked from events and notes.

create table if not exists public.places (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  name        text not null,
  address     text,
  lat         double precision not null,
  lng         double precision not null,
  kind        text not null default 'favorite'
    check (kind in ('favorite', 'want_to_go')),
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists places_group_id_idx on public.places (group_id);

drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

alter table public.events
  add column if not exists place_id uuid references public.places (id) on delete set null;

create index if not exists events_place_id_idx on public.events (place_id)
  where place_id is not null;

alter table public.notes
  add column if not exists place_id uuid references public.places (id) on delete set null;

create index if not exists notes_place_id_idx on public.notes (place_id)
  where place_id is not null;

alter table public.places enable row level security;

drop policy if exists "Members can view group places" on public.places;
drop policy if exists "Members can create group places" on public.places;
drop policy if exists "Members can update group places" on public.places;
drop policy if exists "Members can delete group places" on public.places;

create policy "Members can view group places"
  on public.places for select
  using (public.is_group_member(group_id));

create policy "Members can create group places"
  on public.places for insert
  with check (public.is_group_member(group_id) and created_by = auth.uid());

create policy "Members can update group places"
  on public.places for update
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

create policy "Members can delete group places"
  on public.places for delete
  using (public.is_group_member(group_id));

grant select, insert, update, delete on public.places to authenticated;

-- Ensure DELETE WAL records retain group_id for Supabase Realtime RLS filtering.
alter table public.places replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.places;
exception when duplicate_object then null;
end $$;

-- Enforce that events.place_id and notes.place_id belong to the same workspace (group_id).
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
