# Core UX & Account Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire every existing calendar preference, shell navigation control, multi-day event span/validation path, password security check, and workspace/account lifecycle action end to end across the client and Supabase schema.

**Architecture:** Calendar preferences stay local and hydration-safe via a cached `useSyncExternalStore` snapshot + `wecalendar:pref-change` custom event in `src/lib/calendarPrefs.ts`. Monday week-start and multi-day day-clipping are added as optional parameters on pure helpers in `src/lib/calendar.ts` and `src/lib/events.ts`, while destructive group/account operations run inside atomic `SECURITY DEFINER` Postgres RPCs (`leave_group`, `leave_all_groups`, `delete_own_account`) with nullable `on delete set null` `created_by` foreign keys on shared tables.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Supabase JS (`@supabase/supabase-js` / `@supabase/ssr`), PostgreSQL 17 migrations, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-11-04-core-ux-account-settings-design.md`

## Global Constraints

- Never destroy a shared calendar that still has other members when one member (including the original creator/owner) leaves or deletes their account.
- Never require `SUPABASE_SERVICE_ROLE_KEY` in browser or Next.js runtime environments.
- No new npm dependencies and no React Context boilerplate where `useSyncExternalStore` suffices.
- Next.js SSR renders with `DEFAULT` preference values; client reads from `localStorage` must use `useSyncExternalStore` server snapshots to avoid hydration mismatches.
- Avatar cleanup on account deletion must run via `supabase.storage.from("avatars")` on the client before `delete_own_account()` (never via raw SQL `DELETE FROM storage.objects`, which trips Supabase Storage's `storage.protect_delete()` trigger).

## Review Focus

- **Sunday boundary when `weekStartsOnMonday = true` (`date.getDay() === 0`):** A Sunday date (e.g. `2026-11-08`) must resolve `startOfWeek(date, true)` to the preceding Monday (`2026-11-02`), and a month whose 1st falls on Sunday (`2026-11-01`) must start its 42-cell grid on Monday `2026-10-26` (Sunday at index 6), never offsetting by `0` or `+1`.
- **Exact-midnight event end (`ends_at` at `00:00:00` local time, e.g. Fri 22:00 → Sat 00:00):** An event ending at `00:00` of the following day must not spill onto Saturday's `TimeGrid` column or pre-select Saturday when reopened in `CreateEventModal`, while a zero-duration `00:00 → 00:00` event still resolves to its start day.
- **Multi-day event inside a repeating series with `weekStartsOnMonday = true`:** `getSeriesSpanPosition` delegates to `getSpanPosition` when `isMultiDayEvent(event)` is true and must forward `weekStartsOnMonday` so row-end and row-start caps land on Sunday (`0`) and Monday (`1`) instead of Saturday (`6`) and Sunday (`0`).
- **Invalid or corrupted `localStorage` preference strings (e.g. `defaultView = "agenda"`, `weekStartsOnMonday = "yes"`):** Reading preferences must fall back to `DEFAULTS` (`"month"`, `false`) and return the exact same object reference across consecutive `getPrefsSnapshot()` calls when storage has not changed so `useSyncExternalStore` never triggers an infinite render loop.
- **Zero-group or null-creator account data export:** Exporting data for a user who belongs to zero workspaces or has surviving shared items with `created_by: null` must return valid JSON with empty group-scoped arrays without issuing invalid empty `.in("group_id", [])` queries or crashing on `null` creator IDs.

---

### Task 1: Password Validation Helper & Reactive Calendar Preferences

**Files:**
- Modify: `src/lib/auth.ts:1-17`
- Create: `src/lib/auth.test.ts`
- Modify: `src/lib/calendarPrefs.ts:1-157`
- Create: `src/lib/calendarPrefs.test.ts`

**Interfaces:**
- Consumes: `CalendarMode` from `src/lib/calendar.ts`
- Produces:
  - `src/lib/auth.ts`:
    - `export type PasswordRules = { length: boolean; uppercase: boolean; number: boolean; symbol: boolean }`
    - `export function validatePasswordRules(password: string): PasswordRules`
    - `export function isPasswordValid(password: string): boolean`
  - `src/lib/calendarPrefs.ts`:
    - `export const PREF_EVENT = "wecalendar:pref-change"`
    - `export function getPrefsSnapshot(): CalendarPrefs`
    - `export function getServerPrefsSnapshot(): CalendarPrefs`
    - `export function setCalendarPref<K extends keyof CalendarPrefs>(key: K, value: CalendarPrefs[K]): void`
    - `export function useCalendarPrefs()` (same return shape `{ prefs, setHidePastConflicts, setWeekStartsOnMonday, setDefaultView, setShowDeclinedEvents, setShowWorkspaceInSidebar, setConfirmDeleteOthers, setCreatorColorAccent }`, now backed by `useSyncExternalStore`)

- [ ] **Step 1: Write failing unit tests in `src/lib/auth.test.ts` and `src/lib/calendarPrefs.test.ts`**

Create `src/lib/auth.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { getInitials, isPasswordValid, validatePasswordRules } from "./auth";

