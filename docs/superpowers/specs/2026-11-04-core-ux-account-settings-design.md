# Phase 1 Design: Core UX & Account Settings

- **Date:** 2026-11-04
- **Status:** Draft (pending approval)
- **Scope:** Sub-project 1 of 5 in the UX & Backend Completion roadmap

## 1. Intent & Why

Several settings and controls currently visible in WeCalendar either write to `localStorage` without affecting the UI, have no click handlers attached, fail on legitimate multi-day inputs, or trap brand-new users on an empty screen with hidden workspace controls. Phase 1 makes every existing calendar preference, shell navigation affordance, and account/workspace lifecycle action work end to end before adding new product tables (RSVPs, Notifications, Map, `.ics` sync) in Phases 2–5.

## 2. Goals, Non-Goals & Anti-Goals

### Goals
1. **Wire `defaultView` and `weekStartsOnMonday`** across all calendar views, pickers, event-bar row-wrapping, and agenda week bucketing, updating reactively in the same tab and across tabs.
2. **Fix first-login / zero-group onboarding** so users without a workspace always see workspace create/join controls in the sidebar and have a direct action button in the empty-state banners on both Calendar and Notes views.
3. **Fix multi-day event time validation** in `CreateEventModal` so events spanning multiple days can end at an earlier clock time than their start time (e.g., Friday 6:00 PM → Sunday 11:00 AM).
4. **Make `MiniCalendar` interactive** — clicking any day navigates `viewDate` to that date, with previous/next month buttons for browsing independently of `viewDate`.
5. **Render uploaded user avatars in `Navbar`** (`ProfileMenu` trigger button), falling back to `userInitials` if unset or if image loading fails.
6. **Harden password updates** on `ProfilePage` — verify `currentPassword` via `signInWithPassword`, enforce the same 4 strength rules as `LoginForm` (8+ chars, uppercase, number, symbol), and render clear inline error and success states.
7. **Wire *Export your data*, *Leave a group*, *Leave all groups*, and *Delete account*** safely, preserving shared workspaces and shared items for remaining members when an owner leaves or deletes their account.

### Non-Goals (Deferred to Phases 2–5)
- `showDeclinedEvents` behavior and RSVP schema (Phase 2).
- `Notifications` persistence/triggers and availability nudges (Phase 3).
- `Map` screen view and event locations (Phase 4).
- External `.ics` / Google / Outlook calendar sync and the *Unsync calendar* action (Phase 5).

### Anti-Goals
- **Never destroy a shared calendar that still has other members** when one member (including the original creator/owner) leaves or deletes their account.
- **Never require `SUPABASE_SERVICE_ROLE_KEY`** in browser or Next.js runtime environments.
- **No new npm dependencies** and no React Context boilerplate where `useSyncExternalStore` suffices.

## 3. Constraints

- **Database foreign keys today:** `groups.created_by`, `events.created_by`, `tags.created_by`, `lists.created_by`, `list_items.created_by`, `note_folders.created_by`, and `notes.created_by` are all `uuid not null references public.profiles(id) on delete restrict`. Deleting a `profiles` / `auth.users` row fails if the user created any row.
- **Supabase client-only auth:** Browser clients use the public anon key and cannot call `supabase.auth.admin.deleteUser()`. Self-deletion and ownership transfer must execute inside `SECURITY DEFINER` Postgres functions scoped strictly to `auth.uid()`.
- **Hydration safety:** Next.js SSR renders with `DEFAULT` preference values; client reads from `localStorage` must use `useSyncExternalStore` server snapshots to avoid hydration mismatches.

## 4. Approaches Considered

### Approach A — Local reactive prefs (`useSyncExternalStore`) + atomic SQL RPCs *(Selected)*
- Convert all fields in `useCalendarPrefs` (`src/lib/calendarPrefs.ts`) to `useSyncExternalStore` backed by `localStorage` and the existing `wecalendar:pref-change` (`PREF_EVENT`) custom event.
- Thread an optional `weekStartsOnMonday = false` boolean into pure helpers in `src/lib/calendar.ts` and `src/lib/events.ts`.
- Add one SQL migration (`supabase/migrations/20261104210000_account_and_group_lifecycle.sql`) that relaxes `created_by` on shared content tables to nullable `on delete set null` and defines `leave_group(p_group_id uuid)`, `leave_all_groups()`, and `delete_own_account()` as `SECURITY DEFINER` functions.
- Run *Export your data* directly in the browser using parallel Supabase queries and a Blob download.
- **Why chosen:** Matches `src/lib/theme.ts` and `useCreatorColorAccent`, requires zero extra env secrets or network sync races, keeps calendar math pure and unit-testable, and guarantees atomic group ownership handoff in Postgres.

