-- Event RSVPs & showDeclinedEvents: per-member Going / Maybe / Declined responses,
-- RLS policies, Realtime publication, reschedule reset trigger, and leave_group cleanup.

-- ---------------------------------------------------------------------------
-- 1. Table, Indexes & updated_at Trigger
-- ---------------------------------------------------------------------------

create table if not exists public.event_rsvps (
  event_id   uuid not null references public.events (id) on delete cascade,
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  status     text not null check (status in ('going', 'maybe', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_rsvps_group_id_idx on public.event_rsvps (group_id);
create index if not exists event_rsvps_user_id_idx  on public.event_rsvps (user_id);

drop trigger if exists event_rsvps_set_updated_at on public.event_rsvps;
create trigger event_rsvps_set_updated_at
  before update on public.event_rsvps
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Group-Event Consistency Helper & Row Level Security
-- ---------------------------------------------------------------------------

create or replace function public.is_event_in_group(p_event_id uuid, p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id and e.group_id = p_group_id
  );
$$;

alter function public.is_event_in_group(uuid, uuid) owner to postgres;
revoke all on function public.is_event_in_group(uuid, uuid) from public, anon;
grant execute on function public.is_event_in_group(uuid, uuid) to authenticated;

alter table public.event_rsvps enable row level security;

drop policy if exists "Members can view group event RSVPs" on public.event_rsvps;
drop policy if exists "Members can create own event RSVPs" on public.event_rsvps;
drop policy if exists "Members can update own event RSVPs" on public.event_rsvps;
drop policy if exists "Members can delete own event RSVPs" on public.event_rsvps;

create policy "Members can view group event RSVPs"
  on public.event_rsvps for select
  using (public.is_group_member(group_id));

create policy "Members can create own event RSVPs"
  on public.event_rsvps for insert
  with check (
    user_id = auth.uid()
    and public.is_group_member(group_id)
    and public.is_event_in_group(event_id, group_id)
  );

create policy "Members can update own event RSVPs"
  on public.event_rsvps for update
  using (
    user_id = auth.uid()
    and public.is_group_member(group_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_group_member(group_id)
    and public.is_event_in_group(event_id, group_id)
  );

create policy "Members can delete own event RSVPs"
  on public.event_rsvps for delete
  using (
    user_id = auth.uid()
    and public.is_group_member(group_id)
  );

grant select, insert, update, delete on public.event_rsvps to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Reschedule Reset Trigger on public.events
-- ---------------------------------------------------------------------------

create or replace function public.reset_event_rsvps_on_reschedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.starts_at is distinct from old.starts_at
     or new.ends_at is distinct from old.ends_at then
    delete from public.event_rsvps where event_id = new.id;
  end if;
  return new;
end;
$$;

alter function public.reset_event_rsvps_on_reschedule() owner to postgres;
revoke all on function public.reset_event_rsvps_on_reschedule() from public, anon;

drop trigger if exists events_reset_rsvps_on_reschedule on public.events;
create trigger events_reset_rsvps_on_reschedule
  after update of starts_at, ends_at on public.events
  for each row execute function public.reset_event_rsvps_on_reschedule();

-- ---------------------------------------------------------------------------
-- 4. Realtime Publication
-- ---------------------------------------------------------------------------

-- Ensure DELETE WAL records include group_id (not part of composite PK (event_id, user_id))
-- so Supabase Realtime can evaluate the SELECT RLS policy (is_group_member(group_id)).
alter table public.event_rsvps replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.event_rsvps;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Extend leave_group to clean up departing member's RSVPs in the workspace
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

  -- Sole member: delete the entire workspace (cascades events, RSVPs, tags, lists, notes, memberships)
  if not exists (
    select 1
    from public.group_members
    where group_id = p_group_id and user_id <> v_uid
  ) then
    delete from public.groups where id = p_group_id;
    return;
  end if;

  -- Other members remain: remove caller's private notes, folders & RSVPs in this workspace, keep shared data
  delete from public.event_rsvps
  where group_id = p_group_id
    and user_id = v_uid;

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