describe("validatePasswordRules", () => {
  it("flags each missing requirement independently", () => {
    expect(validatePasswordRules("short")).toEqual({
      length: false,
      uppercase: false,
      number: false,
      symbol: false,
    });
    expect(validatePasswordRules("Abcdefg1")).toEqual({
      length: true,
      uppercase: true,
      number: true,
      symbol: false,
    });
    expect(validatePasswordRules("Abcdefg1!")).toEqual({
      length: true,
      uppercase: true,
      number: true,
      symbol: true,
    });
    expect(isPasswordValid("Abcdefg1")).toBe(false);
    expect(isPasswordValid("Abcdefg1!")).toBe(true);
  });

  it("preserves getInitials behavior", () => {
    expect(getInitials("Alex Rivera")).toBe("AR");
    expect(getInitials("alex@example.com")).toBe("A");
  });
});
```

Create `src/lib/calendarPrefs.test.ts` (stubbing `window` + `localStorage` in Node Vitest):
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPrefsSnapshot,
  getServerPrefsSnapshot,
  PREF_EVENT,
  setCalendarPref,
} from "./calendarPrefs";

describe("calendarPrefs store", () => {
  const store = new Map<string, string>();
  const dispatchEvent = vi.fn();

  beforeEach(() => {
    store.clear();
    dispatchEvent.mockReset();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    });
    vi.stubGlobal("window", { localStorage, dispatchEvent });
    vi.stubGlobal("Event", class MockEvent {
      type: string;
      constructor(type: string) { this.type = type; }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns server defaults when storage is empty or invalid and caches snapshot reference", () => {
    store.set("wecalendar.pref.defaultView", "agenda");
    store.set("wecalendar.pref.weekStartsOnMonday", "yes");

    const first = getPrefsSnapshot();
    const second = getPrefsSnapshot();

    expect(first).toBe(second);
    expect(first).toEqual(getServerPrefsSnapshot());
    expect(first.defaultView).toBe("month");
    expect(first.weekStartsOnMonday).toBe(false);
  });

  it("updates stored values, returns a fresh snapshot, and dispatches PREF_EVENT", () => {
    const before = getPrefsSnapshot();
    setCalendarPref("weekStartsOnMonday", true);
    setCalendarPref("defaultView", "week");

    const after = getPrefsSnapshot();
    expect(after).not.toBe(before);
    expect(after.weekStartsOnMonday).toBe(true);
    expect(after.defaultView).toBe("week");
    expect(dispatchEvent).toHaveBeenCalledTimes(2);
    expect(dispatchEvent.mock.calls[0]?.[0]?.type).toBe(PREF_EVENT);
  });
});
```

- [ ] **Step 2: Run Vitest on the new test files to verify they fail**

Run: `npx vitest run src/lib/auth.test.ts src/lib/calendarPrefs.test.ts`
Expected: FAIL with missing exports (`validatePasswordRules`, `getPrefsSnapshot`, `setCalendarPref`).

- [ ] **Step 3: Implement password rules in `src/lib/auth.ts` and reactive `useSyncExternalStore` prefs in `src/lib/calendarPrefs.ts`**

- In `src/lib/auth.ts`: export `PasswordRules`, `validatePasswordRules(password)` (`length >= 8`, `/[A-Z]/`, `/[0-9]/`, `/[^A-Za-z0-9]/`), and `isPasswordValid(password)`.
- In `src/lib/calendarPrefs.ts`:
  - Export `PREF_EVENT = "wecalendar:pref-change"`, `getServerPrefsSnapshot(): CalendarPrefs` returning the frozen `DEFAULTS` object, and `getPrefsSnapshot(): CalendarPrefs` that computes the 7 fields from `localStorage`, caches the last `{ serializedKey, snapshot }`, and returns the cached object when the serialized key matches.
  - Export `setCalendarPref(key, value)` that writes `String(value)` to `KEYS[key]` in `localStorage` and calls `window.dispatchEvent(new Event(PREF_EVENT))` inside `try/catch`.
  - Replace the `useState` hooks inside `useCalendarPrefs()` with `const prefs = useSyncExternalStore(subscribePrefs, getPrefsSnapshot, getServerPrefsSnapshot)` and stable `useCallback` setters delegating to `setCalendarPref`.

- [ ] **Step 4: Run Vitest to verify Task 1 tests pass**

Run: `npx vitest run src/lib/auth.test.ts src/lib/calendarPrefs.test.ts`
Expected: PASS (all tests in both files green).

