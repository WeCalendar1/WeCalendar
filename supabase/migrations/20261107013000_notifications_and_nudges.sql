-- Notifications & Availability Nudges:
-- 1. Persisted notification_preferences JSONB on public.profiles
-- 2. public.notifications table with recipient-only RLS, REPLICA IDENTITY FULL, and Realtime
-- 3. Preference-aware triggers for events (batch-coalesced), group_members (join/leave), and shared notes/lists
-- 4. SECURITY DEFINER RPC send_availability_nudge with rate limiting
-- 5. leave_group cleanup of departing user's workspace notifications

-- ---------------------------------------------------------------------------
-- 1. Profile Notification Preferences & Notifications Table
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists notification_preferences jsonb not null
  default '{"events":true,"invites":true,"lists":false,"nudges":true}'::jsonb;

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id     uuid references public.profiles (id) on delete set null,
  group_id     uuid references public.groups (id) on delete cascade,
  category     text not null check (category in ('events', 'invites', 'lists', 'nudges')),
  title        text not null,
  body         text,
  event_id     uuid references public.events (id) on delete set null,
  note_id      uuid references public.notes (id) on delete set null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

create index if not exists notifications_group_id_idx
  on public.notifications (group_id);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security & Realtime Publication
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;

drop policy if exists "Recipients can view own notifications" on public.notifications;
drop policy if exists "Recipients can update own notifications" on public.notifications;
drop policy if exists "Recipients can delete own notifications" on public.notifications;

create policy "Recipients can view own notifications"
  on public.notifications for select
  using (recipient_id = auth.uid());

create policy "Recipients can update own notifications"
  on public.notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy "Recipients can delete own notifications"
  on public.notifications for delete
  using (recipient_id = auth.uid());

-- Authenticated clients cannot INSERT directly; triggers & send_availability_nudge write rows.
revoke all on public.notifications from public, anon, authenticated;
grant select, update, delete on public.notifications to authenticated;

-- Ensure DELETE WAL records retain recipient_id for Supabase Realtime RLS filtering.
alter table public.notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Preference & Actor Helpers
-- ---------------------------------------------------------------------------

create or replace function public.user_wants_notification(p_user_id uuid, p_category text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_prefs jsonb;
  v_default boolean;
begin
  v_default := case p_category
    when 'lists' then false
    else true
  end;

  select notification_preferences into v_prefs
  from public.profiles
  where id = p_user_id;

  if v_prefs is null or jsonb_typeof(v_prefs) <> 'object' then
    return v_default;
  end if;

  if jsonb_typeof(v_prefs -> p_category) = 'boolean' then
    return (v_prefs ->> p_category)::boolean;
  end if;

  return v_default;
end;
$$;

alter function public.user_wants_notification(uuid, text) owner to postgres;
revoke all on function public.user_wants_notification(uuid, text) from public, anon;

create or replace function public.actor_display_label(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select nullif(trim(display_name), '') from public.profiles where id = p_user_id),
    'A member'
  );
$$;

alter function public.actor_display_label(uuid) owner to postgres;
revoke all on function public.actor_display_label(uuid) from public, anon;

-- ---------------------------------------------------------------------------
-- 4. Automatic Triggers (Events, Group Membership, Shared Notes & Lists)
-- ---------------------------------------------------------------------------

-- 4a. Coalesced statement-level trigger for new shared calendar events
create or replace function public.notify_on_event_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  v_actor text;
  v_group_name text;
  v_title text;
begin
  for rec in
    select
      group_id,
      created_by,
      count(*)::int as occurrence_count,
      (array_agg(id order by starts_at asc))[1] as first_event_id,
      (array_agg(title order by starts_at asc))[1] as first_title
    from inserted_rows
    where created_by is not null
    group by group_id, created_by, coalesce(recurrence_group_id::text, id::text)
  loop
    select name into v_group_name from public.groups where id = rec.group_id;
    v_actor := public.actor_display_label(rec.created_by);

    if rec.occurrence_count > 1 then
      v_title := format('%s added %s events: %s', v_actor, rec.occurrence_count, rec.first_title);
    else
      v_title := format('%s added "%s"', v_actor, rec.first_title);
    end if;

    insert into public.notifications (
      recipient_id, actor_id, group_id, category, title, body, event_id
    )
    select
      gm.user_id,
      rec.created_by,
      rec.group_id,
      'events',
      v_title,
      v_group_name,
      rec.first_event_id
    from public.group_members gm
    where gm.group_id = rec.group_id
      and gm.user_id <> rec.created_by
      and public.user_wants_notification(gm.user_id, 'events');
  end loop;

  return null;
end;
$$;

