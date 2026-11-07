# Persisted Notifications & Availability Nudges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the `/profile` notification preferences in Supabase, generate preference-aware in-app notifications for shared events, membership changes, shared notes/lists, and availability nudges, and surface a live Realtime notification bell in `Navbar` plus nudge triggers in `CreateEventModal` and `SharedWorkspace`.

**Architecture:** Add `profiles.notification_preferences` and `public.notifications` (with recipient-only RLS, `REPLICA IDENTITY FULL`, statement/row triggers, and `send_availability_nudge` RPC) in a new SQL migration. Centralize pure preference normalization, relative-time formatting, unanswered-member counting, and local fallback storage in `src/lib/notifications.ts`, wire `/profile` toggles to `profiles.notification_preferences`, and connect `AppShell` Realtime notifications to `Navbar`, `CreateEventModal`, and `SharedWorkspace`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Supabase (`@supabase/ssr`, PostgreSQL RLS, triggers, Realtime), Tailwind CSS v4, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-11-07-notifications-and-nudges-design.md`

## Global Constraints

- Zero `SUPABASE_SERVICE_ROLE_KEY` requirement and zero new npm dependencies.
- All `SECURITY DEFINER` Postgres functions/triggers must set `search_path = public`, be owned by `postgres`, and `revoke all ... from public, anon` (granting `execute` to `authenticated` only on `send_availability_nudge`).
- Authenticated clients must NOT have direct `INSERT` permission on `public.notifications`; only `SELECT`, `UPDATE`, and `DELETE` on `recipient_id = auth.uid()`.
- Graceful unmigrated degradation: if `notification_preferences` or `public.notifications` does not exist yet (`42P01`, `42703`, `PGRST204`, `PGRST205`), `/profile`, `AppShell`, and `fetchAccountExportBundle` degrade cleanly to local defaults / `[]` without crashing.
- Preserve existing `id="notif-events"`, `id="notif-invites"`, `id="notif-lists"`, and `id="notif-nudges"` checkbox IDs on `/profile` and preserve membership-before-lock ordering in `public.leave_group`.

## Review Focus

- Partial, malformed, or `null` `notification_preferences` JSON in `public.profiles`: `normalizeNotificationPrefs` must fill defaults (`events: true, invites: true, lists: false, nudges: true`) for missing or non-boolean keys — tested in Task 2 (`src/lib/notifications.test.ts`).
- Unmigrated Supabase database missing `public.notifications` (`42P01` / `PGRST205`): `fetchAccountExportBundle` must degrade `notifications` to `[]` while surfacing genuine auth/network errors — tested in Task 1 (`src/lib/accountExport.test.ts`).
- `REPLICA IDENTITY FULL` and absence of client `INSERT` grant/policy on `public.notifications`: Realtime `DELETE` delivery must work under RLS and clients must not be able to spoof notifications — tested in Task 1 (`src/lib/notifications.sql.test.ts` / `src/lib/notifications.test.ts`).
- Unanswered-member calculation for event nudges: `unansweredMemberIdsForEvent` must exclude the current user and anyone with a valid `going` / `maybe` / `declined` RSVP on that event while including members with no RSVP — tested in Task 2 (`src/lib/notifications.test.ts`).
- Autosave / blank shared-note creation: SQL `notify_on_shared_note_change` must ignore private notes, soft-deleted notes (`deleted_at is not null`), and completely blank untitled notes (`trim(title) = ''` and empty Tiptap doc) — tested in Task 1 & verified in SQL migration.

---

### Task 1: Notifications & Nudges SQL Migration, Database Types & Account Export

**Files:**
- Create: `supabase/migrations/20261107013000_notifications_and_nudges.sql`
- Modify: `src/types/database.ts`
- Modify: `src/lib/accountExport.ts`
- Modify: `src/lib/accountExport.test.ts`

**Interfaces:**
- Produces:
  - SQL column `public.profiles.notification_preferences jsonb`, table `public.notifications`, helpers `public.user_wants_notification` & `public.actor_display_label`, triggers `events_notify_insert`, `group_members_notify_join`, `group_members_notify_leave`, `notes_notify_shared_change`, `lists_notify_insert`, `list_items_notify_insert`, RPC `public.send_availability_nudge(p_group_id uuid, p_event_id uuid, p_recipient_id uuid, p_message text) -> integer`, and updated `public.leave_group`.
  - `Database["public"]["Tables"]["profiles"]` updated with `notification_preferences: Json`, `Database["public"]["Tables"]["notifications"]`, and `Database["public"]["Functions"]["send_availability_nudge"]` in `src/types/database.ts`.
  - `AccountExportBundle.notifications: Tables<"notifications">[]` in `src/lib/accountExport.ts`.

- [ ] **Step 1: Write failing tests in `src/lib/accountExport.test.ts`**

Add assertions to existing tests (`expect(bundle.notifications)` in zero-group and group-scoped export tests — note `notifications` are user-scoped by `recipient_id`, so query runs even when `groupIds.length === 0`!), plus a missing-relation fallback test returning `[]` when `notifications` returns `42P01`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/accountExport.test.ts`
Expected: FAIL (`bundle.notifications` is `undefined`).