- [ ] **Step 5: Commit Task 1**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts src/lib/calendarPrefs.ts src/lib/calendarPrefs.test.ts
git commit -m "feat: add password rule validator and reactive calendar prefs store"
```

---

### Task 2: Monday-First Calendar Math & Multi-Day Span / TimeGrid Helpers

**Files:**
- Modify: `src/lib/calendar.ts:12-177`
- Modify: `src/lib/calendar.test.ts`
- Modify: `src/lib/events.ts:27-215`
- Modify: `src/lib/events.test.ts`

**Interfaces:**
- Consumes: existing `CalendarMode`, `CalendarDay`, `CalendarEvent`, `SpanPosition`, `EventLayout`
- Produces:
  - `src/lib/calendar.ts`:
    - `export function getWeekdayLabels(weekStartsOnMonday = false, style: "short" | "narrow" | "two" = "short"): string[]`
    - `export function startOfWeek(date: Date, weekStartsOnMonday = false): Date`
    - `export function isDateInView(date: Date, viewDate: Date, mode: CalendarMode, weekStartsOnMonday = false): boolean`
    - `export function formatWeekLabel(date: Date, weekStartsOnMonday = false): string`
    - `export function formatViewLabel(date: Date, mode: CalendarMode, weekStartsOnMonday = false): string`
    - `export function getMonthGrid(viewDate: Date, today = new Date(), weekStartsOnMonday = false): CalendarDay[]`
    - `export function getWeekDays(viewDate: Date, today = new Date(), weekStartsOnMonday = false): CalendarDay[]`
  - `src/lib/events.ts`:
    - `export function eventsForTimeGridDay(events: CalendarEvent[], day: Date): CalendarEvent[]`
    - `export function getSpanPosition(event: CalendarEvent, day: Date, dayOfWeek: number, weekStartsOnMonday = false): SpanPosition`
    - `export function getSeriesSpanPosition(event: CalendarEvent, allEvents: CalendarEvent[], day: Date, dayOfWeek: number, weekStartsOnMonday = false): SpanPosition`
    - `export function eventPosition(event: CalendarEvent, hourHeightPx: number, day?: Date): { top: number; height: number }`
    - `export function layoutOverlappingEvents(events: CalendarEvent[], day?: Date): EventLayout[]`

- [ ] **Step 1: Add failing tests for Monday week-start, series row-wrapping, exact-midnight boundaries, and per-day TimeGrid clipping**

Append to `src/lib/calendar.test.ts`:
```ts
describe("weekStartsOnMonday support", () => {
  it("returns Sunday-first vs Monday-first weekday labels across all styles", () => {
    expect(getWeekdayLabels(false, "short")).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    expect(getWeekdayLabels(true, "short")).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(getWeekdayLabels(true, "narrow")).toEqual(["M", "T", "W", "T", "F", "S", "S"]);
    expect(getWeekdayLabels(true, "two")).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
  });

  it("places Sunday at index 6 of the previous Monday week when weekStartsOnMonday is true", () => {
    const sunday = new Date(2026, 10, 8, 15, 30); // Sun Nov 8, 2026
    expect(startOfWeek(sunday, false)).toEqual(new Date(2026, 10, 8));
    expect(startOfWeek(sunday, true)).toEqual(new Date(2026, 10, 2));

    const grid = getMonthGrid(new Date(2026, 10, 1), new Date(2026, 10, 8), true); // Nov 1 2026 = Sunday
    expect(grid[0]?.date).toEqual(new Date(2026, 9, 26)); // Mon Oct 26
    expect(grid[6]?.date).toEqual(new Date(2026, 10, 1)); // Sun Nov 1 at col 6

    const weekDays = getWeekDays(sunday, sunday, true);
    expect(weekDays[0]?.date).toEqual(new Date(2026, 10, 2));
    expect(weekDays[6]?.date).toEqual(new Date(2026, 10, 8));
    expect(isDateInView(new Date(2026, 10, 2), sunday, "week", true)).toBe(true);
    expect(isDateInView(new Date(2026, 10, 1), sunday, "week", true)).toBe(false);
    expect(formatViewLabel(sunday, "week", true)).toBe("Nov 2 - 8, 2026");
  });
});
```

Append to `src/lib/events.test.ts`:
```ts
describe("Monday row-wrapping & TimeGrid multi-day clipping", () => {
  it("wraps multi-day and series spans at Sunday->Monday when weekStartsOnMonday is true", () => {
    // Fri Nov 6 18:00 -> Tue Nov 10 11:00, 2026
    const trip = makeEvent({
      id: "trip",
      recurrence_group_id: "rg-1",
      starts_at: new Date(2026, 10, 6, 18, 0).toISOString(),
      ends_at: new Date(2026, 10, 10, 11, 0).toISOString(),
    });

    // Saturday Nov 7 (dayOfWeek = 6): middle when Monday-first, end when Sunday-first
    expect(getSpanPosition(trip, new Date(2026, 10, 7), 6, false)).toBe("end");
    expect(getSpanPosition(trip, new Date(2026, 10, 7), 6, true)).toBe("middle");
    // Sunday Nov 8 (dayOfWeek = 0): start when Sunday-first, end when Monday-first
    expect(getSeriesSpanPosition(trip, [trip], new Date(2026, 10, 8), 0, true)).toBe("end");
    // Monday Nov 9 (dayOfWeek = 1): middle when Sunday-first, start when Monday-first
    expect(getSeriesSpanPosition(trip, [trip], new Date(2026, 10, 9), 1, true)).toBe("start");
  });

  it("clips multi-day events with endTime <= startTime across Fri/Sat/Sun in TimeGrid", () => {
    const retreat = makeEvent({
      id: "retreat",
      starts_at: new Date(2026, 10, 6, 18, 0).toISOString(), // Fri 6 PM
      ends_at: new Date(2026, 10, 8, 11, 0).toISOString(),   // Sun 11 AM
    });

    expect(eventPosition(retreat, 60, new Date(2026, 10, 6))).toEqual({ top: 18 * 60, height: 6 * 60 });
    expect(eventPosition(retreat, 60, new Date(2026, 10, 7))).toEqual({ top: 0, height: 24 * 60 });
    expect(eventPosition(retreat, 60, new Date(2026, 10, 8))).toEqual({ top: 0, height: 11 * 60 });
  });

  it("excludes trailing exact-midnight 00:00 endpoints from the next day's TimeGrid", () => {
    const lateShow = makeEvent({
      id: "late",
      starts_at: new Date(2026, 10, 6, 22, 0).toISOString(),
      ends_at: new Date(2026, 10, 7, 0, 0).toISOString(),
    });
    expect(eventsForTimeGridDay([lateShow], new Date(2026, 10, 6)).map((e) => e.id)).toEqual(["late"]);
    expect(eventsForTimeGridDay([lateShow], new Date(2026, 10, 7))).toEqual([]);
  });
});
```
*(Match the existing `makeEvent` helper signature in `src/lib/events.test.ts`.)*

- [ ] **Step 2: Run Vitest to verify the new tests fail**

Run: `npx vitest run src/lib/calendar.test.ts src/lib/events.test.ts`
Expected: FAIL (`getWeekdayLabels` / `eventsForTimeGridDay` missing, 4th/3rd args ignored).

- [ ] **Step 3: Implement `weekStartsOnMonday` in `src/lib/calendar.ts` and multi-day span/TimeGrid clipping in `src/lib/events.ts`**

- In `src/lib/calendar.ts`:
  - Add `getWeekdayLabels(weekStartsOnMonday = false, style = "short")`.
  - In `startOfWeek(date, weekStartsOnMonday = false)`: `const offset = weekStartsOnMonday ? (d.getDay() + 6) % 7 : d.getDay()`.
  - Thread `weekStartsOnMonday = false` into `isDateInView`, `formatWeekLabel`, `formatViewLabel`, `getMonthGrid` (`startOffset = weekStartsOnMonday ? (first.getDay() + 6) % 7 : first.getDay()`), and `getWeekDays`.
- In `src/lib/events.ts`:
  - In `getSpanPosition` and `getSeriesSpanPosition`: accept `weekStartsOnMonday = false`; set `isRowStart = dayOfWeek === (weekStartsOnMonday ? 1 : 0)` and `isRowEnd = dayOfWeek === (weekStartsOnMonday ? 0 : 6)`; forward `weekStartsOnMonday` when `getSeriesSpanPosition` calls `getSpanPosition`.
  - Add `eventsForTimeGridDay(events, day)`: include events where `start < dayEnd && end > dayStart` (or `isSameDay(start, day)` when `end.getTime() === start.getTime()`), sorted by `starts_at`.
  - Add internal helper `daySegmentMinutes(event, day?)` returning `{ startMinutes, endMinutes }`: when `day` is omitted, preserve existing clock-hour behavior; when `day` is provided, clamp `start` to `0` if `starts_at < startOfDay(day)` and `end` to `1440` if `ends_at > startOfDay(nextDay)` (with `Math.max(endMinutes, startMinutes + 30)` capped at `1440` unless `startMinutes > 1410`). Use `daySegmentMinutes` in both `eventPosition(event, hourHeightPx, day)` and `layoutOverlappingEvents(events, day)`.

- [ ] **Step 4: Run Vitest to verify all calendar & event tests pass**

Run: `npx vitest run src/lib/calendar.test.ts src/lib/events.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/lib/calendar.ts src/lib/calendar.test.ts src/lib/events.ts src/lib/events.test.ts
git commit -m "feat: support Monday week start and multi-day TimeGrid clipping"
```

---

### Task 3: Multi-Day Event Draft Expansion, Validation & `CreateEventModal`

**Files:**
- Modify: `src/lib/events.ts`
- Modify: `src/lib/events.test.ts`
- Modify: `src/components/CreateEventModal/CreateEventModal.tsx:95-450,835-915`

**Interfaces:**
- Consumes: `getWeekdayLabels`, `startOfDay`, `addDays` from `src/lib/calendar.ts`; `draftOverlapsExisting` from `src/lib/scheduling.ts`
- Produces:
  - `src/lib/events.ts`:
    - `export function expandEventDateKeys(startsAtIso: string, endsAtIso: string): string[]` (returns `YYYY-MM-DD` local date keys from `starts_at` through `ends_at`, excluding a trailing `00:00` midnight day when `ends_at > starts_at`)
    - `export function groupConsecutiveDateKeys(dates: Iterable<string>): string[][]`
    - `export function validateDraftDateGroups(groups: string[][], startTime: string, endTime: string, options?: { isSingleEventEdit?: boolean }): string | null`
  - `CreateEventModalProps`: adds optional `weekStartsOnMonday?: boolean`

- [ ] **Step 1: Write failing tests in `src/lib/events.test.ts` for date-key expansion and multi-day validation**

Append to `src/lib/events.test.ts`:
```ts
describe("multi-day modal date helpers", () => {
  it("expands multi-day spans into YYYY-MM-DD keys while ignoring exact-midnight trailing day", () => {
    expect(
      expandEventDateKeys(
        new Date(2026, 10, 6, 18, 0).toISOString(),
        new Date(2026, 10, 8, 11, 0).toISOString(),
      ),
    ).toEqual(["2026-11-06", "2026-11-07", "2026-11-08"]);

    expect(
      expandEventDateKeys(
        new Date(2026, 10, 6, 22, 0).toISOString(),
        new Date(2026, 10, 7, 0, 0).toISOString(),
      ),
    ).toEqual(["2026-11-06"]);
  });

  it("allows endTime <= startTime on multi-day groups, rejects it on single-day groups, and blocks split ranges on single-event edits", () => {
    const multiDay = groupConsecutiveDateKeys(["2026-11-06", "2026-11-07", "2026-11-08"]);
    expect(validateDraftDateGroups(multiDay, "18:00", "11:00")).toBeNull();

    const singleDay = groupConsecutiveDateKeys(["2026-11-06"]);
    expect(validateDraftDateGroups(singleDay, "18:00", "11:00")).toBe(
      "End time must be after start time.",
    );

    const splitDays = groupConsecutiveDateKeys(["2026-11-06", "2026-11-08"]);
    expect(
      validateDraftDateGroups(splitDays, "09:00", "11:00", { isSingleEventEdit: true }),
    ).toBe("Select consecutive dates when editing a single event.");
  });
});
```

- [ ] **Step 2: Run Vitest to verify the new modal helper tests fail**

Run: `npx vitest run src/lib/events.test.ts`
Expected: FAIL (`expandEventDateKeys`, `groupConsecutiveDateKeys`, `validateDraftDateGroups` not exported).

- [ ] **Step 3: Implement helpers in `src/lib/events.ts` and wire `CreateEventModal.tsx`**

- In `src/lib/events.ts`:
  - Implement `expandEventDateKeys(startsAtIso, endsAtIso)`, `groupConsecutiveDateKeys(dates)`, and `validateDraftDateGroups(groups, startTime, endTime, options)`:
    - Empty `groups` → `"Please select at least one date."`
    - `options?.isSingleEventEdit && groups.length > 1` → `"Select consecutive dates when editing a single event."`
    - `groups.some((g) => g.length === 1)` and `endMinutes <= startMinutes` → `"End time must be after start time."`
    - Otherwise `null`.
- In `src/components/CreateEventModal/CreateEventModal.tsx`:
  - Accept `weekStartsOnMonday = false` on `CreateEventModalProps` and `DayPicker`; replace hardcoded `DAYS = ["Su", ...]` and `firstDay = new Date(viewYear, viewMonth, 1).getDay()` with `getWeekdayLabels(weekStartsOnMonday, "two")` and `weekStartsOnMonday ? (rawFirstDay + 6) % 7 : rawFirstDay`.
  - Initialize `selectedDates` using `expandEventDateKeys(e.starts_at, e.ends_at)` for each item in `seriesEvents` (or `event`).
  - Update `softOverlap` `useMemo` to iterate over `groupConsecutiveDateKeys(selectedDates)` using `grp[0]` + `startTime` and `grp[grp.length - 1]` + `endTime`.
  - In `handleSubmit`: compute `groups = groupConsecutiveDateKeys(selectedDates)` first, then call `validateDraftDateGroups(groups, startTime, endTime, { isSingleEventEdit: Boolean(isEditing && event && !(seriesEvents.length > 1 && onUpdateSeries && event.recurrence_group_id)) })`.
  - Update `isOthersEvent` check (around line 847) to `Boolean(isEditing && currentUserId && event?.created_by && event.created_by !== currentUserId)` so `created_by === null` never mistriggers another-owner confirmation.

- [ ] **Step 4: Run Vitest and `tsc` on modified files**

Run: `npx vitest run src/lib/events.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/lib/events.ts src/lib/events.test.ts src/components/CreateEventModal/CreateEventModal.tsx
git commit -m "fix: support multi-day end times, reopening spans, and Monday DayPicker"
```

---

### Task 4: Thread `weekStartsOnMonday`, `TimeGrid` Clipping & Interactive `MiniCalendar`

**Files:**
- Modify: `src/components/Calendar/Calendar.tsx:11-95`
- Modify: `src/components/CalendarGrid/CalendarGrid.tsx:1-159`
- Modify: `src/components/CalendarCell/CalendarCell.tsx:1-140`
- Modify: `src/components/WeekView/WeekView.tsx:1-54`
- Modify: `src/components/TimeGrid/TimeGrid.tsx:160-175`
- Modify: `src/components/YearView/YearView.tsx:1-149`
- Modify: `src/components/EventViewerPanel/EventViewerPanel.tsx:41-93,310-370`
- Modify: `src/components/Sidebar/MiniCalendar.tsx:1-127`
- Modify: `src/components/Sidebar/Sidebar.tsx:18-145`

**Interfaces:**
- Consumes: Task 2 functions from `src/lib/calendar.ts` and `src/lib/events.ts`
- Produces:
  - `Calendar`, `CalendarGrid`, `CalendarCell`, `WeekView`, `YearView`, `EventViewerPanel`: optional `weekStartsOnMonday?: boolean` prop
  - `MiniCalendar`: `{ viewDate: Date; defaultOpen?: boolean; weekStartsOnMonday?: boolean; onSelectDate?: (date: Date) => void }`
  - `Sidebar`: adds optional `weekStartsOnMonday?: boolean`, `onSelectDate?: (date: Date) => void`, `workspaceModalRequestKey?: number`
  - `EventViewerPanel`: exports `bucketEvents(events: CalendarEvent[], now?: Date, weekStartsOnMonday?: boolean)` for direct unit testing

- [ ] **Step 1: Add a failing unit test in `src/lib/events.test.ts` (or `src/components/EventViewerPanel/bucketEvents.test.ts`) for `bucketEvents` Monday week boundary**

Create `src/components/EventViewerPanel/bucketEvents.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { bucketEvents } from "./EventViewerPanel";
import type { CalendarEvent } from "@/lib/events";

