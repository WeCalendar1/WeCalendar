-- ============================================================
-- WeCalendar: Tags & Event-Tags migration
-- Paste into Supabase SQL Editor and Run
-- ============================================================

-- Tags table (per-group, shared across members)
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, name)
);

-- Event to Tag join table
create table if not exists public.event_tags (
  event_id uuid not null references public.events (id) on delete cascade,
  tag_id   uuid not null references public.tags   (id) on delete cascade,
  primary key (event_id, tag_id)
);

-- Indexes
create index if not exists tags_group_id_idx       on public.tags (group_id);
create index if not exists event_tags_event_id_idx on public.event_tags (event_id);
create index if not exists event_tags_tag_id_idx   on public.event_tags (tag_id);

-- updated_at trigger for tags
drop trigger if exists tags_set_updated_at on public.tags;
create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

-- RLS
alter table public.tags       enable row level security;
alter table public.event_tags enable row level security;

-- Helper so event_tags can check membership via event -> group
create or replace function public.is_event_group_member(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    join public.group_members gm on gm.group_id = e.group_id
    where e.id = p_event_id and gm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_event_group_member(uuid) to authenticated;

-- Helper so event_tags can check membership via tag -> group
create or replace function public.is_tag_group_member(p_tag_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tags t
    join public.group_members gm on gm.group_id = t.group_id
    where t.id = p_tag_id and gm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_tag_group_member(uuid) to authenticated;

-- Tags policies
drop policy if exists "Members can view group tags"  on public.tags;
drop policy if exists "Members can create group tags" on public.tags;
drop policy if exists "Members can update group tags" on public.tags;
drop policy if exists "Members can delete group tags" on public.tags;

create policy "Members can view group tags"
  on public.tags for select using (public.is_group_member(group_id));

create policy "Members can create group tags"
  on public.tags for insert
  with check (public.is_group_member(group_id) and created_by = auth.uid());

create policy "Members can update group tags"
  on public.tags for update
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

create policy "Members can delete group tags"
  on public.tags for delete using (public.is_group_member(group_id));

-- Event-tags policies
drop policy if exists "Members can view event tags"  on public.event_tags;
drop policy if exists "Members can create event tags" on public.event_tags;
drop policy if exists "Members can delete event tags" on public.event_tags;

create policy "Members can view event tags"
  on public.event_tags for select
  using (public.is_event_group_member(event_id));

create policy "Members can create event tags"
  on public.event_tags for insert
  with check (public.is_event_group_member(event_id) and public.is_tag_group_member(tag_id));

create policy "Members can delete event tags"
  on public.event_tags for delete
  using (public.is_event_group_member(event_id));

-- Grants
grant select, insert, update, delete on public.tags       to authenticated;
grant select, insert, delete         on public.event_tags to authenticated;

-- Realtime
do $$
begin
  alter publication supabase_realtime add table public.tags;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.event_tags;
exception when duplicate_object then null;
end $$;