- [ ] **Step 3: Create `supabase/migrations/20261107013000_notifications_and_nudges.sql`, update `src/types/database.ts`, and update `src/lib/accountExport.ts`**

- Create `20261107013000_notifications_and_nudges.sql` implementing Spec §4:
  - `profiles.notification_preferences` JSONB default `'{"events":true,"invites":true,"lists":false,"nudges":true}'::jsonb`.
  - `public.notifications` table, indexes, `REPLICA IDENTITY FULL`, `supabase_realtime` publication, and RLS policies (`SELECT`, `UPDATE`, `DELETE` for `recipient_id = auth.uid()`, `grant select, update, delete on public.notifications to authenticated`).
  - `user_wants_notification` and `actor_display_label` helpers (`SECURITY DEFINER`, `set search_path = public`, `revoke all ... from public, anon`).
  - Statement-level `events_notify_insert` (`AFTER INSERT ON public.events REFERENCING NEW TABLE AS inserted_rows FOR EACH STATEMENT`) coalescing recurring/batch inserts into one notification per `(group_id, created_by, coalesce(recurrence_group_id::text, id::text))`.
  - `group_members_notify_join` (`AFTER INSERT ON public.group_members`) and `group_members_notify_leave` (`BEFORE DELETE ON public.group_members` when the group still exists and other members remain).
  - `notes_notify_shared_change` (`AFTER INSERT OR UPDATE OF title, content, visibility ON public.notes`) ignoring `visibility <> 'shared'`, `deleted_at is not null`, or blank untitled notes (`trim(new.title) = '' and new.content = '{"type":"doc","content":[]}'::jsonb`), with a 30-minute per-`(recipient_id, note_id)` cooldown.
  - `lists_notify_insert` and `list_items_notify_insert` with a 15-minute per-`(recipient_id, group_id)` cooldown.
  - `public.send_availability_nudge(p_group_id uuid, p_event_id uuid default null, p_recipient_id uuid default null, p_message text default null) returns integer` (`SECURITY DEFINER`, `grant execute ... to authenticated`) enforcing caller group membership, optional `is_event_in_group`, unanswered-member targeting when `p_event_id` is set and `p_recipient_id` is null, 5-minute cooldown per `(actor_id, recipient_id, group_id, event_id)`, and `user_wants_notification(recipient_id, 'nudges')`.
  - Update `public.leave_group(p_group_id uuid)` preserving membership-first `FOR UPDATE` locking and RSVP cleanup, adding `delete from public.notifications where group_id = p_group_id and recipient_id = v_uid;` right before `delete from public.group_members`.
- Update `src/types/database.ts` and `src/lib/accountExport.ts` (querying `supabase.from("notifications").select("*").eq("recipient_id", user.id).order("created_at", { ascending: false })` with `isMissingRelationError` fallback to `[]`).

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run src/lib/accountExport.test.ts && npx tsc --noEmit`
Expected: PASS and exit 0.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261107013000_notifications_and_nudges.sql src/types/database.ts src/lib/accountExport.ts src/lib/accountExport.test.ts
git commit -m "feat: add notifications schema, triggers, nudge RPC, types, and export support"
```

---

### Task 2: Notification Domain Helpers & Persisted `/profile` Notification Toggles

**Files:**
- Create: `src/lib/notifications.ts`
- Create: `src/lib/notifications.test.ts`
- Modify: `src/app/profile/page.tsx`