function ev(id: string, startsAt: Date): CalendarEvent {
  return {
    id,
    group_id: "g1",
    title: id,
    description: null,
    starts_at: startsAt.toISOString(),
    ends_at: new Date(startsAt.getTime() + 3600_000).toISOString(),
    created_by: "u1",
    has_conflict: false,
    recurrence_group_id: null,
    created_at: startsAt.toISOString(),
    updated_at: startsAt.toISOString(),
  };
}

describe("bucketEvents weekStartsOnMonday", () => {
  it("keeps upcoming Sunday in 'thisWeek' when weekStartsOnMonday is true (vs 'nextWeek' when false)", () => {
    const wedNow = new Date(2026, 10, 4, 10, 0); // Wed Nov 4, 2026
    const sunEvent = ev("sun", new Date(2026, 10, 8, 12, 0)); // Sun Nov 8, 2026

    const sunStart = bucketEvents([sunEvent], wedNow, false);
    expect(sunStart.nextWeek.map((e) => e.id)).toEqual(["sun"]);

    const monStart = bucketEvents([sunEvent], wedNow, true);
    expect(monStart.thisWeek.map((e) => e.id)).toEqual(["sun"]);
  });
});
```

- [ ] **Step 2: Run Vitest to verify `bucketEvents.test.ts` fails**

Run: `npx vitest run src/components/EventViewerPanel/bucketEvents.test.ts`
Expected: FAIL (`bucketEvents` is not exported).

- [ ] **Step 3: Update Calendar views, `TimeGrid`, `EventViewerPanel`, `MiniCalendar`, and `Sidebar`**

- `EventViewerPanel.tsx`: export `bucketEvents(events, now = new Date(), weekStartsOnMonday = false)` using `startOfWeek(todayStart, weekStartsOnMonday)`; accept `weekStartsOnMonday = false` on `EventViewerPanelProps`.
- `Calendar.tsx` → pass `weekStartsOnMonday` to `WeekView`, `CalendarGrid`, `YearView`.
- `CalendarGrid.tsx` → pass `weekStartsOnMonday` to `getMonthGrid(viewDate, new Date(), weekStartsOnMonday)`, render `getWeekdayLabels(weekStartsOnMonday, "short")`, and pass `weekStartsOnMonday` to `CalendarCell`.
- `CalendarCell.tsx` → pass `weekStartsOnMonday` to `getSeriesSpanPosition(event, events, day.date, dayOfWeek, weekStartsOnMonday)`.
- `WeekView.tsx` → call `getWeekDays(viewDate, new Date(), weekStartsOnMonday)`.
- `TimeGrid.tsx` → replace `eventsForDay(events, day.date)` with `eventsForTimeGridDay(events, day.date)`, pass `day.date` into `layoutOverlappingEvents(..., day.date)` and `eventPosition(event, HOUR_HEIGHT_PX, day.date)`.
- `YearView.tsx` → pass `weekStartsOnMonday` to `MiniMonth` → `getMonthGrid(monthDate, new Date(), weekStartsOnMonday)` and `getWeekdayLabels(weekStartsOnMonday, "narrow")`.
- `MiniCalendar.tsx` → add `weekStartsOnMonday = false` and `onSelectDate?: (date: Date) => void`:
  - Track `displayMonth` state (`startOfMonth(viewDate)`), syncing when `viewDate.getFullYear()` or `viewDate.getMonth()` changes.
  - Add `‹` / `›` buttons (`aria-label="Previous month"` / `"Next month"`) inside the header row with `e.stopPropagation()` shifting `displayMonth` via `addMonths(displayMonth, -1 | 1)`.
  - Compute weekday headers via `getWeekdayLabels(weekStartsOnMonday, "narrow")` and `firstDayOffset = weekStartsOnMonday ? (rawFirst + 6) % 7 : rawFirst`.
  - Render day cells as `<button type="button" onClick={() => onSelectDate?.(cellDate)}>`; style `isSelected && !isToday` with `boxShadow: "inset 0 0 0 1.5px var(--accent)"` and `background: "var(--accent-muted)"`.
- `Sidebar.tsx` → forward `weekStartsOnMonday` and `onSelectDate` to `<MiniCalendar />` (and prepare `workspaceModalRequestKey` prop forwarded to `<SharedWorkspace />` in Task 6).

- [ ] **Step 4: Run Vitest across all tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/components/Calendar/Calendar.tsx src/components/CalendarGrid/CalendarGrid.tsx src/components/CalendarCell/CalendarCell.tsx src/components/WeekView/WeekView.tsx src/components/TimeGrid/TimeGrid.tsx src/components/YearView/YearView.tsx src/components/EventViewerPanel/EventViewerPanel.tsx src/components/EventViewerPanel/bucketEvents.test.ts src/components/Sidebar/MiniCalendar.tsx src/components/Sidebar/Sidebar.tsx
git commit -m "feat: wire weekStartsOnMonday across views and make MiniCalendar interactive"
```

