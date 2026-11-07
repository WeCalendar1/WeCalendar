# Phase 3: Persisted Notifications & Availability Nudges — Design Spec

**Date:** 2026-11-07
**Branch:** `dev` (PR #27)
**Status:** Active (user requested sensible defaults without interview)

## 1. Intent & Why

On `/profile`, the **Notifications** card renders four checkboxes (`#notif-events`, `#notif-invites`, `#notif-lists`, `#notif-nudges`) that currently use uncontrolled `defaultChecked` props, do not persist across reloads, and have no backing notification feed or nudge trigger. This spec wires persisted notification preferences on `public.profiles`, an in-app Realtime `public.notifications` feed with a navbar bell popover, automatic database triggers for shared workspace activity, and an availability nudge RPC + UI triggers.

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- Persist the four notification category toggles (`events`, `invites`, `lists`, `nudges`) per user in `public.profiles.notification_preferences` with local fallback when unmigrated.
- Store in-app notifications in `public.notifications` with strict recipient-only RLS, `REPLICA IDENTITY FULL`, and Supabase Realtime delivery.
- Generate notifications automatically in PostgreSQL (respecting each recipient's `notification_preferences` and never notifying the actor themselves) for:
  1. `events`: new single or batch/recurring events created in a shared workspace (coalesced to one notification per batch/series insert).
  2. `invites`: members joining or leaving a multi-member shared workspace.
  3. `lists`: shared notes (`public.notes` with `visibility = 'shared'`) and shared lists (`public.lists` / `public.list_items`) created or updated, throttled per recipient to avoid autosave spam.
  4. `nudges`: availability nudges sent by workspace members via `public.send_availability_nudge` (either targeting unanswered members on an event in `CreateEventModal` or nudging the active multi-member workspace in `SharedWorkspace`), rate-limited to 1 nudge per `(actor, group, event)` every 5 minutes.
- Surface unread badge count, mark-read / mark-all-read / clear actions, and click-to-navigate in a `Navbar` notification bell popover.
- Include the user's notifications in `fetchAccountExportBundle` and clean up workspace notifications when leaving a group.

### Non-Goals (Builder Calls)
- Outbound email, SMS, or Web Push VAPID service workers (in-app Realtime notifications keep zero external service/key dependencies).
- Per-workspace overrides (preferences are account-wide on `public.profiles`, matching the `/profile` UI).

### Anti-Goals
- Keystroke-level notification spam when editing Tiptap shared notes or creating 20-occurrence recurring series.
- Allowing authenticated clients to `INSERT` arbitrary rows directly into `public.notifications` (all inserts go through `SECURITY DEFINER` triggers/RPCs).

## 3. Sensible Defaults Chosen (Builder Calls)

1. **Preference defaults:** `{"events": true, "invites": true, "lists": false, "nudges": true}`, matching the existing `defaultChecked` attributes in `src/app/profile/page.tsx`.
2. **Shared notes & lists mapping:** `#notif-lists` is labeled `"Shared notes & list updates"` (`id="notif-lists"` preserved) and governs notifications from both `public.notes` (`visibility = 'shared'`, non-blank title/content, 30-minute cooldown per `(recipient_id, note_id)`) and `public.lists` / `public.list_items` (15-minute cooldown per `(recipient_id, group_id)`).
3. **Batch event coalescing:** Statement-level `AFTER INSERT ON public.events REFERENCING NEW TABLE AS inserted_rows` groups simultaneous inserts by `(group_id, created_by, coalesce(recurrence_group_id::text, id::text))` so creating a recurring series produces a single summary notification per member.
4. **Nudge entry points:**
   - Event-scoped: `"Nudge unanswered (N)"` button inside `CreateEventModal`'s Attendance section when `unansweredCount > 0` in a multi-member group.
   - Workspace-scoped: `"Nudge availability"` button inside `SharedWorkspace` when the active workspace has other members.
5. **Feed retention & cap:** Client queries the 30 most recent notifications (`order("created_at", { ascending: false }).limit(30)`).

## 4. Schema & Security (`supabase/migrations/20261107013000_notifications_and_nudges.sql`)

- `alter table public.profiles add column if not exists notification_preferences jsonb not null default '{"events":true,"invites":true,"lists":false,"nudges":true}'::jsonb;`
- `public.notifications`:
  - `id uuid primary key default gen_random_uuid()`
  - `recipient_id uuid not null references public.profiles(id) on delete cascade`
  - `actor_id uuid references public.profiles(id) on delete set null`
  - `group_id uuid references public.groups(id) on delete cascade`
  - `category text not null check (category in ('events', 'invites', 'lists', 'nudges'))`
  - `title text not null`
  - `body text`
  - `event_id uuid references public.events(id) on delete set null`
  - `note_id uuid references public.notes(id) on delete set null`
  - `read_at timestamptz`
  - `created_at timestamptz not null default now()`
- RLS on `public.notifications`: `SELECT`, `UPDATE`, `DELETE` restricted to `recipient_id = auth.uid()`; `grant select, update, delete on public.notifications to authenticated;`. No `INSERT` policy for `authenticated`.
- `alter table public.notifications replica identity full;` and `alter publication supabase_realtime add table public.notifications;`.
- `SECURITY DEFINER` helpers & RPC (`set search_path = public`, `owner to postgres`, `revoke all ... from public, anon`):
  - `public.user_wants_notification(p_user_id uuid, p_category text) returns boolean`
  - `public.actor_display_label(p_user_id uuid) returns text`
  - `public.send_availability_nudge(p_group_id uuid, p_event_id uuid default null, p_recipient_id uuid default null, p_message text default null) returns integer` (granted to `authenticated`).
- Update `public.leave_group(p_group_id uuid)` to also delete `public.notifications` where `group_id = p_group_id and recipient_id = v_uid` before removing `group_members` (so the `BEFORE DELETE` member-leave trigger still notifies *remaining* members while clearing the departing member's notifications for that workspace).