### Approach B — Cloud-synced prefs in `profiles.theme_preferences` + SQL RPCs *(Rejected)*
- Mirror `CalendarPrefs` into `profiles.theme_preferences` on every toggle and hydrate on auth change.
- **Trade-off:** Enables cross-device view settings, at the cost of dual-storage merge logic and extra network writes; unnecessary given theme mode and accent color already live in `localStorage`.

*(A third option — Next.js Route Handlers calling `auth.admin.deleteUser` — was dropped because it requires configuring a secret `SUPABASE_SERVICE_ROLE_KEY` across local and deployment environments.)*

## 5. Detailed Design

### 5.1 Reactive Preferences & `defaultView` (`src/lib/calendarPrefs.ts`, `src/components/AppShell/AppShell.tsx`)
- Refactor `useCalendarPrefs()` in `src/lib/calendarPrefs.ts` so every preference (`hidePastConflicts`, `weekStartsOnMonday`, `defaultView`, `showDeclinedEvents`, `showWorkspaceInSidebar`, `confirmDeleteOthers`, `creatorColorAccent`) is read via `useSyncExternalStore(subscribePrefs, getClientSnapshot, getServerSnapshot)` (or a single serialized snapshot object cached by string key to keep referential stability) and every setter writes to `localStorage` and dispatches `new Event(PREF_EVENT)`.
- In `AppShell`:
  - Initialize `calendarMode` from `prefs.defaultView` once hydrated (track a ref so changing `defaultView` in `/profile` and navigating back to `/` opens in `prefs.defaultView`, while manual Day/Week/Month/Year switches inside `Navbar` still work freely during the session).

### 5.2 `weekStartsOnMonday` Across Calendar & Events
- **`src/lib/calendar.ts`:**
  - Add `getWeekdayLabels(weekStartsOnMonday = false, style: "short" | "narrow" | "two" = "short"): string[]` returning `["Sun", ...]` vs `["Mon", ..., "Sun"]` (`"short"`), `["S", "M", ...]` vs `["M", ..., "S"]` (`"narrow"`), and `["Su", ...]` vs `["Mo", ..., "Su"]` (`"two"`).
  - Update `startOfWeek(date: Date, weekStartsOnMonday = false): Date`:
    - When `false`: `offset = d.getDay()`.
    - When `true`: `offset = (d.getDay() + 6) % 7` (Monday → 0, Sunday → 6).
  - Update `isDateInView(date, viewDate, mode, weekStartsOnMonday = false)`, `formatWeekLabel(date, weekStartsOnMonday = false)`, `formatViewLabel(date, mode, weekStartsOnMonday = false)`, `getMonthGrid(viewDate, today = new Date(), weekStartsOnMonday = false)`, and `getWeekDays(viewDate, today = new Date(), weekStartsOnMonday = false)` to forward `weekStartsOnMonday`.
- **`src/lib/events.ts`:**
  - Update `getSpanPosition(event, day, dayOfWeek, weekStartsOnMonday = false)` and `getSeriesSpanPosition(event, allEvents, day, dayOfWeek, weekStartsOnMonday = false)`:
    - Row start is `dayOfWeek === (weekStartsOnMonday ? 1 : 0)`.
    - Row end is `dayOfWeek === (weekStartsOnMonday ? 0 : 6)`.
- **Components:**
  - Pass `weekStartsOnMonday={prefs.weekStartsOnMonday}` from `AppShell` into `formatViewLabel`, `isDateInView`, `Calendar` (→ `CalendarGrid` → `CalendarCell`, `WeekView`, `YearView`), `Sidebar` (→ `MiniCalendar`), `EventViewerPanel` (`bucketEvents` week boundaries), and `CreateEventModal` (→ `DayPicker`).

### 5.3 Zero-Group Onboarding & Interactive `MiniCalendar`
- **Workspace visibility & CTA (`AppShell.tsx`, `Sidebar.tsx`, `SharedWorkspace.tsx`, `NotesApp.tsx`):**
  - Pass `showWorkspace={prefs.showWorkspaceInSidebar || groups.length === 0}` to `Sidebar` so signed-in users with zero workspaces always see `SharedWorkspace` in the sidebar.
  - Allow `SharedWorkspace`'s create/join modal to also be triggered externally (lift an optional `openModalSignal` / controlled `workspaceModalOpen` state in `AppShell`, or render a shared create/join modal trigger) so both:
    - the empty-workspace banner in `AppShell` (*"Create or join a shared workspace to sync calendars — [Get started]"*), and
    - the empty-workspace state in `NotesApp` (*"[Create or join workspace]"*)
    open the create/join dialog immediately in one click (and expand the sidebar if collapsed).