---

### Task 5: Account & Group Lifecycle SQL Migration, Database Types & Data Export Helper

**Files:**
- Create: `supabase/migrations/20261104210000_account_and_group_lifecycle.sql`
- Modify: `src/types/database.ts:39-515`
- Create: `src/lib/accountExport.ts`
- Create: `src/lib/accountExport.test.ts`

**Interfaces:**
- Consumes: `Database`, `Tables` from `src/types/database.ts`
- Produces:
  - SQL RPCs in `public`:
    - `leave_group(p_group_id uuid) returns void`
    - `leave_all_groups() returns void`
    - `delete_own_account() returns void`
  - `src/types/database.ts`:
    - `created_by: string | null` on `Row` and `created_by?: string | null` on `Update` for `groups`, `events`, `lists`, `list_items`, `tags`, `note_folders`, `notes` (`Insert` keeps `created_by: string`)
    - `Database["public"]["Functions"]` entries for `leave_group`, `leave_all_groups`, `delete_own_account`
  - `src/lib/accountExport.ts`:
    - `export type AccountExportBundle = { exportedAt: string; user: { id: string; email: string | null }; profile: Tables<"profiles"> | null; groups: Tables<"groups">[]; events: Tables<"events">[]; tags: Tables<"tags">[]; eventTags: Tables<"event_tags">[]; noteFolders: Tables<"note_folders">[]; notes: Tables<"notes">[]; lists: Tables<"lists">[]; listItems: Tables<"list_items">[] }`
    - `export function serializeAccountExport(bundle: AccountExportBundle): string`
    - `export function formatExportFilename(now?: Date): string` (`wecalendar-export-YYYY-MM-DD.json`)
    - `export function triggerJsonDownload(filename: string, json: string): void`
    - `export async function fetchAccountExportBundle(supabase: SupabaseClient<Database>, user: { id: string; email?: string | null }, exportedAt?: string): Promise<AccountExportBundle>`

