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

do $$
begin
  alter publication supabase_realtime add table public.places;
exception when duplicate_object then null;
end $$;