alter function public.notify_on_event_insert() owner to postgres;
revoke all on function public.notify_on_event_insert() from public, anon;

drop trigger if exists events_notify_insert on public.events;
create trigger events_notify_insert
  after insert on public.events
  referencing new table as inserted_rows
  for each statement execute function public.notify_on_event_insert();

-- 4b. Membership joins & leaves
create or replace function public.notify_on_member_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_name text;
  v_actor text;
begin
  select name into v_group_name from public.groups where id = new.group_id;
  if v_group_name is null then
    return new;
  end if;

  v_actor := public.actor_display_label(new.user_id);

  insert into public.notifications (
    recipient_id, actor_id, group_id, category, title, body
  )
  select
    gm.user_id,
    new.user_id,
    new.group_id,
    'invites',
    format('%s joined %s', v_actor, v_group_name),
    v_group_name
  from public.group_members gm
  where gm.group_id = new.group_id
    and gm.user_id <> new.user_id
    and public.user_wants_notification(gm.user_id, 'invites');

  return new;
end;
$$;

alter function public.notify_on_member_join() owner to postgres;
revoke all on function public.notify_on_member_join() from public, anon;

drop trigger if exists group_members_notify_join on public.group_members;
create trigger group_members_notify_join
  after insert on public.group_members
  for each row execute function public.notify_on_member_join();

create or replace function public.notify_on_member_leave()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_name text;
  v_actor text;
begin
  select name into v_group_name from public.groups where id = old.group_id;
  if v_group_name is null then
    return old;
  end if;

  v_actor := public.actor_display_label(old.user_id);

  insert into public.notifications (
    recipient_id, actor_id, group_id, category, title, body
  )
  select
    gm.user_id,
    case when exists (select 1 from public.profiles where id = old.user_id) then old.user_id else null end,
    old.group_id,
    'invites',
    format('%s left %s', v_actor, v_group_name),
    v_group_name
  from public.group_members gm
  where gm.group_id = old.group_id
    and gm.user_id <> old.user_id
    and public.user_wants_notification(gm.user_id, 'invites');

  return old;
end;
$$;

alter function public.notify_on_member_leave() owner to postgres;
revoke all on function public.notify_on_member_leave() from public, anon;

drop trigger if exists group_members_notify_leave on public.group_members;
create trigger group_members_notify_leave
  after delete on public.group_members
  for each row execute function public.notify_on_member_leave();

-- 4c. Shared notes & shared lists (throttled to avoid autosave spam)
create or replace function public.notify_on_shared_note_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_actor text;
  v_group_name text;
  v_note_title text;
  v_verb text;
begin
  if new.visibility <> 'shared' or new.deleted_at is not null then
    return new;
  end if;

  if coalesce(trim(new.title), '') = ''
     and (new.content is null or new.content = '{"type":"doc","content":[]}'::jsonb) then
    return new;
  end if;

  v_actor_id := coalesce(auth.uid(), new.created_by);
  if v_actor_id is null then
    return new;
  end if;

  select name into v_group_name from public.groups where id = new.group_id;
  v_actor := public.actor_display_label(v_actor_id);
  v_note_title := coalesce(nullif(trim(new.title), ''), 'Untitled note');
  v_verb := case
    when tg_op = 'INSERT' then 'shared note'
    when old.visibility = 'private' then 'shared note'
    else 'updated note'
  end;

  insert into public.notifications (
    recipient_id, actor_id, group_id, category, title, body, event_id, note_id
  )
  select
    gm.user_id,
    v_actor_id,
    new.group_id,
    'lists',
    format('%s %s "%s"', v_actor, v_verb, v_note_title),
    v_group_name,
    new.event_id,
    new.id
  from public.group_members gm
  where gm.group_id = new.group_id
    and gm.user_id <> v_actor_id
    and public.user_wants_notification(gm.user_id, 'lists')
    and not exists (
      select 1
      from public.notifications n
      where n.recipient_id = gm.user_id
        and n.category = 'lists'
        and n.note_id = new.id
        and n.created_at > now() - interval '30 minutes'
    );

  return new;
end;
$$;

alter function public.notify_on_shared_note_change() owner to postgres;
revoke all on function public.notify_on_shared_note_change() from public, anon;

drop trigger if exists notes_notify_shared_change on public.notes;
create trigger notes_notify_shared_change
  after insert or update of title, content, visibility on public.notes
  for each row execute function public.notify_on_shared_note_change();

create or replace function public.notify_on_list_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_actor text;
  v_group_id uuid;
  v_group_name text;
  v_list_name text;