- [ ] **Step 1: Write failing tests in `src/lib/accountExport.test.ts` (including zero-group and null-creator rows)**

Create `src/lib/accountExport.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import {
  fetchAccountExportBundle,
  formatExportFilename,
  serializeAccountExport,
} from "./accountExport";

describe("accountExport", () => {
  it("formats export filename as wecalendar-export-YYYY-MM-DD.json", () => {
    expect(formatExportFilename(new Date(2026, 10, 4, 15, 0))).toBe(
      "wecalendar-export-2026-11-04.json",
    );
  });

  it("handles zero-group users without querying group-scoped tables and preserves null created_by rows", async () => {
    const fromSpy = vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "u1",
                  display_name: "Alex",
                  avatar_url: null,
                  theme_preferences: {},
                  created_at: "2026-11-04T00:00:00Z",
                  updated_at: "2026-11-04T00:00:00Z",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "group_members") {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`Unexpected query on ${table} when user has zero groups`);
    });

    const bundle = await fetchAccountExportBundle(
      { from: fromSpy } as never,
      { id: "u1", email: "alex@example.com" },
      "2026-11-04T20:00:00.000Z",
    );

    expect(bundle.groups).toEqual([]);
    expect(bundle.events).toEqual([]);
    expect(fromSpy).toHaveBeenCalledTimes(2);

    const parsed = JSON.parse(
      serializeAccountExport({
        ...bundle,
        events: [
          {
            id: "e1",
            group_id: "g1",
            title: "Shared Dinner",
            description: null,
            starts_at: "2026-11-05T18:00:00Z",
            ends_at: "2026-11-05T20:00:00Z",
            created_by: null,
            has_conflict: false,
            recurrence_group_id: null,
            created_at: "2026-11-04T00:00:00Z",
            updated_at: "2026-11-04T00:00:00Z",
          },
        ],
      }),
    );
    expect(parsed.events[0].created_by).toBeNull();
  });
});
```

- [ ] **Step 2: Run Vitest to verify `accountExport.test.ts` fails**

Run: `npx vitest run src/lib/accountExport.test.ts`
Expected: FAIL (`./accountExport` module not found).

- [ ] **Step 3: Create `supabase/migrations/20261104210000_account_and_group_lifecycle.sql`, update `src/types/database.ts`, and implement `src/lib/accountExport.ts`**

