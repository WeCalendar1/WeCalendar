-- =============================================================================
-- WeCalendar — External Calendar Sync & Unsync RPC
-- Migration: 20261108210000_calendar_sync.sql
--
-- 1. public.calendar_syncs table, indexes, updated_at trigger, RLS & Realtime
-- 2. public.events.sync_id (ON DELETE CASCADE) & external_uid + unique index
-- 3. Same-workspace integrity trigger on public.events.sync_id
-- 4. public.unsync_my_calendars(p_group_id uuid default null) RPC
-- 5. Updated public.leave_group(p_group_id uuid) to clean up caller's calendar_syncs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. public.calendar_syncs
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_syncs (
  id                 uuid primary key default gen_random_uuid(),
  group_id           uuid not null references public.groups(id) on delete cascade,
  user_id            uuid not null references public.profiles(id) on delete cascade,
  provider           text not null check (provider in ('ics_url', 'ics_file')),
  label              text not null check (char_length(trim(label)) > 0),
  source_url         text,
  last_synced_at     timestamptz not null default now(),
  synced_event_count integer not null default 0 check (synced_event_count >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint calendar_syncs_source_url_check check (
    (provider = 'ics_url' and source_url is not null and char_length(trim(source_url)) > 0)
    or (provider = 'ics_file' and source_url is null)
  )
);

create index if not exists calendar_syncs_user_group_idx
  on public.calendar_syncs (user_id, group_id, created_at asc);

create unique index if not exists calendar_syncs_unique_url_per_user_group_idx
  on public.calendar_syncs (user_id, group_id, source_url)
  where source_url is not null;

drop trigger if exists calendar_syncs_updated_at on public.calendar_syncs;
create trigger calendar_syncs_updated_at
  before update on public.calendar_syncs
  for each row execute function public.set_updated_at();

alter table public.calendar_syncs enable row level security;
alter table public.calendar_syncs replica identity full;

drop policy if exists "calendar_syncs: owner can view" on public.calendar_syncs;
create policy "calendar_syncs: owner can view"
  on public.calendar_syncs for select
  using (user_id = auth.uid());

drop policy if exists "calendar_syncs: owner can insert" on public.calendar_syncs;
create policy "calendar_syncs: owner can insert"
  on public.calendar_syncs for insert
  with check (
    user_id = auth.uid()
    and public.is_group_member(group_id)
  );

drop policy if exists "calendar_syncs: owner can update" on public.calendar_syncs;
create policy "calendar_syncs: owner can update"
  on public.calendar_syncs for update
  using (
    user_id = auth.uid()
    and public.is_group_member(group_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_group_member(group_id)
  );

drop policy if exists "calendar_syncs: owner can delete" on public.calendar_syncs;
create policy "calendar_syncs: owner can delete"
  on public.calendar_syncs for delete
  using (user_id = auth.uid());

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'calendar_syncs'
    ) then
      alter publication supabase_realtime add table public.calendar_syncs;
    end if;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. public.events sync linkage
-- ---------------------------------------------------------------------------
alter table public.events
  add column if not exists sync_id uuid references public.calendar_syncs(id) on delete cascade,
  add column if not exists external_uid text;

create index if not exists events_sync_id_idx
  on public.events (sync_id)
  where sync_id is not null;

create unique index if not exists events_sync_external_uid_idx
  on public.events (sync_id, external_uid)
  where sync_id is not null and external_uid is not null;

-- ---------------------------------------------------------------------------
-- 3. Same-workspace & owner integrity trigger for public.events.sync_id
-- ---------------------------------------------------------------------------
create or replace function public.is_sync_in_group(
  p_sync_id uuid,
  p_group_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.calendar_syncs s
    where s.id = p_sync_id
      and s.group_id = p_group_id
  );
$$;

alter function public.is_sync_in_group(uuid, uuid) owner to postgres;
revoke all on function public.is_sync_in_group(uuid, uuid) from public, anon;
grant execute on function public.is_sync_in_group(uuid, uuid) to authenticated;

create or replace function public.enforce_event_sync_same_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sync_id is not null and not public.is_sync_in_group(new.sync_id, new.group_id) then
    raise exception 'calendar_syncs row must belong to the same group as the event'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

alter function public.enforce_event_sync_same_group() owner to postgres;
revoke all on function public.enforce_event_sync_same_group() from public, anon;

drop trigger if exists events_enforce_sync_same_group on public.events;
create trigger events_enforce_sync_same_group
  before insert or update of sync_id, group_id on public.events
  for each row execute function public.enforce_event_sync_same_group();

-- ---------------------------------------------------------------------------
-- 4. public.unsync_my_calendars(p_group_id uuid default null)
-- ---------------------------------------------------------------------------
create or replace function public.unsync_my_calendars(
  p_group_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_deleted integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  with deleted as (
    delete from public.calendar_syncs
    where user_id = v_uid
      and (p_group_id is null or group_id = p_group_id)
    returning id
  )
  select count(*)::integer into v_deleted from deleted;

  return v_deleted;
end;
$$;

alter function public.unsync_my_calendars(uuid) owner to postgres;
revoke all on function public.unsync_my_calendars(uuid) from public, anon;
grant execute on function public.unsync_my_calendars(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Update public.leave_group(p_group_id uuid) to remove caller's calendar_syncs
-- ---------------------------------------------------------------------------
create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_next_owner uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Reject non-members before acquiring any lock on public.groups so an
  -- authenticated outsider cannot block operations on another workspace.
  if not exists (
    select 1
    from public.group_members
    where group_id = p_group_id and user_id = v_uid
  ) then
    return;
  end if;

  -- Serialize concurrent leaves on the same workspace so the last two members
  -- leaving simultaneously cannot strand an empty group row.
  perform 1
  from public.groups
  where id = p_group_id
  for update;

  -- Re-check membership under the lock in case a concurrent call already left.
  if not exists (
    select 1
    from public.group_members
    where group_id = p_group_id and user_id = v_uid
  ) then
    return;
  end if;

  -- Sole member: delete the entire workspace (cascades events, RSVPs, notifications, calendar_syncs, tags, lists, notes, memberships)
  if not exists (
    select 1
    from public.group_members
    where group_id = p_group_id and user_id <> v_uid
  ) then
    delete from public.groups where id = p_group_id;
    return;
  end if;

  -- Other members remain: remove caller's synced calendars (and their imported events),
  -- private notes, folders, RSVPs & workspace notifications
  delete from public.calendar_syncs
  where group_id = p_group_id
    and user_id = v_uid;

  delete from public.event_rsvps
  where group_id = p_group_id
    and user_id = v_uid;

  delete from public.notifications
  where group_id = p_group_id
    and recipient_id = v_uid;

  delete from public.notes
  where group_id = p_group_id
    and visibility = 'private'
    and created_by = v_uid;

  delete from public.note_folders
  where group_id = p_group_id
    and visibility = 'private'
    and created_by = v_uid;

  delete from public.group_members
  where group_id = p_group_id
    and user_id = v_uid;

  -- Ensure at least one owner remains
  if not exists (
    select 1
    from public.group_members
    where group_id = p_group_id and role = 'owner'
  ) then
    select user_id into v_next_owner
    from public.group_members
    where group_id = p_group_id
    order by joined_at asc, id asc
    limit 1;

    if v_next_owner is not null then
      update public.group_members
      set role = 'owner'
      where group_id = p_group_id and user_id = v_next_owner;
    end if;
  end if;

  -- Reassign groups.created_by if caller was the recorded creator
  update public.groups
  set created_by = coalesce(
    v_next_owner,
    (
      select user_id
      from public.group_members
      where group_id = p_group_id and role = 'owner'
      order by joined_at asc, id asc
      limit 1
    )
  )
  where id = p_group_id
    and (created_by is null or created_by = v_uid);
end;
$$;

alter function public.leave_group(uuid) owner to postgres;
revoke all on function public.leave_group(uuid) from public, anon;
grant execute on function public.leave_group(uuid) to authenticated;