- **Interactive `MiniCalendar` (`src/components/Sidebar/MiniCalendar.tsx`):**
  - Add `onSelectDate?: (date: Date) => void` and `weekStartsOnMonday?: boolean` props.
  - Maintain an internal `displayMonth` state synced when `viewDate`'s month/year changes, plus compact `‹` / `›` buttons in the header (stopping propagation so they don't collapse the accordion) to browse months.
  - Render day cells as `<button type="button">`: clicking a day calls `onSelectDate(clickedDate)` (which sets `viewDate` in `AppShell`), with subtle highlight ring on the currently selected `viewDate` distinct from the filled `isToday` badge.

### 5.4 Multi-Day Events: Validation, Editing & TimeGrid Clipping (`src/components/CreateEventModal/CreateEventModal.tsx`, `src/lib/events.ts`, `src/components/TimeGrid/TimeGrid.tsx`)
- In `CreateEventModal`:
  - **Builder call (reopening multi-day events):** Initialize `selectedDates` by expanding every calendar date from `startOfDay(starts_at)` through `startOfDay(ends_at)` (inclusive, excluding a trailing midnight `00:00` boundary when `ends_at > starts_at`) for `event` (and each occurrence in `seriesEvents`), instead of seeding `starts_at` only — otherwise reopening a multi-day event truncates its span to 1 day.
  - In `handleSubmit`, compute `const groups = groupConsecutiveDates(selectedDates)` **before** time validation:
    - Enforce `endTime > startTime` only when `groups.some((grp) => grp.length === 1)`. When every selected span covers 2+ consecutive days (`grp.length > 1`), `startsAt` is on `grp[0]` and `endsAt` is on `grp[grp.length - 1]`, so `endsAt > startsAt` holds for any clock times.
    - **Builder call (non-contiguous selection while editing a single event):** When editing a single non-series event (`isEditing && (!event.recurrence_group_id || seriesEvents.length <= 1)`) and `groups.length > 1`, show an inline validation error (`"Select consecutive dates when editing a single event."`) rather than silently dropping `groups[1..]`.
  - Fix `softOverlap` preview (`useMemo` in `CreateEventModal`): iterate over `groupConsecutiveDates(selectedDates)` using `grp[0]` + `startTime` and `grp[grp.length - 1]` + `endTime` instead of testing each day individually with same-day start/end times, so multi-day events with `endTime <= startTime` still preview overlaps accurately.
- **Builder call (Day & Week `TimeGrid` multi-day rendering):**
  - Update `TimeGrid` (`src/components/TimeGrid/TimeGrid.tsx`) to select per-column events with `eventsSpanningDay(events, day.date)` (excluding trailing `00:00` midnight endpoints) instead of `eventsForDay`, and pass `day.date` into `eventPosition(event, HOUR_HEIGHT_PX, day.date)` and `layoutOverlappingEvents(dayEvents, day.date)`.
  - When `day` is provided, clip each event's start/end minutes to `[0, 1440]` on that calendar day so e.g. Friday 6:00 PM → Sunday 11:00 AM renders as 6:00 PM–12:00 AM Friday, all-day Saturday, and 12:00 AM–11:00 AM Sunday instead of a 30-minute stub on Friday.

### 5.5 Navbar User Avatar (`src/components/AppShell/AppShell.tsx`, `src/components/Navbar/Navbar.tsx`)
- In `AppShell`, fetch the signed-in user's `profiles.avatar_url` and `display_name` when `user` changes (alongside `loadGroups`), storing `userAvatarUrl` and `profileDisplayName`.
- Pass `userAvatarUrl` into `Navbar` → `ProfileMenu`. Render `<img>` with `object-cover` inside the circular `h-8 w-8` button when `userAvatarUrl` is truthy and hasn't errored (`onError` falls back to `userInitials`).

### 5.6 Password Update Validation & Feedback (`src/app/profile/page.tsx`)
- Extract the 4 password rules (`length >= 8`, uppercase, number, symbol) into a tiny shared helper `validatePasswordRules(password: string)` in `src/lib/auth.ts` (reused by both `LoginForm` and `ProfilePage`, with unit tests in `src/lib/auth.test.ts`).
- In `ProfilePage`:
  - Show the live 4-rule strength checklist under *New password* once `newPassword.length > 0`.
  - Add `passwordError: string | null`, `passwordSaved: boolean`, and `passwordBusy: boolean` states.
  - In `handleChangePassword`:
    1. Validate `pwAllValid` and `newPassword === confirmPassword`.
    2. Re-authenticate the current user via `supabase.auth.signInWithPassword({ email, password: currentPassword })`; if it fails, display `"Current password is incorrect."` and abort.
    3. Call `supabase.auth.updateUser({ password: newPassword })`; surface any error, or clear the 3 inputs and show `"Password updated!"` for 2.5s.

