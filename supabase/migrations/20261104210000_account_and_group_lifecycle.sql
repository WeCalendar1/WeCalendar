-- Account & Group Lifecycle: nullable created_by (preserve shared content on member/account deletion)
-- plus atomic SECURITY DEFINER RPCs: leave_group, leave_all_groups, delete_own_account.

-- ---------------------------------------------------------------------------
-- 1. Relax created_by foreign keys from ON DELETE RESTRICT to ON DELETE SET NULL
-- ---------------------------------------------------------------------------

alter table public.groups alter column created_by drop not null;
alter table public.groups drop constraint if exists groups_created_by_fkey;
alter table public.groups
  add constraint groups_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.events alter column created_by drop not null;
alter table public.events drop constraint if exists events_created_by_fkey;
alter table public.events
  add constraint events_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.lists alter column created_by drop not null;
alter table public.lists drop constraint if exists lists_created_by_fkey;
alter table public.lists
  add constraint lists_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.list_items alter column created_by drop not null;
alter table public.list_items drop constraint if exists list_items_created_by_fkey;
alter table public.list_items
  add constraint list_items_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.tags alter column created_by drop not null;
alter table public.tags drop constraint if exists tags_created_by_fkey;
alter table public.tags
  add constraint tags_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.note_folders alter column created_by drop not null;
alter table public.note_folders drop constraint if exists note_folders_created_by_fkey;
alter table public.note_folders
  add constraint note_folders_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.notes alter column created_by drop not null;
alter table public.notes drop constraint if exists notes_created_by_fkey;
alter table public.notes
  add constraint notes_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 2. Group & Account Lifecycle RPCs
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

  -- Sole member: delete the entire workspace (cascades events, tags, lists, notes, memberships)
  if not exists (
    select 1
    from public.group_members
    where group_id = p_group_id and user_id <> v_uid
  ) then
    delete from public.groups where id = p_group_id;
    return;
  end if;

  -- Other members remain: remove caller's private notes & folders in this workspace, keep shared data
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

create or replace function public.leave_all_groups()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_gid uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  for v_gid in
    select group_id
    from public.group_members
    where user_id = v_uid
  loop
    perform public.leave_group(v_gid);
  end loop;
end;
$$;

alter function public.leave_all_groups() owner to postgres;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  perform public.leave_all_groups();

  -- Also purge any lingering private notes/folders from groups left prior to Phase 1
  delete from public.notes
  where visibility = 'private'
    and created_by = v_uid;

  delete from public.note_folders
  where visibility = 'private'
    and created_by = v_uid;

  delete from auth.users where id = v_uid;
end;
$$;

alter function public.delete_own_account() owner to postgres;

revoke all on function public.leave_group(uuid) from public, anon;
revoke all on function public.leave_all_groups() from public, anon;
revoke all on function public.delete_own_account() from public, anon;

grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.leave_all_groups() to authenticated;
grant execute on function public.delete_own_account() to authenticated;