- In `supabase/migrations/20261104210000_account_and_group_lifecycle.sql`:
  1. For each table in `groups`, `events`, `lists`, `list_items`, `tags`, `note_folders`, `notes`:
     ```sql
     alter table public.<table> alter column created_by drop not null;
     alter table public.<table> drop constraint if exists <table>_created_by_fkey;
     alter table public.<table>
       add constraint <table>_created_by_fkey
       foreign key (created_by) references public.profiles (id) on delete set null;
     ```
  2. Define `public.leave_group(p_group_id uuid) returns void language plpgsql security definer set search_path = public`:
     - Raise `'Not authenticated'` if `auth.uid() is null`.
     - Return early if caller is not in `public.group_members` for `p_group_id`.
     - If `not exists (select 1 from public.group_members where group_id = p_group_id and user_id <> auth.uid())`, `delete from public.groups where id = p_group_id;` and return.
     - Otherwise:
       - `delete from public.notes where group_id = p_group_id and visibility = 'private' and created_by = auth.uid();`
       - `delete from public.note_folders where group_id = p_group_id and visibility = 'private' and created_by = auth.uid();`
       - `delete from public.group_members where group_id = p_group_id and user_id = auth.uid();`
       - Check if an `'owner'` still exists in `group_members` for `p_group_id`; if not, select `user_id into next_owner_id` ordered by `joined_at asc, id asc limit 1` and update `group_members set role = 'owner' where group_id = p_group_id and user_id = next_owner_id`.
       - Update `public.groups set created_by = coalesce(next_owner_id, (select user_id from public.group_members where group_id = p_group_id and role = 'owner' order by joined_at asc, id asc limit 1)) where id = p_group_id and (created_by is null or created_by = auth.uid());`
  3. Define `public.leave_all_groups() returns void language plpgsql security definer set search_path = public` looping over caller's `group_id`s and calling `public.leave_group(gid)`.
  4. Define `public.delete_own_account() returns void language plpgsql security definer set search_path = public`:
     - Raise `'Not authenticated'` if `auth.uid() is null`.
     - Perform `public.leave_all_groups()`.
     - `delete from auth.users where id = auth.uid();`
     - `alter function public.delete_own_account() owner to postgres;`
  5. `grant execute` on `leave_group(uuid)`, `leave_all_groups()`, and `delete_own_account()` to `authenticated`.
- Update `src/types/database.ts` for nullable `created_by` on `Row`/`Update` and the 3 new `Functions`.
- Implement `src/lib/accountExport.ts` (`fetchAccountExportBundle`, `serializeAccountExport`, `formatExportFilename`, and browser helper `triggerJsonDownload(filename, json)`). When `groupIds.length === 0`, return empty arrays immediately without querying group-scoped tables.

- [ ] **Step 4: Run Vitest to verify `accountExport.test.ts` passes**

