-- Notes: folders + rich-text notes with shared/private visibility and event/date links
-- Idempotent: tables may already exist from a prior preview or manual apply.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.note_folders (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  name        text not null,
  visibility  text not null default 'shared'
    check (visibility in ('shared', 'private')),
  sort_order  integer not null default 0,
  created_by  uuid not null references public.profiles (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.notes (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references public.groups (id) on delete cascade,
  folder_id       uuid references public.note_folders (id) on delete set null,
  event_id        uuid references public.events (id) on delete set null,
  linked_date     date,
  title           text not null default '',
  content         jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  content_format  text not null default 'tiptap'
    check (content_format in ('tiptap', 'markdown', 'plain')),
  visibility      text not null default 'shared'
    check (visibility in ('shared', 'private')),
  is_pinned       boolean not null default false,
  sort_order      integer not null default 0,
  created_by      uuid not null references public.profiles (id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists note_folders_group_id_idx on public.note_folders (group_id);
create index if not exists notes_group_id_idx on public.notes (group_id);
create index if not exists notes_folder_id_idx on public.notes (folder_id);
create index if not exists notes_event_id_idx on public.notes (event_id) where event_id is not null;
create index if not exists notes_linked_date_idx on public.notes (group_id, linked_date) where linked_date is not null;
create index if not exists notes_pinned_updated_idx on public.notes (group_id, is_pinned desc, updated_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists note_folders_set_updated_at on public.note_folders;
create trigger note_folders_set_updated_at
  before update on public.note_folders
  for each row execute function public.set_updated_at();

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create or replace function public.validate_note_event_group()
returns trigger
language plpgsql
as $$
begin
  if new.event_id is not null then
    if not exists (
      select 1 from public.events e
      where e.id = new.event_id and e.group_id = new.group_id
    ) then
      raise exception 'event must belong to the same group as the note';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists notes_validate_event_group on public.notes;
create trigger notes_validate_event_group
  before insert or update on public.notes
  for each row execute function public.validate_note_event_group();

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

create or replace function public.can_view_note_folder(p_folder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.note_folders f
    where f.id = p_folder_id
      and (
        (f.visibility = 'shared' and public.is_group_member(f.group_id))
        or (f.visibility = 'private' and f.created_by = auth.uid())
      )
  );
$$;

create or replace function public.can_view_note(p_note_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.notes n
    where n.id = p_note_id
      and (
        (n.visibility = 'shared' and public.is_group_member(n.group_id))
        or (n.visibility = 'private' and n.created_by = auth.uid())
      )
  );
$$;

create or replace function public.can_edit_note(p_note_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.notes n
    where n.id = p_note_id
      and public.is_group_member(n.group_id)
      and (
        n.visibility = 'shared'
        or n.created_by = auth.uid()
      )
  );
$$;

grant execute on function public.can_view_note_folder(uuid) to authenticated;
grant execute on function public.can_view_note(uuid) to authenticated;
grant execute on function public.can_edit_note(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

alter table public.note_folders enable row level security;
alter table public.notes enable row level security;

drop policy if exists "View note folders" on public.note_folders;
create policy "View note folders"
  on public.note_folders for select
  using (
    (visibility = 'shared' and public.is_group_member(group_id))
    or (visibility = 'private' and created_by = auth.uid())
  );

drop policy if exists "Create note folders" on public.note_folders;
create policy "Create note folders"
  on public.note_folders for insert
  with check (
    public.is_group_member(group_id) and created_by = auth.uid()
  );

drop policy if exists "Update note folders" on public.note_folders;
create policy "Update note folders"
  on public.note_folders for update
  using (public.can_view_note_folder(id))
  with check (public.is_group_member(group_id));

drop policy if exists "Delete note folders" on public.note_folders;
create policy "Delete note folders"
  on public.note_folders for delete
  using (public.can_view_note_folder(id));

drop policy if exists "View notes" on public.notes;
create policy "View notes"
  on public.notes for select
  using (
    (visibility = 'shared' and public.is_group_member(group_id))
    or (visibility = 'private' and created_by = auth.uid())
  );

drop policy if exists "Create notes" on public.notes;
create policy "Create notes"
  on public.notes for insert
  with check (
    public.is_group_member(group_id)
    and created_by = auth.uid()
    and (folder_id is null or public.can_view_note_folder(folder_id))
    and (event_id is null or public.is_event_group_member(event_id))
  );

drop policy if exists "Update notes" on public.notes;
create policy "Update notes"
  on public.notes for update
  using (public.can_edit_note(id))
  with check (public.is_group_member(group_id));

drop policy if exists "Delete notes" on public.notes;
create policy "Delete notes"
  on public.notes for delete
  using (public.can_edit_note(id));

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.note_folders;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notes;
exception when duplicate_object then null;
end $$;

grant select, insert, update, delete on public.note_folders to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
