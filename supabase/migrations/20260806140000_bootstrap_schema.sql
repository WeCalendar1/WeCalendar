-- Bootstrap WeCalendar schema (safe to run when tables are missing)
-- Paste into Supabase SQL Editor and Run

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  theme_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  has_conflict boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null,
  category text not null default 'custom'
    check (category in ('grocery', 'todo', 'wishlist', 'custom')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  content text not null,
  is_checked boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes (ignore if they already exist)
create index if not exists group_members_user_id_idx on public.group_members (user_id);
create index if not exists group_members_group_id_idx on public.group_members (group_id);
create index if not exists groups_invite_code_idx on public.groups (invite_code);
create index if not exists events_group_id_idx on public.events (group_id);
create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists events_group_id_starts_at_idx on public.events (group_id, starts_at);
create index if not exists lists_group_id_idx on public.lists (group_id);
create index if not exists list_items_list_id_idx on public.list_items (list_id);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists lists_set_updated_at on public.lists;
create trigger lists_set_updated_at
  before update on public.lists
  for each row execute function public.set_updated_at();

drop trigger if exists list_items_set_updated_at on public.list_items;
create trigger list_items_set_updated_at
  before update on public.list_items
  for each row execute function public.set_updated_at();

-- Profile on signup (fixed permissions)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      nullif(split_part(coalesce(new.email, ''), '@', 1), '')
    )
  )
  on conflict (id) do update
    set display_name = coalesce(excluded.display_name, public.profiles.display_name);

  return new;
end;
$$;

alter function public.handle_new_user() owner to postgres;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Membership helpers
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_list_group_member(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lists l
    join public.group_members gm on gm.group_id = l.group_id
    where l.id = p_list_id and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.generate_invite_code()
returns text
language sql
as $$
  select substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
$$;

create or replace function public.create_group(p_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.groups (name, invite_code, created_by)
  values (p_name, public.generate_invite_code(), auth.uid())
  returning * into new_group;

  insert into public.group_members (group_id, user_id, role)
  values (new_group.id, auth.uid(), 'owner');

  return new_group;
end;
$$;

create or replace function public.join_group_by_invite(p_invite_code text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.groups;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into target
  from public.groups
  where lower(invite_code) = lower(trim(p_invite_code));

  if target.id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return target;
end;
$$;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_list_group_member(uuid) to authenticated;
grant execute on function public.is_group_owner(uuid) to authenticated;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group_by_invite(text) to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.events enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- Recreate policies cleanly
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can view profiles in shared groups" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Members can view their groups" on public.groups;
drop policy if exists "Members can update their groups" on public.groups;
drop policy if exists "Members can view group membership" on public.group_members;
drop policy if exists "Owners can remove members or leave" on public.group_members;
drop policy if exists "Members can view group events" on public.events;
drop policy if exists "Members can create group events" on public.events;
drop policy if exists "Members can update group events" on public.events;
drop policy if exists "Members can delete group events" on public.events;
drop policy if exists "Members can view group lists" on public.lists;
drop policy if exists "Members can create group lists" on public.lists;
drop policy if exists "Members can update group lists" on public.lists;
drop policy if exists "Members can delete group lists" on public.lists;
drop policy if exists "Members can view list items" on public.list_items;
drop policy if exists "Members can create list items" on public.list_items;
drop policy if exists "Members can update list items" on public.list_items;
drop policy if exists "Members can delete list items" on public.list_items;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can view profiles in shared groups"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.group_members gm_self
      join public.group_members gm_other on gm_other.group_id = gm_self.group_id
      where gm_self.user_id = auth.uid() and gm_other.user_id = profiles.id
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Members can view their groups"
  on public.groups for select using (public.is_group_member(id));

create policy "Members can update their groups"
  on public.groups for update
  using (public.is_group_member(id)) with check (public.is_group_member(id));

create policy "Members can view group membership"
  on public.group_members for select using (public.is_group_member(group_id));

create policy "Owners can remove members or leave"
  on public.group_members for delete
  using (public.is_group_owner(group_id) or user_id = auth.uid());

create policy "Members can view group events"
  on public.events for select using (public.is_group_member(group_id));

create policy "Members can create group events"
  on public.events for insert
  with check (public.is_group_member(group_id) and created_by = auth.uid());

create policy "Members can update group events"
  on public.events for update
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

create policy "Members can delete group events"
  on public.events for delete using (public.is_group_member(group_id));

create policy "Members can view group lists"
  on public.lists for select using (public.is_group_member(group_id));

create policy "Members can create group lists"
  on public.lists for insert
  with check (public.is_group_member(group_id) and created_by = auth.uid());

create policy "Members can update group lists"
  on public.lists for update
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

create policy "Members can delete group lists"
  on public.lists for delete using (public.is_group_member(group_id));

create policy "Members can view list items"
  on public.list_items for select using (public.is_list_group_member(list_id));

create policy "Members can create list items"
  on public.list_items for insert
  with check (public.is_list_group_member(list_id) and created_by = auth.uid());

create policy "Members can update list items"
  on public.list_items for update
  using (public.is_list_group_member(list_id)) with check (public.is_list_group_member(list_id));

create policy "Members can delete list items"
  on public.list_items for delete using (public.is_list_group_member(list_id));

-- Realtime (ignore error if already added)
do $$
begin
  alter publication supabase_realtime add table public.events;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.list_items;
exception when duplicate_object then null;
end $$;

-- Grants
grant usage on schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;

grant select, insert, update on public.profiles to postgres, service_role, supabase_auth_admin;
grant select, update on public.profiles to authenticated;

grant select, update on public.groups to authenticated;
grant select, delete on public.group_members to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.lists to authenticated;
grant select, insert, update, delete on public.list_items to authenticated;

-- Keep migration history in sync
insert into supabase_migrations.schema_migrations (version)
values ('20260730120000'), ('20260806130000')
on conflict (version) do nothing;