### 5.7 Database Migration & Account / Group Lifecycle Actions
- **Migration `supabase/migrations/20261104210000_account_and_group_lifecycle.sql`:**
  1. Alter `created_by` to be **nullable** and replace the foreign key with `on delete set null` on:
     - `public.groups`
     - `public.events`
     - `public.tags`
     - `public.lists`
     - `public.list_items`
     - `public.note_folders`
     - `public.notes`
     *(Update `INSERT` RLS policies where needed so `created_by = auth.uid()` is still required on client inserts.)*
  2. Create helper `public.leave_group(p_group_id uuid) returns void` (`language plpgsql security definer set search_path = public`):
     - Require `auth.uid() is not null`.
     - Check remaining members in `p_group_id` excluding `auth.uid()`.
     - If **no other members exist**, `delete from public.groups where id = p_group_id` (cascades events, tags, notes, folders, lists, memberships).
     - Otherwise:
       - Delete the caller's private notes and private note folders in `p_group_id` (`where group_id = p_group_id and visibility = 'private' and created_by = auth.uid()`).
       - Delete the caller's `group_members` row (`where group_id = p_group_id and user_id = auth.uid()`).
       - Ensure at least one `owner` remains: if `not exists (select 1 from public.group_members where group_id = p_group_id and role = 'owner')`, pick the earliest remaining member (`order by joined_at asc, id asc limit 1`), set their `role = 'owner'`, and update `public.groups set created_by = promoted_user_id where id = p_group_id`.
       - Also if `groups.created_by = auth.uid()`, point `groups.created_by` to an existing owner in that group.
  3. Create `public.leave_all_groups() returns void` (`security definer`):
     - Loops over every `group_id` in `public.group_members where user_id = auth.uid()` and calls `public.leave_group(group_id)`.
  4. Create `public.delete_own_account() returns void` (`security definer`):
     - Require `auth.uid() is not null`.
     - Call `public.leave_all_groups()` (which deletes solo groups + private notes/folders and transfers ownership on shared groups).
     - `delete from auth.users where id = auth.uid();` — cascades to `public.profiles`, and sets `created_by = null` on surviving shared events/tags/notes/folders/lists.
     - *(**Builder call — avatar storage cleanup:** Modern Supabase Storage attaches a `storage.protect_delete()` trigger to `storage.objects` that aborts direct SQL `DELETE` statements. Instead of deleting from `storage.objects` in SQL, the client removes the user's files via `supabase.storage.from("avatars").list(user.id)` → `.remove(...)` under the existing `"Users can delete their avatar"` policy right before calling `delete_own_account()`.)*
  5. Grant `execute` on `leave_group(uuid)`, `leave_all_groups()`, and `delete_own_account()` to `authenticated`.
- **TypeScript types (`src/types/database.ts`, `src/components/AppShell/AppShell.tsx`, `src/components/CreateEventModal/CreateEventModal.tsx`):**
  - Update `created_by` in `database.ts` `Row` / `Update` types to `string | null` (keeping `Insert` as `string | null` or `string`), and add `leave_group`, `leave_all_groups`, and `delete_own_account` to `Database["public"]["Functions"]`.
  - Guard nullable `event.created_by` in `AppShell.loadEvents` and `CreateEventModal` (`isOthersEvent` checks `Boolean(event?.created_by) && event.created_by !== currentUserId`).
- **Profile Danger Zone (`src/app/profile/page.tsx`):**
  - **Leave a group:** Call `supabase.rpc("leave_group", { p_group_id: groupId })`; if `activeGroupId === groupId`, switch to next group or clear `ACTIVE_GROUP_KEY`. Surface any error via a Danger Zone error banner.
  - **Leave all groups:** Wire `onClick` → `supabase.rpc("leave_all_groups")`, clear `groups`, `activeGroupId`, and `ACTIVE_GROUP_KEY`.
  - **Export your data:** Wire `onClick` → fetch the user's `profiles` row, memberships + `groups`, and for their groups all visible `events`, `tags`, `event_tags`, `note_folders`, `notes`, `lists`, and `list_items`; serialize `{ exportedAt, user, profile, groups, events, tags, eventTags, noteFolders, notes, lists, listItems }` as formatted JSON and trigger download as `wecalendar-export-YYYY-MM-DD.json`.
  - **Delete account:** Wire `onClick` → best-effort remove any uploaded files in `supabase.storage.from("avatars")` under `${user.id}/`, call `supabase.rpc("delete_own_account")`, clear `wecalendar.*` keys from `localStorage`, call `supabase.auth.signOut()`, and `router.replace("/login")`.

## 6. What's Left to the Builder

- Exact visual styling of the subtle selected-date ring vs today badge in `MiniCalendar`, matching existing CSS tokens (`--accent`, `--accent-muted`, `--hairline`).
- Exact helper decomposition for `exportUserData` (either inline in `ProfilePage` or a testable pure serializer in `src/lib/accountExport.ts`).
- Comprehensive Vitest unit tests for Monday-first calendar/event span calculations, password validation rules, multi-day draft grouping/validation, and preference synchronization.