begin
  v_actor_id := coalesce(auth.uid(), new.created_by);
  if v_actor_id is null then
    return new;
  end if;

  if tg_table_name = 'lists' then
    if tg_op = 'UPDATE' and old.name is not distinct from new.name then
      return new;
    end if;
    v_group_id := new.group_id;
    v_list_name := new.name;
  else
    if tg_op = 'UPDATE'
       and old.content is not distinct from new.content
       and old.is_checked is not distinct from new.is_checked then
      return new;
    end if;
    select group_id, name into v_group_id, v_list_name
    from public.lists
    where id = new.list_id;
  end if;

  if v_group_id is null then
    return new;
  end if;

  select name into v_group_name from public.groups where id = v_group_id;
  v_actor := public.actor_display_label(v_actor_id);

  insert into public.notifications (
    recipient_id, actor_id, group_id, category, title, body
  )
  select
    gm.user_id,
    v_actor_id,
    v_group_id,
    'lists',
    format('%s updated list "%s"', v_actor, coalesce(nullif(trim(v_list_name), ''), 'Shared list')),
    v_group_name
  from public.group_members gm
  where gm.group_id = v_group_id
    and gm.user_id <> v_actor_id
    and public.user_wants_notification(gm.user_id, 'lists')
    and not exists (
      select 1
      from public.notifications n
      where n.recipient_id = gm.user_id
        and n.group_id = v_group_id
        and n.category = 'lists'
        and n.note_id is null
        and n.created_at > now() - interval '15 minutes'
    );

  return new;
end;
$$;

alter function public.notify_on_list_activity() owner to postgres;
revoke all on function public.notify_on_list_activity() from public, anon;

drop trigger if exists lists_notify_insert on public.lists;
create trigger lists_notify_insert
  after insert or update of name on public.lists
  for each row execute function public.notify_on_list_activity();

drop trigger if exists list_items_notify_insert on public.list_items;
create trigger list_items_notify_insert
  after insert or update of content, is_checked on public.list_items
  for each row execute function public.notify_on_list_activity();

-- ---------------------------------------------------------------------------
-- 5. Availability Nudge RPC
-- ---------------------------------------------------------------------------

create or replace function public.send_availability_nudge(
  p_group_id     uuid,
  p_event_id     uuid default null,
  p_recipient_id uuid default null,
  p_message      text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_actor text;
  v_group_name text;
  v_event_title text;
  v_title text;
  v_body text;
  v_inserted integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_member(p_group_id) then
    raise exception 'Not a member of this workspace';
  end if;

  select name into v_group_name from public.groups where id = p_group_id;
  v_actor := public.actor_display_label(v_uid);

  if p_event_id is not null then
    if not public.is_event_in_group(p_event_id, p_group_id) then
      raise exception 'Event does not belong to this workspace';
    end if;
    select title into v_event_title from public.events where id = p_event_id;
    v_title := format('%s nudged you to RSVP to "%s"', v_actor, coalesce(v_event_title, 'an event'));
    v_body := coalesce(nullif(trim(p_message), ''), v_group_name);
  else
    v_title := format('%s asked for your availability in %s', v_actor, coalesce(v_group_name, 'shared calendar'));
    v_body := nullif(trim(p_message), '');
  end if;

  insert into public.notifications (
    recipient_id, actor_id, group_id, category, title, body, event_id
  )
  select
    gm.user_id,
    v_uid,
    p_group_id,
    'nudges',
    v_title,
    v_body,
    p_event_id
  from public.group_members gm
  where gm.group_id = p_group_id
    and gm.user_id <> v_uid
    and (p_recipient_id is null or gm.user_id = p_recipient_id)
    and (
      p_event_id is null
      or p_recipient_id is not null
      or not exists (
        select 1
        from public.event_rsvps r
        where r.event_id = p_event_id
          and r.user_id = gm.user_id
      )
    )
    and public.user_wants_notification(gm.user_id, 'nudges')
    and not exists (
      select 1
      from public.notifications n
      where n.recipient_id = gm.user_id
        and n.actor_id = v_uid
        and n.group_id = p_group_id
        and n.category = 'nudges'
        and n.event_id is not distinct from p_event_id
        and n.created_at > now() - interval '5 minutes'
    );

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

alter function public.send_availability_nudge(uuid, uuid, uuid, text) owner to postgres;
revoke all on function public.send_availability_nudge(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.send_availability_nudge(uuid, uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Extend leave_group to also remove departing user's workspace notifications
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

  -- Sole member: delete the entire workspace (cascades events, RSVPs, notifications, tags, lists, notes, memberships)
  if not exists (
    select 1
    from public.group_members
    where group_id = p_group_id and user_id <> v_uid
  ) then
    delete from public.groups where id = p_group_id;
    return;
  end if;

  -- Other members remain: remove caller's private notes, folders, RSVPs & workspace notifications
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

