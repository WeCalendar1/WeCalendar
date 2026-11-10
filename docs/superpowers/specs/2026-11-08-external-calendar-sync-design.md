# Phase 5: External Calendar Sync & Unsync Calendar — Design Spec

**Date:** 2026-11-08
**Branch:** `dev`
**Status:** Active (user requested sensible defaults without interview)

## 1. Intent & Why

On `/profile`, the Danger Zone renders `#unsync-calendar-btn` (*"Unsync calendar — Disconnect your Google Calendar or Outlook sync"*) without an `onClick` handler or backing sync model. This spec wires end-to-end external calendar synchronization using standard RFC 5545 iCalendar (`.ics`) feed URLs and `.ics` file imports/exports (supported natively by Google Calendar, Outlook, and Apple Calendar without OAuth app secrets) and connects `#unsync-calendar-btn` to disconnect synced calendars and remove their imported events.

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- Allow users on `/profile` to sync external calendars into their active shared workspace via:
  1. **`.ics` Subscription URL** (`https://` or `webcal://` from Google Calendar, Outlook, Apple Calendar, or any iCal feed), fetched through an authenticated, SSRF-hardened Next.js route handler (`POST /api/calendar-sync/fetch`).
  2. **`.ics` File Upload** (`.ics` exported from Google Calendar, Outlook, or Apple Calendar).
  3. **`.ics` Workspace Export** (download the active workspace's events as a standard `.ics` file).
- Persist synced sources in `public.calendar_syncs` and link imported events via `public.events.sync_id` (`ON DELETE CASCADE`) and `public.events.external_uid` so re-syncing a feed updates existing imported events idempotently without duplicating them, and disconnecting a sync automatically removes its imported events.
- Wire `#unsync-calendar-btn` in the `/profile` Danger Zone to `public.unsync_my_calendars`, disconnecting all of the user's synced external calendars, deleting their synced events, clearing local sync fallback state, and displaying confirmation feedback.
- Degrade gracefully to local storage + client-side event cleanup when `20261108210000_calendar_sync.sql` has not yet been applied on the hosted Supabase instance.
- Include `calendarSyncs` in `fetchAccountExportBundle` and clean up a departing member's workspace syncs in `public.leave_group`.

### Non-Goals (Builder Calls)
- Two-way OAuth write-back to Google/Microsoft REST APIs (requires per-environment Google Cloud / Azure AD OAuth client IDs, secrets, and verification).
- Complex `RRULE` expansion beyond standard single/recurring `VEVENT` instances exported in `.ics` feeds.

### Anti-Goals
- Unvalidated server-side URL fetching (SSRF to localhost, private IPv4/IPv6 ranges, link-local metadata endpoints, non-HTTPS protocols, or HTTP redirects must be rejected).
- Leaving orphaned imported events behind when a user clicks **Unsync calendar** (`#unsync-calendar-btn`) or leaves a workspace.

## 3. Sensible Defaults Chosen (Builder Calls)

1. **Provider auto-detection:** Automatically classify `.ics` URLs/labels as `google`, `outlook`, `apple`, or `ics` from hostname/filename hints.
2. **All-day & multi-day `VALUE=DATE` conversion:** RFC 5545 exclusive `DTEND;VALUE=DATE` dates (e.g., `DTSTART;VALUE=DATE:20261110`, `DTEND;VALUE=DATE:20261111`) map to WeCalendar's inclusive local day span (`2026-11-10T00:00:00` to `2026-11-10T23:59:00`).
3. **Feed cap & size limit:** Cap `.ics` responses at `2 MB` and `500` events per sync to prevent oversized feed abuse.
4. **Unsync scope:** `#unsync-calendar-btn` in Danger Zone disconnects all external calendar syncs owned by the current user (`unsync_my_calendars()`) and cascades deletion to all events imported by those syncs; individual syncs can also be refreshed or disconnected from the **External Calendar Sync** section on `/profile`.

## 4. Schema & Security (`supabase/migrations/20261108210000_calendar_sync.sql`)

- `public.calendar_syncs`:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references public.profiles(id) on delete cascade`
  - `group_id uuid not null references public.groups(id) on delete cascade`
  - `provider text not null default 'ics' check (provider in ('google', 'outlook', 'apple', 'ics'))`
  - `label text not null check (char_length(trim(label)) > 0)`
  - `source_url text`
  - `last_synced_at timestamptz not null default now()`
  - `synced_event_count integer not null default 0 check (synced_event_count >= 0)`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- `public.events` additions:
  - `sync_id uuid references public.calendar_syncs(id) on delete cascade`
  - `external_uid text`
  - Unique index `events_sync_external_uid_idx on public.events (sync_id, external_uid) where sync_id is not null and external_uid is not null`
- RLS & Realtime:
  - `alter table public.calendar_syncs enable row level security;`
  - `alter table public.calendar_syncs replica identity full;`
  - Owner-only `SELECT`, `INSERT` (requiring `public.is_group_member(group_id)`), `UPDATE` (requiring `public.is_group_member(group_id)`), and `DELETE` (`user_id = auth.uid()`).
  - Same-group trigger `events_enforce_sync_same_group` (`BEFORE INSERT OR UPDATE OF sync_id, group_id ON public.events`) via `public.is_sync_in_group(uuid, uuid)`.
- `public.unsync_my_calendars(p_group_id uuid default null) returns integer` (`SECURITY DEFINER`, `set search_path = public`, `owner to postgres`, `revoke all ... from public, anon`, `grant execute ... to authenticated`): deletes caller's `calendar_syncs` (cascading to synced `events`) and returns the number of removed syncs.
- Update `public.leave_group(p_group_id uuid)` to delete `public.calendar_syncs` for `(group_id = p_group_id and user_id = v_uid)` before removing `group_members`.