**Interfaces:**
- Consumes: `Tables<"notifications">`, `Json` from `src/types/database.ts`; `EventRsvp` from `src/lib/rsvps.ts`.
- Produces (in `src/lib/notifications.ts`):
  - `export type NotificationCategory = "events" | "invites" | "lists" | "nudges";`
  - `export type NotificationPrefs = Record<NotificationCategory, boolean>;`
  - `export type AppNotification = Tables<"notifications">;`
  - `export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs` (`{ events: true, invites: true, lists: false, nudges: true }`)
  - `export function normalizeNotificationPrefs(raw: unknown): NotificationPrefs`
  - `export function readLocalNotificationPrefs(): NotificationPrefs`
  - `export function writeLocalNotificationPrefs(prefs: NotificationPrefs): void`
  - `export function isMissingColumnOrRelationError(error: { code?: string | null; message?: string | null } | null | undefined): boolean`
  - `export function countUnreadNotifications(items: readonly Pick<AppNotification, "read_at">[]): number`
  - `export function formatNotificationRelativeTime(createdAtIso: string, nowMs?: number): string`
  - `export function unansweredMemberIdsForEvent(eventId: string, memberIds: readonly string[], rsvps: readonly Pick<EventRsvp, "event_id" | "user_id" | "status">[], currentUserId?: string | null): string[]`

- [ ] **Step 1: Write failing unit tests in `src/lib/notifications.test.ts`**

Test:
1. `normalizeNotificationPrefs` handles `null`, arrays, partial objects, and non-boolean values cleanly.
2. `readLocalNotificationPrefs` / `writeLocalNotificationPrefs` round-trip via `localStorage` under `"wecalendar.pref.notifications"`.
3. `countUnreadNotifications` and `formatNotificationRelativeTime` (`"Just now"`, `"5m ago"`, `"3h ago"`, `"Yesterday"`, `"4d ago"`).
4. `unansweredMemberIdsForEvent` excludes `currentUserId` and members with valid RSVPs (`going`/`maybe`/`declined`) on `eventId`, keeping members with no RSVP or RSVPs only on other events.
5. SQL contract check on `supabase/migrations/20261107013000_notifications_and_nudges.sql`: verifies `alter table public.notifications replica identity full;`, `revoke all on function public.send_availability_nudge`, and NO `for insert` RLS policy on `public.notifications`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/notifications.test.ts`
Expected: FAIL (`Cannot find module './notifications'`).

- [ ] **Step 3: Implement `src/lib/notifications.ts` and wire persisted toggles in `src/app/profile/page.tsx`**

- Implement `src/lib/notifications.ts`.
- In `src/app/profile/page.tsx`:
  - Load `notification_preferences` alongside `profiles` on mount (falling back gracefully via `isMissingColumnOrRelationError` to `readLocalNotificationPrefs()`, and syncing loaded DB prefs to `writeLocalNotificationPrefs`).
  - Replace the uncontrolled `defaultChecked` checkboxes in the **Notifications** `SectionCard` with controlled `checked={notifPrefs[key]}` inputs (`#notif-events`, `#notif-invites`, `#notif-lists` labeled `"Shared notes & list updates"`, `#notif-nudges`), optimistic state + `writeLocalNotificationPrefs(next)`, and `supabase.from("profiles").update({ notification_preferences: next }).eq("id", userId)` with inline `"Saved"` / error feedback (degrading cleanly to local persistence if the column migration has not been run yet).

- [ ] **Step 4: Run tests, lint, and typecheck**

