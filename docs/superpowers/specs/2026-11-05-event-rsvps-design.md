# Phase 2: Event RSVPs & `showDeclinedEvents` — Design Spec

**Date:** 2026-11-05  
**Branch:** `dev` (PR #27)  
**Scope:** Relational per-member event RSVPs (`going` / `maybe` / `declined`), live Realtime updates, modal RSVP controls & group tally, conflict-alert exclusion on decline, and wiring the `Show declined events` preference across all calendar views.

---

## 1. Intent & Why

WeCalendar is a shared workspace calendar where multiple members coordinate schedules together, and PR #27 currently exposes a `Show declined events` toggle on `/profile` (`wecalendar.pref.showDeclinedEvents`) with no backing RSVP model. Members need a lightweight, race-free way to mark whether they are **Going**, **Maybe**, or **Declined** on any shared event, see who else in the group is attending, stop receiving personal conflict warnings for events they have declined, and choose whether declined events disappear from their calendar or stay visible at reduced opacity.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- Allow any authenticated member of an event's workspace to set, change, or clear their RSVP (`going` | `maybe` | `declined`) on existing events, with optional one-click application across a recurring series (`recurrence_group_id`).
- Show every group member's RSVP response (`Going`, `Maybe`, `Declined`) inside `CreateEventModal` when viewing/editing an event, updating live across browsers via Supabase Realtime.
- Wire `prefs.showDeclinedEvents` end-to-end:
  - When `false` (default): hide events the current user has declined from calendar views and the Agenda panel (`EventViewerPanel`).
  - When `true`: display declined events at reduced opacity (`0.45`) with a struck-through title across Month (`CalendarCell` bars & chips), Week/Day (`TimeGrid`), and Agenda (`EventViewerPanel`).
- Exclude events the current user has declined from personal conflict detection (`conflictGroups` toast/outlines in `AppShell` and `softOverlap` warnings in `CreateEventModal`), even when `prefs.showDeclinedEvents` is `true`.
- Automatically reset existing RSVPs when an event's `starts_at` or `ends_at` is rescheduled so all members re-confirm (and anyone who previously declined sees the rescheduled event again), while preserving RSVPs on title/description/tag-only edits (including recurring series edits).
- Keep group/account lifecycle & data export consistent: clean up a member's RSVPs when they leave a group, cascade on event/group/profile deletion, and include `eventRsvps` in `fetchAccountExportBundle`.

### Non-Goals
- External email RSVP invitations (`mailto:` / iMIP) or per-event invitee subsets (all members of a shared workspace can view and RSVP to workspace events).
- RSVP-triggered in-app notifications (notifications are scoped to Phase 3).
- Showing RSVPs on unsaved draft events during initial creation (creator can RSVP immediately after saving, or no implicit auto-RSVP is forced so counts reflect explicit responses).

### Anti-Goals
- Never allow one member's RSVP action to overwrite another member's RSVP or bump `events.updated_at`.
- Never allow non-members of a workspace to read or write RSVPs for that workspace's events.

---

## 3. Constraints

- **Stack:** Next.js 16 (App Router, client Supabase SDK `@supabase/ssr`), PostgreSQL with Row Level Security (RLS) and `supabase_realtime`, TypeScript strict mode, Tailwind CSS v4, Vitest.
- **Zero service-role dependency:** All RSVP reads/writes use the authenticated client and RLS policies; lifecycle cleanup extends existing `SECURITY DEFINER` RPCs (`leave_group`, `leave_all_groups`).
- **Zero new npm dependencies.**
- **Backwards-compatible graceful load:** If the new migration has not yet been applied to a developer's Supabase instance, `loadEventRsvps` logs a warning and degrades to an empty RSVP list rather than crashing `AppShell`.

---

## 4. Approaches Considered

### Approach A (Selected): Dedicated `public.event_rsvps` table + RLS + Realtime
- Create `public.event_rsvps (event_id, group_id, user_id, status, created_at, updated_at, primary key (event_id, user_id))`.
- Mirrors `public.event_tags` with per-user RLS (`user_id = auth.uid()`), `ON DELETE CASCADE` foreign keys to `events`, `groups`, and `profiles`, Realtime publication, and pure helper functions in `src/lib/rsvps.ts`.
- **Why chosen:** Eliminates concurrent write races when multiple members RSVP simultaneously, keeps `events.updated_at` untouched, enforces per-user ownership in RLS without custom RPCs, and cascades cleanly.

### Approach B (Rejected): `rsvps jsonb` map column on `public.events`
- Store `{ "<user_id>": "going" | "maybe" | "declined" }` on `public.events`.
- **Why rejected:** Client JSON updates race under concurrent RSVPs unless wrapped in an RPC, every RSVP mutates the `events` row and `updated_at`, and `leave_group` / `delete_own_account` would have to rewrite JSON blobs across rows instead of using relational cascades.

---

## 5. Detailed Design

### 5.1 Database Migration (`supabase/migrations/20261105230000_event_rsvps.sql`)

1. **Table `public.event_rsvps`:**
   ```sql
   create table if not exists public.event_rsvps (
     event_id   uuid not null references public.events (id) on delete cascade,
     group_id   uuid not null references public.groups (id) on delete cascade,
     user_id    uuid not null references public.profiles (id) on delete cascade,
     status     text not null check (status in ('going', 'maybe', 'declined')),
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now(),
     primary key (event_id, user_id)
   );
   ```
   - Indexes: `event_rsvps_group_id_idx on public.event_rsvps (group_id)` and `event_rsvps_user_id_idx on public.event_rsvps (user_id)`.
   - `before update` trigger `event_rsvps_set_updated_at` calling `public.set_updated_at()`.
   - Integrity check function/policy ensuring `event_rsvps.group_id` matches the target `events.group_id`:
     ```sql
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
     revoke all on function public.is_event_in_group(uuid, uuid) from public, anon;
     grant execute on function public.is_event_in_group(uuid, uuid) to authenticated;
     ```

2. **Row Level Security (`public.event_rsvps`):**
   - `SELECT`: `public.is_group_member(group_id)` — any workspace member can see all RSVPs in that workspace.
   - `INSERT`: `with check (user_id = auth.uid() and public.is_group_member(group_id) and public.is_event_in_group(event_id, group_id))`
   - `UPDATE`: `using (user_id = auth.uid() and public.is_group_member(group_id))` and `with check (user_id = auth.uid() and public.is_group_member(group_id) and public.is_event_in_group(event_id, group_id))`
   - `DELETE`: `using (user_id = auth.uid() and public.is_group_member(group_id))`
   - Grants: `grant select, insert, update, delete on public.event_rsvps to authenticated;`

3. **Reschedule Reset Trigger (`public.events`):**
   - Add `SECURITY DEFINER` trigger function `public.reset_event_rsvps_on_reschedule()` bound `after update of starts_at, ends_at on public.events for each row`:
     ```sql
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
     ```
   - Title, description, or tag edits leave RSVPs intact; changing `starts_at` or `ends_at` clears all members' RSVPs for that occurrence so everyone re-confirms and previously declined members see the rescheduled event again.

4. **Realtime Publication:**
   - Add `public.event_rsvps` to `supabase_realtime` (`alter publication supabase_realtime add table public.event_rsvps;` inside an idempotent `duplicate_object` guard).

5. **Lifecycle RPC Update (`leave_group`):**
   - Replace `public.leave_group(p_group_id uuid)` (preserving the Phase 1 membership-first double-checked `FOR UPDATE` lock!) to also execute:
     ```sql
     delete from public.event_rsvps
     where group_id = p_group_id
       and user_id = v_uid;
     ```
     when other members remain in the workspace (`leave_all_groups` delegates to `leave_group`, and `delete_own_account` cascades via `profiles(id) on delete cascade`).

### 5.2 TypeScript Types & Pure Domain Helpers (`src/types/database.ts`, `src/lib/rsvps.ts`, `src/lib/events.ts`)

1. **`src/types/database.ts`:**
   - Add `event_rsvps` table (`Row`, `Insert`, `Update`, `Relationships`) and `is_event_in_group` RPC signature.
2. **`src/lib/rsvps.ts` (new, unit-tested in `src/lib/rsvps.test.ts`):**
   - `export type RsvpStatus = "going" | "maybe" | "declined";`
   - `export type EventRsvp = Pick<Tables<"event_rsvps">, "event_id" | "group_id" | "user_id" | "status" | "updated_at">;`
   - `export type RsvpMemberSummary = { userId: string; displayName: string; avatarUrl: string | null; status: RsvpStatus };`
   - `rsvpMapForUser(rsvps: readonly EventRsvp[], userId: string | null | undefined): Map<string, RsvpStatus>` — maps `event_id → RsvpStatus` for the signed-in user.
   - `summarizeEventRsvps(eventId: string, rsvps: readonly EventRsvp[], profilesById: ReadonlyMap<string, { display_name: string | null; avatar_url?: string | null }>, currentUserId?: string | null)` — returns `{ myStatus: RsvpStatus | null, counts: { going: number; maybe: number; declined: number }, respondents: RsvpMemberSummary[] }` sorted with the current user first, then `going` → `maybe` → `declined`, then alphabetically by `displayName`.
   - `filterVisibleEvents<T extends { myRsvp?: RsvpStatus | null }>(events: readonly T[], showDeclinedEvents: boolean): T[]` — filters out `myRsvp === "declined"` when `!showDeclinedEvents`.
   - `filterConflictCandidateEvents<T extends { ends_at: string; myRsvp?: RsvpStatus | null }>(events: readonly T[], options: { hidePastConflicts: boolean; nowMs?: number }): T[]` — excludes events with `myRsvp === "declined"` (and past events when `hidePastConflicts` is enabled) before passing to `conflictingEventGroups`.
3. **`src/lib/events.ts`:**
   - Extend `CalendarEvent` with optional `myRsvp?: RsvpStatus | null;` so every view component receives the signed-in user's RSVP status directly on each `CalendarEvent` without extra prop drilling.
   - *(Engineering call)* Add pure helper `reconcileSeriesUpdate(existingEvents, drafts, params)` (unit-tested in `src/lib/events.test.ts`) that matches recurring series occurrences by local start-date key (`YYYY-MM-DD`): matched dates return in-place `updates` (preserving `event.id`, linked `notes.event_id`, and `event_rsvps` when times are unchanged, while triggering `reset_event_rsvps_on_reschedule` if times changed), removed dates return `deleteIds`, and new dates return pre-ID'd `inserts`. Wire `handleUpdateSeries` in `AppShell.tsx` to use `reconcileSeriesUpdate` instead of delete-all + recreate.

### 5.3 App State, Realtime & Export (`src/components/AppShell/AppShell.tsx`, `src/lib/accountExport.ts`)

1. **`AppShell` Data Loading & Realtime:**
   - Add `eventRsvps` state (`EventRsvp[]`) and `groupProfilesById` state (`Map<string, { display_name: string | null; avatar_url: string | null }>`), populated for the active group's `group_members` + `profiles` (reusing the avatar-column fallback pattern from `loadEvents`).
   - Add `loadEventRsvps(groupId)` querying `supabase.from("event_rsvps").select("event_id, group_id, user_id, status, updated_at").eq("group_id", groupId)`. If the query fails (e.g. migration not yet run), log `console.warn` and keep `[]`.
   - Subscribe on the existing group Realtime channel:
     - `{ event: "*", schema: "public", table: "event_rsvps" }` → `void loadEventRsvps(activeGroupId)` (unfiltered table subscription so `DELETE` events when clearing an RSVP always fire even with default `REPLICA IDENTITY`, while RLS restricts delivery to the user's groups).
     - `{ event: "*", schema: "public", table: "group_members", filter: \`group_id=eq.${activeGroupId}\` }` → refresh `groupProfilesById`.
2. **Deriving `eventsWithRsvp`, `filteredEvents` & `conflictGroups`:**
   - `eventsWithRsvp`: `useMemo` enriching each `CalendarEvent` with `myRsvp: myRsvpByEventId.get(event.id) ?? null`. Keep `selectedEvent` synchronized with `eventsWithRsvp`.
   - `filteredEvents`: apply `filterVisibleEvents(eventsWithRsvp, prefs.showDeclinedEvents)` alongside text search and tag filters.
   - `conflictGroups`: compute from `filterConflictCandidateEvents(eventsWithRsvp, { hidePastConflicts: prefs.hidePastConflicts })` so declining an event immediately clears any conflict toast/red outline caused by that event!
3. **RSVP Mutation Handler (`handleSetEventRsvp`):**
   - Signature: `(targetEventIds: string[], status: RsvpStatus | null) => Promise<void>`.
   - Optimistically updates `eventRsvps` state immediately, then:
     - If `status === null`: deletes rows from `event_rsvps` where `user_id = user.id` and `event_id in targetEventIds`.
     - Otherwise: upserts rows `{ event_id, group_id: activeGroupId, user_id: user.id, status }` with `{ onConflict: "event_id,user_id" }`.
   - On error, rolls back via `await loadEventRsvps(activeGroupId)` and surfaces error message in the modal.
4. **Account Export (`src/lib/accountExport.ts`):**
   - Include `eventRsvps: Tables<"event_rsvps">[]` in `AccountExportBundle` (queried via `.in("group_id", groupIds)`, degrading gracefully to `[]` if table is absent).

### 5.4 Modal UI & Dimmed Declined Rendering

1. **`CreateEventModal` (`src/components/CreateEventModal/CreateEventModal.tsx`):**
   - When `isEditing && event`: render an **Attendance** section right above Notes/Tags:
     - Three segmented pills: **Going**, **Maybe**, **Declined** (`aria-pressed`, keyboard-accessible). Clicking the currently selected pill clears the user's RSVP (`status = null`).
     - Saving is immediate (independent of the form's "Save changes" submit button) so a member opening an event just to RSVP can click a pill and close.
     - When `seriesEvents.length > 1` (`Boolean(event.recurrence_group_id)`), render a compact checkbox `"Apply RSVP to all ${seriesEvents.length} events in series"` (unchecked by default so single-occurrence exceptions work naturally; when checked, clicking a pill applies to `seriesEvents.map((e) => e.id)`).
     - Below the pills, display a live summary row (`Going · N`, `Maybe · N`, `Declined · N`) and compact respondent chips showing each responder's display name (or `"You"`) and status badge.
   - **`softOverlap` exclusion:** Ignore existing events where `existing.myRsvp === "declined"`, and suppress `softOverlap` if the current event being edited has `myStatus === "declined"`.
2. **Dimmed Declined Event Rendering (`prefs.showDeclinedEvents === true`):**
   - **`CalendarCell.tsx`** (Month multi-day bars & single-day chips): when `event.myRsvp === "declined"`, apply `opacity: 0.45` and `line-through` on the event title text.
   - **`TimeGrid.tsx`** (Week & Day views): when `event.myRsvp === "declined"`, apply `opacity: 0.45` and `line-through` on `event.title`.
   - **`EventViewerPanel.tsx`** (`EventRow` in Agenda panel): when `event.myRsvp === "declined"`, apply `opacity: 0.5` on the row container and `line-through` on `event.title`, plus a subtle `"Declined"` pill next to the time range.

---

## 6. Left to the Builder

- Exact colour tokens for the `Going` (emerald/success), `Maybe` (amber), and `Declined` (danger/red) pills using existing CSS variables in `globals.css`.
- Exact layout spacing of respondent chips inside `CreateEventModal` so long member lists wrap cleanly without pushing modal actions off-screen.

