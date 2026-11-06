# Event RSVPs & `showDeclinedEvents` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-member event RSVPs (`going` / `maybe` / `declined`) with live Supabase Realtime sync, modal attendance controls and group tallies, conflict-alert exclusion on decline, RSVP reset on event reschedule, and `showDeclinedEvents` filtering/dimming across all calendar views.

**Architecture:** Store per-user responses in `public.event_rsvps (event_id, group_id, user_id, status)` guarded by RLS, Realtime publication, an `AFTER UPDATE OF starts_at, ends_at` reschedule-reset trigger on `public.events`, and `leave_group` cleanup. Derive `myRsvp` onto `CalendarEvent` in `AppShell` via pure helpers in `src/lib/rsvps.ts`, reconcile recurring series edits in place via `reconcileSeriesUpdate` in `src/lib/events.ts`, and render declined events dimmed with struck-through titles when `prefs.showDeclinedEvents` is enabled.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Supabase (`@supabase/ssr`, PostgreSQL RLS, Realtime), Tailwind CSS v4, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-11-05-event-rsvps-design.md`

## Global Constraints

- Zero `SUPABASE_SERVICE_ROLE_KEY` requirement: client reads/writes use authenticated RLS; cross-user resets and workspace leave cleanup use `SECURITY DEFINER` Postgres functions/triggers with `set search_path = public` and `revoke all ... from public, anon`.
- Zero new npm dependencies.
- Graceful unmigrated degradation: if `public.event_rsvps` has not been migrated yet, `loadEventRsvps` and `fetchAccountExportBundle` degrade to `[]` with `console.warn` instead of crashing.
- Preserve existing comments, styling tokens, and Phase 1 double-checked membership-before-lock ordering in `public.leave_group`.

## Review Focus

- Unmigrated Supabase database where querying `event_rsvps` returns an error (`42P01` / `PGRST205`): export and app shell must return `[]` rather than failing — tested in Task 1 (`src/lib/accountExport.test.ts`).
- Respondent missing from `profilesById` or having `display_name: null` / `""`: `summarizeEventRsvps` must label the current user `"You"` and unknown/blank profiles `"Member"` without throwing during sort — tested in Task 2 (`src/lib/rsvps.test.ts`).
- Active/future event with `myRsvp: "declined"`: `filterConflictCandidateEvents` must exclude it whether `hidePastConflicts` is `true` or `false`, while retaining `"going"`, `"maybe"`, and `null` — tested in Task 2 (`src/lib/rsvps.test.ts`).
- Recurring series edit with multiple drafts sharing the same `YYYY-MM-DD` start date: `reconcileSeriesUpdate` must consume each existing `event.id` at most once and insert any surplus draft with a fresh ID — tested in Task 2 (`src/lib/events.test.ts`).
- Untyped/unexpected RSVP `status` string from database rows: `rsvpMapForUser` and `summarizeEventRsvps` must ignore invalid statuses without corrupting counts — tested in Task 2 (`src/lib/rsvps.test.ts`).

---

### Task 1: `event_rsvps` SQL Migration, Database Types & Account Export

**Files:**
- Create: `supabase/migrations/20261105230000_event_rsvps.sql`
- Modify: `src/types/database.ts`
- Modify: `src/lib/accountExport.ts`
- Test: `src/lib/accountExport.test.ts`

**Interfaces:**
- Produces:
  - SQL table `public.event_rsvps`, helper `public.is_event_in_group(p_event_id uuid, p_group_id uuid) -> boolean`, trigger `events_reset_rsvps_on_reschedule` on `public.events`, and updated `public.leave_group(p_group_id uuid)` cleaning up `public.event_rsvps`.
  - `Database["public"]["Tables"]["event_rsvps"]` (`Row`, `Insert`, `Update`, `Relationships`) and `Database["public"]["Functions"]["is_event_in_group"]` in `src/types/database.ts`.
  - `AccountExportBundle.eventRsvps: Tables<"event_rsvps">[]` in `src/lib/accountExport.ts`.

- [ ] **Step 1: Write failing export tests in `src/lib/accountExport.test.ts`**

Add assertions to the zero-group test (`expect(bundle.eventRsvps).toEqual([])`), the group-scoped test (`event_rsvps` mock returning `[{ event_id: "e1", group_id: "g1", user_id: "u1", status: "going", created_at: "2026-11-04T00:00:00Z", updated_at: "2026-11-04T00:00:00Z" }]` → `expect(bundle.eventRsvps).toHaveLength(1)`), plus a new test:

```ts
it("degrades eventRsvps to [] when event_rsvps table is not migrated yet", async () => {
  const fromSpy = vi.fn((table: string) => {
    if (table === "profiles") {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    }
    if (table === "group_members") {
      return { select: () => ({ eq: async () => ({ data: [{ group_id: "g1" }], error: null }) }) };
    }
    if (table === "event_rsvps") {
      return {
        select: () => ({
          in: async () => ({ data: null, error: { code: "42P01", message: "relation \"event_rsvps\" does not exist" } }),
        }),
      };
    }
    return { select: () => ({ in: async () => ({ data: [], error: null }) }) };
  });

  const bundle = await fetchAccountExportBundle({ from: fromSpy } as never, { id: "u1", email: "a@b.com" });
  expect(bundle.eventRsvps).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/accountExport.test.ts`
Expected: FAIL (`bundle.eventRsvps` is `undefined`).

- [ ] **Step 3: Create `supabase/migrations/20261105230000_event_rsvps.sql`, update `src/types/database.ts`, and update `src/lib/accountExport.ts`**

- In `supabase/migrations/20261105230000_event_rsvps.sql`:
  - Create `public.event_rsvps` (`event_id`, `group_id`, `user_id`, `status check (status in ('going', 'maybe', 'declined'))`, `created_at`, `updated_at`, `primary key (event_id, user_id)`), indexes on `(group_id)` and `(user_id)`, and `before update` trigger `event_rsvps_set_updated_at`.
  - Define `public.is_event_in_group(p_event_id uuid, p_group_id uuid)` (`security definer`, `set search_path = public`, `revoke all ... from public, anon`, `grant execute ... to authenticated`).
  - Enable RLS on `public.event_rsvps` with policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE` per Spec §5.1, `grant select, insert, update, delete on public.event_rsvps to authenticated;`, and add `public.event_rsvps` to `supabase_realtime`.
  - Define `public.reset_event_rsvps_on_reschedule()` (`security definer`, `set search_path = public`, `revoke all ... from public, anon`) and `after update of starts_at, ends_at on public.events` trigger `events_reset_rsvps_on_reschedule`.
  - Update `public.leave_group(p_group_id uuid)` preserving the exact membership-first double-checked `FOR UPDATE` lock from `20261104210000_account_and_group_lifecycle.sql` and adding `delete from public.event_rsvps where group_id = p_group_id and user_id = v_uid;` before removing `public.group_members`.
- In `src/types/database.ts`: add `event_rsvps` table definition (`status: "going" | "maybe" | "declined"`) and `is_event_in_group` function signature.
- In `src/lib/accountExport.ts`: add `eventRsvps: Tables<"event_rsvps">[]` to `AccountExportBundle`; query `supabase.from("event_rsvps").select("*").in("group_id", groupIds)` alongside group queries, returning `[]` if `eventRsvpsRes.error` has missing-table code (`42P01` or `PGRST205`) and throwing on real auth/network errors.

- [ ] **Step 4: Run tests and typecheck to verify they pass**

Run: `npx vitest run src/lib/accountExport.test.ts && npx tsc --noEmit`
Expected: PASS (4 tests) and exit 0.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261105230000_event_rsvps.sql src/types/database.ts src/lib/accountExport.ts src/lib/accountExport.test.ts
git commit -m "feat: add event_rsvps SQL migration, database types, and export support"
```

---

### Task 2: Pure RSVP Domain Helpers & In-Place Series Reconciliation

**Files:**
- Create: `src/lib/rsvps.ts`
- Create: `src/lib/rsvps.test.ts`
- Modify: `src/lib/events.ts`
- Modify: `src/lib/events.test.ts`

**Interfaces:**
- Consumes: `Tables<"event_rsvps">` from `src/types/database.ts`.
- Produces:
  - In `src/lib/rsvps.ts`:
    - `export type RsvpStatus = "going" | "maybe" | "declined";`
    - `export type EventRsvp = Pick<Tables<"event_rsvps">, "event_id" | "group_id" | "user_id" | "status" | "updated_at">;`
    - `export type RsvpMemberSummary = { userId: string; displayName: string; isCurrentUser: boolean; avatarUrl: string | null; status: RsvpStatus };`
    - `export function isRsvpStatus(value: unknown): value is RsvpStatus`
    - `export function rsvpMapForUser(rsvps: readonly EventRsvp[], userId: string | null | undefined): Map<string, RsvpStatus>`
    - `export function summarizeEventRsvps(eventId: string, rsvps: readonly EventRsvp[], profilesById: ReadonlyMap<string, { display_name: string | null; avatar_url?: string | null }>, currentUserId?: string | null): { myStatus: RsvpStatus | null; counts: { going: number; maybe: number; declined: number }; respondents: RsvpMemberSummary[] }`
    - `export function filterVisibleEvents<T extends { myRsvp?: RsvpStatus | null }>(events: readonly T[], showDeclinedEvents: boolean): T[]`
    - `export function filterConflictCandidateEvents<T extends { ends_at: string; myRsvp?: RsvpStatus | null }>(events: readonly T[], options: { hidePastConflicts: boolean; nowMs?: number }): T[]`
  - In `src/lib/events.ts`:
    - `CalendarEvent` extended with `myRsvp?: RsvpStatus | null;`
    - `export function reconcileSeriesUpdate(existingEvents: readonly Pick<CalendarEvent, "id" | "starts_at">[], drafts: readonly { title: string; description: string; startsAt: Date; endsAt: Date; tagIds: readonly string[] }[], params: { groupId: string; userId: string; recurrenceGroupId: string; createId?: () => string }): { updates: { id: string; patch: { title: string; description: string | null; starts_at: string; ends_at: string; recurrence_group_id: string | null }; tagIds: string[] }[]; deleteIds: string[]; insertEventRows: ReturnType<typeof prepareBulkEventInserts>["eventRows"]; insertTagRows: ReturnType<typeof prepareBulkEventInserts>["tagRows"] }`

- [ ] **Step 1: Write failing unit tests in `src/lib/rsvps.test.ts` and `src/lib/events.test.ts`**

Create `src/lib/rsvps.test.ts` testing:
1. `rsvpMapForUser` maps valid statuses for `userId`, returns empty map when `userId` is null, and ignores invalid status values.
2. `summarizeEventRsvps` computes `myStatus`, `{ going, maybe, declined }` counts, orders current user (`"You"`) first then `going` → `maybe` → `declined` then alphabetical `displayName`, falls back to `"Member"` when profile is missing or `display_name` is blank, and ignores invalid status strings.
3. `filterVisibleEvents` removes `myRsvp === "declined"` when `showDeclinedEvents === false` and keeps all events when `true`.
4. `filterConflictCandidateEvents` excludes `myRsvp === "declined"` regardless of `hidePastConflicts`, and applies `ends_at > nowMs` when `hidePastConflicts === true`.

Add a test to `src/lib/events.test.ts` for `reconcileSeriesUpdate`:
- Existing series has 3 occurrences (`2026-11-06` id `e1`, `2026-11-13` id `e2`, `2026-11-20` id `e3`).
- Drafts contain two occurrences on `2026-11-06` (testing duplicate-date consumption: first updates `e1`, second inserts `new-1`), keeps `2026-11-13` (`e2` updated), drops `2026-11-20` (`deleteIds: ["e3"]`), and adds `2026-11-27` (`new-2`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/rsvps.test.ts src/lib/events.test.ts`
Expected: FAIL (`Cannot find module './rsvps'` and `reconcileSeriesUpdate is not a function`).

- [ ] **Step 3: Implement `src/lib/rsvps.ts` and `reconcileSeriesUpdate` + `CalendarEvent.myRsvp` in `src/lib/events.ts`**

- In `src/lib/rsvps.ts`: implement all exported types and pure functions matching the exact signatures above. In `summarizeEventRsvps`, compute `const isCurrentUser = Boolean(currentUserId && currentUserId === r.user_id); const rawName = profilesById.get(r.user_id)?.display_name?.trim(); const displayName = isCurrentUser ? "You" : (rawName || "Member");`.
- In `src/lib/events.ts`: import `type { RsvpStatus } from "@/lib/rsvps"`, add `myRsvp?: RsvpStatus | null` to `CalendarEvent`, and implement `reconcileSeriesUpdate` grouping `existingEvents` into `Map<string, string[]>` by `toLocalDateKey(new Date(e.starts_at))` (shifting at most one ID per matching draft date; remaining IDs go to `deleteIds`; unmatched drafts produce `insertEventRows` + `insertTagRows`; `recurrence_group_id` is `drafts.length > 1 ? params.recurrenceGroupId : null`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/rsvps.test.ts src/lib/events.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rsvps.ts src/lib/rsvps.test.ts src/lib/events.ts src/lib/events.test.ts
git commit -m "feat: add pure RSVP domain helpers and in-place series reconciliation"
```

---

### Task 3: `CreateEventModal` Attendance Controls, Group Tally & `softOverlap` Declined Filtering

**Files:**
- Modify: `src/components/CreateEventModal/CreateEventModal.tsx`

**Interfaces:**
- Consumes: `RsvpStatus`, `EventRsvp`, `summarizeEventRsvps` from `src/lib/rsvps.ts`; `CalendarEvent.myRsvp` from `src/lib/events.ts`.
- Produces: Extended `CreateEventModalProps`:
  - `currentUserId?: string | null`
  - `eventRsvps?: readonly EventRsvp[]`
  - `groupProfilesById?: ReadonlyMap<string, { display_name: string | null; avatar_url?: string | null }>`
  - `onSetRsvp?: (eventIds: string[], status: RsvpStatus | null) => Promise<void>`

- [ ] **Step 1: Add RSVP props, `softOverlap` declined exclusion, and Attendance UI in `src/components/CreateEventModal/CreateEventModal.tsx`**

- Update `softOverlap` `useMemo`:
  - If `isEditing && event && rsvpSummary?.myStatus === "declined"`, return `{ overlaps: false, titles: [] }`.
  - When scanning `existingEvents`, skip any `existing` where `existing.myRsvp === "declined"`.
- When `isEditing && event && onSetRsvp`:
  - Compute `rsvpSummary = summarizeEventRsvps(event.id, eventRsvps, groupProfilesById, currentUserId)`.
  - Track `applyRsvpToSeries` (`useState(false)`, reset when `event?.id` changes) and `rsvpBusy` (`useState(false)`).
  - Render an **Attendance** section above Notes:
    - Three `type="button"` segmented pills (`Going`, `Maybe`, `Declined`) with `aria-pressed={rsvpSummary.myStatus === opt.id}` and `disabled={rsvpBusy || busy}`. Clicking the active pill passes `null` (clears response); clicking an inactive pill passes `opt.id`. Target IDs: `applyRsvpToSeries && seriesEvents.length > 1 ? seriesEvents.map((e) => e.id) : [event.id]`.
    - When `seriesEvents.length > 1`, render a checkbox `"Apply RSVP to all ${seriesEvents.length} events in series"`.
    - Render a compact count summary (`Going · ${counts.going}`, `Maybe · ${counts.maybe}`, `Declined · ${counts.declined}`) and respondent chips (`respondent.displayName` + status dot) when `respondents.length > 0`.

- [ ] **Step 2: Run typecheck, lint, and tests**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: PASS with zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CreateEventModal/CreateEventModal.tsx
git commit -m "feat: add RSVP controls, group attendance summary, and declined overlap filtering in modal"
```

---

### Task 4: Wire `AppShell` Realtime RSVPs & Dimmed Declined Rendering Across Views

**Files:**
- Modify: `src/components/AppShell/AppShell.tsx`
- Modify: `src/components/CalendarCell/CalendarCell.tsx`
- Modify: `src/components/TimeGrid/TimeGrid.tsx`
- Modify: `src/components/EventViewerPanel/EventViewerPanel.tsx`

**Interfaces:**
- Consumes: `EventRsvp`, `RsvpStatus`, `rsvpMapForUser`, `filterVisibleEvents`, `filterConflictCandidateEvents` from `src/lib/rsvps.ts`; `reconcileSeriesUpdate` from `src/lib/events.ts`; extended `CreateEventModalProps` from Task 3.
- Produces: End-to-end live RSVP persistence, Realtime updates, in-place series saving, `showDeclinedEvents` hiding/dimming, and declined conflict exclusion.

- [ ] **Step 1: Wire `eventRsvps`, `groupProfilesById`, Realtime, `handleSetEventRsvp`, and `handleUpdateSeries` in `src/components/AppShell/AppShell.tsx`**

- Add state `eventRsvps: EventRsvp[]` and `groupProfilesById: Map<string, { display_name: string | null; avatar_url: string | null }>`.
- Add `loadEventRsvps(groupId)` (queries `event_rsvps` by `group_id`, warns & sets `[]` on error) and `loadGroupProfiles(groupId)` (queries `group_members` user IDs then `profiles` with the existing `avatar_url` fallback). Call both in the active-group load effect and subscribe on the Realtime channel to `{ event: "*", schema: "public", table: "event_rsvps" }` and `{ event: "*", schema: "public", table: "group_members", filter: \`group_id=eq.${activeGroupId}\` }`.
- Derive `myRsvpByEventId = useMemo(() => rsvpMapForUser(eventRsvps, user?.id), [eventRsvps, user?.id])` and `eventsWithRsvp = useMemo(() => events.map((e) => ({ ...e, myRsvp: myRsvpByEventId.get(e.id) ?? null })), [events, myRsvpByEventId])`.
- Derive `activeSelectedEvent` from `eventsWithRsvp` by `selectedEvent?.id` so modal always receives live `myRsvp`.
- Update `filteredEvents` to start from `filterVisibleEvents(eventsWithRsvp, prefs.showDeclinedEvents)` before search and tag filters.
- Update `conflictGroups` to use `filterConflictCandidateEvents(eventsWithRsvp, { hidePastConflicts: prefs.hidePastConflicts })`.
- Implement `handleSetEventRsvp(targetEventIds: string[], status: RsvpStatus | null)` with optimistic `eventRsvps` update, `.delete().eq("user_id", user.id).in("event_id", targetEventIds)` when `status === null`, `.upsert(..., { onConflict: "event_id,user_id" })` otherwise, and rollback via `await loadEventRsvps(activeGroupId)` on error.
- Replace `handleUpdateSeries` body with `reconcileSeriesUpdate` (`UPDATE` each matched occurrence + replace its `event_tags`, `.delete().in("id", deleteIds)` for removed dates, `.insert(insertEventRows)` + `.insert(insertTagRows)` for new dates, then reload events, tags, and RSVPs).
- Pass `currentUserId={user?.id}`, `eventRsvps={eventRsvps}`, `groupProfilesById={groupProfilesById}`, `onSetRsvp={handleSetEventRsvp}`, and `existingEvents={eventsWithRsvp}` to `<CreateEventModal />`.

- [ ] **Step 2: Render declined events dimmed with struck-through titles in `CalendarCell.tsx`, `TimeGrid.tsx`, and `EventViewerPanel.tsx`**

- `src/components/CalendarCell/CalendarCell.tsx`: for both multi-day bars and single-day chips, compute `const isDeclined = event.myRsvp === "declined";`, set `opacity: isDeclined ? 0.45 : ...`, and add `line-through` class on the title `<span>` when `isDeclined`.
- `src/components/TimeGrid/TimeGrid.tsx`: compute `const isDeclined = event.myRsvp === "declined";`, set `opacity: isDeclined ? 0.45 : 1` on the event button, and add `line-through` on the title `<span>` when `isDeclined`.
- `src/components/EventViewerPanel/EventViewerPanel.tsx`: in `EventRow`, compute `const isDeclined = event.myRsvp === "declined";`, set `opacity: isDeclined ? 0.5 : 1` on the row `<button>`, add `line-through` on the title text when `isDeclined`, and render a small `"Declined"` badge next to the time range when `isDeclined`.

- [ ] **Step 3: Run full verification (`tsc`, `lint`, `test`, `build`)**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: All four commands exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/AppShell/AppShell.tsx src/components/CalendarCell/CalendarCell.tsx src/components/TimeGrid/TimeGrid.tsx src/components/EventViewerPanel/EventViewerPanel.tsx
git commit -m "feat: wire Realtime RSVPs, series reconciliation, conflict exclusion, and showDeclinedEvents"
```