Run: `npx vitest run src/lib/accountExport.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit Task 5**

```bash
git add supabase/migrations/20261104210000_account_and_group_lifecycle.sql src/types/database.ts src/lib/accountExport.ts src/lib/accountExport.test.ts
git commit -m "feat: add account/group lifecycle SQL RPCs, nullable created_by types, and export helper"
```

---

### Task 6: Wire `AppShell`, `Navbar`, `SharedWorkspace` & `NotesApp`

**Files:**
- Modify: `src/components/Navbar/Navbar.tsx:378-462,658-708,906-911`
- Modify: `src/components/SharedWorkspace/SharedWorkspace.tsx:8-39`
- Modify: `src/components/Sidebar/Sidebar.tsx:18-145`
- Modify: `src/components/Notes/NotesApp.tsx:30-95,282-296`
- Modify: `src/components/AppShell/AppShell.tsx:41-175,270-315,880-1102`

**Interfaces:**
- Consumes: Tasks 1–5 interfaces (`useCalendarPrefs`, `formatViewLabel`, `isDateInView`, nullable `created_by` in `database.ts`)
- Produces:
  - `NavbarProps`: adds optional `userAvatarUrl?: string | null`
  - `SharedWorkspaceProps`: adds optional `openModalRequestKey?: number` (increments open the Add/Join Calendar modal and expand the card if collapsed)
  - `NotesAppProps`: adds optional `onOpenWorkspaceModal?: () => void`

- [ ] **Step 1: Update `Navbar.tsx` (`ProfileMenu`) to render `userAvatarUrl` with error fallback**

- Add `userAvatarUrl?: string | null` to `NavbarProps` and `ProfileMenu`.
- Track `failedAvatarUrl` state (`string | null`) inside `ProfileMenu` so `const showAvatar = Boolean(userAvatarUrl && failedAvatarUrl !== userAvatarUrl)` resets automatically when `userAvatarUrl` changes without needing an effect.
- Render `<img src={userAvatarUrl!} alt="" onError={() => setFailedAvatarUrl(userAvatarUrl ?? null)} className="h-full w-full rounded-full object-cover" />` inside the `h-8 w-8 overflow-hidden` trigger button when `showAvatar` is true, falling back to `userInitials`.

- [ ] **Step 2: Support external workspace-modal opening in `SharedWorkspace.tsx`, `Sidebar.tsx`, and `NotesApp.tsx`**

- In `SharedWorkspace.tsx`: accept `openModalRequestKey?: number`; track the last handled non-zero key so incrementing `openModalRequestKey` sets `collapsed = false` and `modalOpen = true`.
- In `Sidebar.tsx`: accept `workspaceModalRequestKey?: number` and pass `openModalRequestKey={workspaceModalRequestKey}` to `<SharedWorkspace />`.
- In `NotesApp.tsx`: accept `onOpenWorkspaceModal?: () => void` and render a `"Create or join workspace"` primary pill button inside the `if (!groupId)` empty state (lines 282–296) when `onOpenWorkspaceModal` is provided.

- [ ] **Step 3: Wire `defaultView`, `weekStartsOnMonday`, `userAvatarUrl`, zero-group onboarding, and nullable `created_by` in `AppShell.tsx`**

- Sync `calendarMode` with `prefs.defaultView`: track `appliedDefaultViewRef = useRef<CalendarMode>(prefs.defaultView)` in an effect so when `prefs.defaultView` changes (including initial client hydration from `localStorage` or returning from `/profile`), `setCalendarMode(prefs.defaultView)` runs once per change while manual mode switches in `Navbar` remain unrestricted.
- Load signed-in user's `profiles` row (`display_name, avatar_url`) when `user` changes, storing `userAvatarUrl` and `profileDisplayName` (used for `getInitials(profileDisplayName || user?.user_metadata?.display_name || user?.email)`).
- In `loadEvents` (lines 132 & 164): filter `creatorIds` with `.filter((id): id is string => Boolean(id))` and guard `event.created_by ? creatorsById.get(event.created_by) ?? null : null`.
- Add `workspaceModalRequestKey` state and `openWorkspaceOnboarding()` helper (`setSidebarOpen(true); setWorkspaceModalRequestKey((k) => k + 1)`).
- Pass:
  - `userAvatarUrl={userAvatarUrl}` to `Navbar`
  - `prefs.weekStartsOnMonday` to `formatViewLabel`, `isDateInView`, `Sidebar` (+ `onSelectDate={setViewDate}`), `Calendar`, `EventViewerPanel`, and `CreateEventModal`
  - `showWorkspace={prefs.showWorkspaceInSidebar || groups.length === 0}` and `workspaceModalRequestKey={workspaceModalRequestKey}` to `Sidebar`
  - `onOpenWorkspaceModal={openWorkspaceOnboarding}` to `NotesApp`
  - Add a `"Create or join calendar"` action button inside the `!activeGroupId` banner in `AppShell` (`lines 1023-1036`) calling `openWorkspaceOnboarding`.

- [ ] **Step 4: Run `npx tsc --noEmit` and `npx vitest run` to verify full type & test health**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS (`tsc` exits 0, all Vitest suites pass).

- [ ] **Step 5: Commit Task 6**

```bash
git add src/components/Navbar/Navbar.tsx src/components/SharedWorkspace/SharedWorkspace.tsx src/components/Sidebar/Sidebar.tsx src/components/Notes/NotesApp.tsx src/components/AppShell/AppShell.tsx
git commit -m "feat: wire defaultView, navbar avatar, MiniCalendar selection, and zero-group onboarding"
```

---

### Task 7: `LoginForm` & `ProfilePage` — Password Security & Danger Zone Actions

**Files:**
- Modify: `src/components/Auth/LoginForm.tsx:38-55`
- Modify: `src/app/profile/page.tsx:570-760,1035-1105,1173-1263`

**Interfaces:**
- Consumes: `validatePasswordRules`, `isPasswordValid` from `src/lib/auth.ts`; `fetchAccountExportBundle`, `serializeAccountExport`, `formatExportFilename`, `triggerJsonDownload` from `src/lib/accountExport.ts`; RPCs `leave_group`, `leave_all_groups`, `delete_own_account` from `src/types/database.ts`
- Produces: Complete end-to-end Account & Security and Danger Zone UX on `/profile`

- [ ] **Step 1: Deduplicate password rule logic in `src/components/Auth/LoginForm.tsx`**

Replace the inline `pwRules` / `pwAllValid` regex block in `LoginForm.tsx` with `validatePasswordRules(password)` and `isPasswordValid(password)` imported from `@/lib/auth`.

- [ ] **Step 2: Harden `handleChangePassword` & password form UI in `src/app/profile/page.tsx`**

- Derive `pwRules = validatePasswordRules(newPassword)` and `pwAllValid = isPasswordValid(newPassword)`.
- Add `passwordError: string | null`, `passwordSaved: boolean`, and `passwordBusy: boolean` state.
- Render the 4-rule strength checklist (`At least 8 characters`, `One uppercase letter (A–Z)`, `One number (0–9)`, `One symbol (!@#$…)`) beneath *New password* whenever `newPassword.length > 0`, plus inline `role="alert"` error text and `"Password updated!"` confirmation.
- In `handleChangePassword`:
  1. Require `currentPassword`, `pwAllValid`, and `newPassword === confirmPassword`.
  2. Re-authenticate via `supabase.auth.signInWithPassword({ email, password: currentPassword })`; if it returns an error, set `passwordError("Current password is incorrect.")` and return.
  3. Call `supabase.auth.updateUser({ password: newPassword })`; surface `error.message` if present, otherwise clear inputs and flash `passwordSaved = true` for 2500 ms.

- [ ] **Step 3: Wire *Leave a group*, *Leave all groups*, *Export your data*, and *Delete account* in `src/app/profile/page.tsx`**

- Add `dangerError: string | null` and `dangerNotice: string | null` banner states rendered at the top of the Danger Zone card.
- `handleLeaveGroup(groupId)`:
  - Call `supabase.rpc("leave_group", { p_group_id: groupId })`; surface `error.message` on failure.
  - Reload groups; if `activeGroupId === groupId`, update `activeGroupId` and `ACTIVE_GROUP_KEY` in `localStorage` to `nextGroups[0]?.id` (or remove `ACTIVE_GROUP_KEY` when empty).
- `handleLeaveAllGroups()`:
  - Wire `onClick` on `leave-all-groups-btn` → call `supabase.rpc("leave_all_groups")`; on success set `groups([])`, `setActiveGroupId(null)`, remove `ACTIVE_GROUP_KEY`, and set `dangerNotice("Left all shared workspaces.")`.
- `handleExportData()`:
  - Wire `onClick` on `export-data-btn` → authenticate `supabase.auth.getUser()`, build bundle via `fetchAccountExportBundle(supabase, user)`, trigger download via `triggerJsonDownload(formatExportFilename(), serializeAccountExport(bundle))`, and set `dangerNotice("Your data export has downloaded.")`.
- `handleDeleteAccount()`:
  - Wire `onClick` on `delete-account-btn` → authenticate `supabase.auth.getUser()`:
    1. Best-effort list `supabase.storage.from("avatars").list(user.id)` and if files exist call `supabase.storage.from("avatars").remove(files.map((f) => `${user.id}/${f.name}`))`.
    2. Call `const { error } = await supabase.rpc("delete_own_account")`; if `error`, set `dangerError(error.message)` and abort.
    3. Remove all `localStorage` keys starting with `"wecalendar"`, call `await supabase.auth.signOut()`, and navigate via `router.replace("/login"); router.refresh()`.

- [ ] **Step 4: Run full verification suite (`tsc`, `lint`, `vitest`, production `build`)**

Run:
```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```
Expected: All four commands exit `0` with zero errors.

- [ ] **Step 5: Commit Task 7**

```bash
git add src/components/Auth/LoginForm.tsx src/app/profile/page.tsx
git commit -m "feat: harden password change and wire leave/export/delete account actions"
```