Run: `npx vitest run src/lib/notifications.test.ts && npx tsc --noEmit && npm run lint`
Expected: PASS and exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/notifications.ts src/lib/notifications.test.ts src/app/profile/page.tsx
git commit -m "feat: persist profile notification preferences with domain helpers"
```

---

### Task 3: Navbar Notification Bell Popover & Nudge Controls in `CreateEventModal` / `SharedWorkspace`

**Files:**
- Modify: `src/components/Navbar/Navbar.tsx`
- Modify: `src/components/CreateEventModal/CreateEventModal.tsx`
- Modify: `src/components/SharedWorkspace/SharedWorkspace.tsx`
- Modify: `src/components/Sidebar/Sidebar.tsx`

**Interfaces:**
- Consumes: `AppNotification`, `countUnreadNotifications`, `formatNotificationRelativeTime`, `unansweredMemberIdsForEvent` from `src/lib/notifications.ts`.
- Produces:
  - Extended `NavbarProps`:
    - `notifications?: readonly AppNotification[]`
    - `onSelectNotification?: (notification: AppNotification) => void`
    - `onMarkAllNotificationsRead?: () => void`
    - `onClearNotifications?: () => void`
    - `onDismissNotification?: (notificationId: string) => void`
  - Extended `CreateEventModalProps`:
    - `onNudgeUnanswered?: (eventId: string) => Promise<number>`
  - Extended `SharedWorkspaceProps` & `SidebarProps`:
    - `otherMemberCount?: number`
    - `onNudgeGroupAvailability?: () => Promise<number>`

- [ ] **Step 1: Add `NotificationBell` popover to `src/components/Navbar/Navbar.tsx`**

Render a bell button right before `ProfileMenu` with an unread badge (`1`–`9+`) when `countUnreadNotifications(notifications) > 0`. Clicking toggles an accessible popover (`role="dialog"`, outside-click & Escape dismiss) with `"Mark all read"`, `"Clear"`, empty state `"You're all caught up"`, and rows showing category icon, unread indicator, `title`, optional `body`, `formatNotificationRelativeTime(n.created_at)`, click handler `onSelectNotification?.(n)`, and dismiss button `onDismissNotification?.(n.id)`.

- [ ] **Step 2: Add event & workspace nudge triggers in `CreateEventModal.tsx`, `SharedWorkspace.tsx`, and `Sidebar.tsx`**

- In `CreateEventModal.tsx`: compute `unansweredCount = unansweredMemberIdsForEvent(event.id, [...groupProfilesById.keys()], eventRsvps, currentUserId).length`. When `isEditing && event && onNudgeUnanswered && unansweredCount > 0`, show a `"Nudge unanswered (${unansweredCount})"` pill button in the Attendance header with inline status feedback (`"Nudged ${sent} member(s)"` or `"Already nudged recently"` when `sent === 0`).
- In `SharedWorkspace.tsx` (and forwarded through `Sidebar.tsx`): when `activeGroup && (otherMemberCount ?? 0) > 0 && onNudgeGroupAvailability`, render a compact `"Nudge availability"` button with inline status feedback.

- [ ] **Step 3: Run typecheck, lint, and tests**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: PASS and exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/Navbar/Navbar.tsx src/components/CreateEventModal/CreateEventModal.tsx src/components/SharedWorkspace/SharedWorkspace.tsx src/components/Sidebar/Sidebar.tsx
git commit -m "feat: add Navbar notification bell popover and availability nudge controls"
```

---

### Task 4: Wire Realtime Notifications & Nudge Handlers in `AppShell`

**Files:**
- Modify: `src/components/AppShell/AppShell.tsx`

**Interfaces:**
- Consumes: `AppNotification`, `isMissingColumnOrRelationError` from `src/lib/notifications.ts`; extended props on `Navbar`, `Sidebar`, and `CreateEventModal` from Task 3.
- Produces: End-to-end live notification loading, Realtime updates, read/dismiss actions, contextual navigation on notification click, and `send_availability_nudge` RPC wiring.

- [ ] **Step 1: Wire `notifications` state, Realtime subscription, navigation, and nudge RPC handlers in `src/components/AppShell/AppShell.tsx`**

- Add `notifications` state (`AppNotification[]`), `loadNotifications(userId)` (queries `notifications` `.select("*").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(30)`, degrading to `[]` on `isMissingColumnOrRelationError`), and a user-scoped Realtime channel `user-notifications:${user.id}` on `{ event: "*", schema: "public", table: "notifications", filter: \`recipient_id=eq.${user.id}\` }`.
- Implement `handleMarkNotificationRead`, `handleMarkAllNotificationsRead`, `handleDismissNotification`, `handleClearNotifications` (optimistic state updates + Supabase `.update({ read_at })` / `.delete()`), and `handleSelectNotification(n)` (marks read, switches `activeGroupId` if `n.group_id` differs, opens `CreateEventModal` if `n.event_id` matches a loaded event or jumps `viewDate` to it, or switches to `"notes"` view and selects `n.note_id` if `n.note_id` is set).
- Implement `handleNudgeUnanswered(eventId)` and `handleNudgeGroupAvailability()` calling `supabase.rpc("send_availability_nudge", ...)`.
- Pass notification props to `<Navbar />`, `otherMemberCount` + `onNudgeGroupAvailability` to `<Sidebar />`, and `onNudgeUnanswered={handleNudgeUnanswered}` to `<CreateEventModal />`.

- [ ] **Step 2: Run full verification (`tsc`, `lint`, `test`, `build`)**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: All four commands exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/AppShell/AppShell.tsx
git commit -m "feat: wire Realtime notifications, contextual navigation, and nudge RPC in AppShell"
```
