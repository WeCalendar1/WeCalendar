# External Calendar Sync & Unsync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire end-to-end external calendar `.ics` URL subscription, `.ics` file import/export, and the `#unsync-calendar-btn` Danger Zone action on `/profile` backed by `public.calendar_syncs` and `public.events.sync_id`.

**Architecture:** Add `public.calendar_syncs`, `public.events.sync_id` (`ON DELETE CASCADE`), `public.events.external_uid`, same-group integrity triggers, and `public.unsync_my_calendars` in a new SQL migration. Implement pure RFC 5545 `.ics` parsing, `.ics` serialization, SSRF-safe URL validation, provider detection, and local unmigrated fallback storage in `src/lib/calendarSync.ts`, expose an authenticated SSRF-hardened `POST /api/calendar-sync/fetch` proxy route, and wire `/profile` sync controls and `#unsync-calendar-btn`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Supabase (`@supabase/ssr`, PostgreSQL RLS, triggers, RPC), Tailwind CSS v4, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-11-08-external-calendar-sync-design.md`

## Global Constraints

- Zero `SUPABASE_SERVICE_ROLE_KEY` requirement and zero new npm dependencies.
- All `SECURITY DEFINER` Postgres functions/triggers must set `search_path = public`, be owned by `postgres`, and `revoke all ... from public, anon` (granting `execute` to `authenticated` only where required).
- `POST /api/calendar-sync/fetch` must require an authenticated Supabase user, validate URLs via `validateExternalIcsUrl` (HTTPS/webcal only, port 443/default only, no credentials, no localhost or private/link-local IPv4/IPv6 literals), disallow HTTP redirects (`redirect: "error"`), and cap body size at `2 MB`.
- Graceful unmigrated degradation: if `public.calendar_syncs` or `events.sync_id` does not exist yet (`42P01`, `42703`, `PGRST204`, `PGRST205`), `/profile` and `fetchAccountExportBundle` must degrade cleanly without crashing.
- Preserve `#unsync-calendar-btn` ID on `/profile` and membership-first locking in `public.leave_group`.

## Review Focus

- SSRF via `webcal://` or `https://` pointing at localhost, loopback (`127.0.0.1`, `[::1]`), private RFC 1918 ranges (`10.*`, `172.16-31.*`, `192.168.*`), link-local metadata (`169.254.169.254`), or non-443 ports: `validateExternalIcsUrl` must reject all of them — tested in Task 2 (`src/lib/calendarSync.test.ts`).
- RFC 5545 folded lines, escaped characters (`\n`, `\,`, `\;`), cancelled events (`STATUS:CANCELLED`), and exclusive all-day `VALUE=DATE` end dates (`DTSTART;VALUE=DATE:20261110`, `DTEND;VALUE=DATE:20261111`): `parseIcsEvents` must unfold lines, skip cancelled events, and convert exclusive all-day `DTEND` to inclusive local day end (`23:59:00`) — tested in Task 2 (`src/lib/calendarSync.test.ts`).
- Unmigrated Supabase database missing `public.calendar_syncs` (`42P01` / `PGRST205`): `fetchAccountExportBundle` must degrade `calendarSyncs` to `[]` while still throwing on genuine errors — tested in Task 1 (`src/lib/accountExport.test.ts`).
- `REPLICA IDENTITY FULL` on `public.calendar_syncs`, `ON DELETE CASCADE` on `events.sync_id`, and `unsync_my_calendars` / `leave_group` cleanup — tested in Task 1 & Task 2 (`src/lib/calendarSync.test.ts`).
- Round-trip `.ics` export via `serializeEventsToIcs` with special characters (`;`, `,`, newlines) and re-parsing via `parseIcsEvents` — tested in Task 2 (`src/lib/calendarSync.test.ts`).

---

### Task 1: Calendar Sync SQL Migration, Database Types & Account Export

**Files:**
- Create: `supabase/migrations/20261108210000_calendar_sync.sql`
- Modify: `src/types/database.ts`
- Modify: `src/lib/accountExport.ts`
- Modify: `src/lib/accountExport.test.ts`
- Modify: `src/lib/events.test.ts`
- Modify: `src/lib/eventPicker.test.ts`
- Modify: `src/components/EventViewerPanel/bucketEvents.test.ts`

**Interfaces:**
- Produces:
  - SQL table `public.calendar_syncs`, columns `public.events.sync_id` & `public.events.external_uid`, helpers/triggers `public.is_sync_in_group` & `public.enforce_event_sync_same_group`, RPC `public.unsync_my_calendars(p_group_id uuid default null) -> integer`, and updated `public.leave_group(p_group_id uuid)`.
  - `Database["public"]["Tables"]["calendar_syncs"]`, `Database["public"]["Tables"]["events"]` with `sync_id: string | null` and `external_uid: string | null`, and `Database["public"]["Functions"]["unsync_my_calendars"]` in `src/types/database.ts`.
  - `AccountExportBundle.calendarSyncs: Tables<"calendar_syncs">[]` in `src/lib/accountExport.ts`.

- [ ] **Step 1: Write failing tests in `src/lib/accountExport.test.ts` (and add `sync_id: null, external_uid: null` to event fixtures)**

Add `expect(bundle.calendarSyncs).toEqual([])` to the zero-group test, `calendar_syncs` mock + assertion to the group export test, and `calendar_syncs: { data: null, error: { code: "42P01", message: 'relation "public.calendar_syncs" does not exist' } }` to the unmigrated fallback test in `src/lib/accountExport.test.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/accountExport.test.ts`
Expected: FAIL (`bundle.calendarSyncs` is `undefined`).

- [ ] **Step 3: Create `supabase/migrations/20261108210000_calendar_sync.sql`, update `src/types/database.ts`, and update `src/lib/accountExport.ts` & test fixtures**

- Create `supabase/migrations/20261108210000_calendar_sync.sql` implementing Spec §4.
- Update `src/types/database.ts` (`events` Row/Insert/Update with `sync_id` & `external_uid`, `calendar_syncs` table, `unsync_my_calendars` RPC).
- Update `src/lib/accountExport.ts` to query `supabase.from("calendar_syncs").select("*").eq("user_id", userId).order("created_at", { ascending: true })` with `isMissingRelationError` fallback to `[]`.
- Add `sync_id: null, external_uid: null` to `makeEvent` helpers in `src/lib/events.test.ts`, `src/lib/eventPicker.test.ts`, and `src/components/EventViewerPanel/bucketEvents.test.ts`.

- [ ] **Step 4: Run tests and typecheck to verify they pass**

Run: `npx tsc --noEmit && npx vitest run src/lib/accountExport.test.ts`
Expected: PASS (exit 0).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261108210000_calendar_sync.sql src/types/database.ts src/lib/accountExport.ts src/lib/accountExport.test.ts src/lib/events.test.ts src/lib/eventPicker.test.ts src/components/EventViewerPanel/bucketEvents.test.ts
git commit -m "feat: add calendar_syncs schema, unsync RPC, types, and export support"
```

---

### Task 2: Pure `.ics` Parser, Serializer, SSRF URL Validator & Fetch Route

**Files:**
- Create: `src/lib/calendarSync.ts`
- Create: `src/lib/calendarSync.test.ts`
- Create: `src/app/api/calendar-sync/fetch/route.ts`

**Interfaces:**
- Consumes: `Tables<"calendar_syncs">`, `Tables<"events">` from `src/types/database.ts`.
- Produces:
  - `CalendarSync = Tables<"calendar_syncs">`
  - `CalendarSyncProvider = CalendarSync["provider"]` (`"google" | "outlook" | "apple" | "ics"`)
  - `ParsedIcsEvent = { externalUid: string; title: string; description: string | null; startsAt: string; endsAt: string }`
  - `detectCalendarProvider(input: string): CalendarSyncProvider`
  - `validateExternalIcsUrl(rawUrl: string): { ok: true; url: string } | { ok: false; error: string }`
  - `extractIcsCalendarName(icsText: string): string | null`
  - `parseIcsEvents(icsText: string, maxEvents?: number): ParsedIcsEvent[]`
  - `serializeEventsToIcs(events: readonly Pick<Tables<"events">, "id" | "title" | "description" | "starts_at" | "ends_at" | "updated_at">[], calendarName?: string): string`
  - `readLocalCalendarSyncs(userId: string): LocalCalendarSync[]`
  - `writeLocalCalendarSyncs(userId: string, syncs: readonly LocalCalendarSync[]): void`
  - `clearLocalCalendarSyncs(userId: string): number`
  - `POST /api/calendar-sync/fetch` in `src/app/api/calendar-sync/fetch/route.ts`

- [ ] **Step 1: Write failing unit tests in `src/lib/calendarSync.test.ts`**

Cover:
1. `validateExternalIcsUrl`: normalizes `webcal://calendar.google.com/calendar/ical/test/basic.ics` to `https://...`, accepts `https://outlook.live.com/...`, and rejects `http://`, `localhost`, `127.0.0.1`, `10.0.0.1`, `172.16.0.1`, `192.168.1.1`, `169.254.169.254`, `[::1]`, `[fe80::1]`, credentials (`https://user:pass@example.com/a.ics`), and custom ports (`https://example.com:8443/a.ics`).
2. `detectCalendarProvider`: classifies Google, Outlook/Office365, Apple/iCloud, and generic `.ics` inputs.
3. `parseIcsEvents` & `extractIcsCalendarName`: unfolds RFC 5545 folded lines, unescapes `\n`/`\,`/`\;`, extracts `X-WR-CALNAME`, skips `STATUS:CANCELLED`, parses UTC `DTSTART`/`DTEND` and all-day `VALUE=DATE` (converting exclusive `DTEND;VALUE=DATE:20261111` to inclusive local `2026-11-10T23:59:00`), and generates deterministic `externalUid` when `UID` is missing.
4. `serializeEventsToIcs`: round-trips WeCalendar events to RFC 5545 `.ics` and back through `parseIcsEvents`.
5. Local sync storage fallback (`readLocalCalendarSyncs`, `writeLocalCalendarSyncs`, `clearLocalCalendarSyncs`) and SQL migration invariants (`REPLICA IDENTITY FULL` on `public.calendar_syncs`, `unsync_my_calendars`, `enforce_event_sync_same_group`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/calendarSync.test.ts`
Expected: FAIL (cannot find `./calendarSync`).

- [ ] **Step 3: Implement `src/lib/calendarSync.ts` and `src/app/api/calendar-sync/fetch/route.ts`**

- Implement all exported functions in `src/lib/calendarSync.ts`.
- Implement `POST /api/calendar-sync/fetch` in `src/app/api/calendar-sync/fetch/route.ts`:
  - Authenticate user with `await createClient()` from `@/lib/supabase/server` (`supabase.auth.getUser()`), returning `401` if unauthenticated.
  - Validate `body.url` with `validateExternalIcsUrl`, returning `400` on invalid URL.
  - Fetch with `redirect: "error"`, `signal: AbortSignal.timeout(10_000)`, `headers: { Accept: "text/calendar, text/plain;q=0.9, */*;q=0.1" }`, read up to `2 * 1024 * 1024` bytes, verify `BEGIN:VCALENDAR` is present, and return `{ icsText }`.

- [ ] **Step 4: Run tests, typecheck, and lint to verify they pass**

Run: `npx vitest run src/lib/calendarSync.test.ts && npx tsc --noEmit && npm run lint`
Expected: PASS (exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/lib/calendarSync.ts src/lib/calendarSync.test.ts src/app/api/calendar-sync/fetch/route.ts
git commit -m "feat: add RFC 5545 ICS parser/serializer, SSRF validator, and fetch route"
```

---

### Task 3: Wire External Calendar Sync UI & `#unsync-calendar-btn` on `/profile`

**Files:**
- Modify: `src/app/profile/page.tsx`

**Interfaces:**
- Consumes: `CalendarSync`, `PROVIDER_LABEL`, `detectCalendarProvider`, `validateExternalIcsUrl`, `extractIcsCalendarName`, `parseIcsEvents`, `serializeEventsToIcs`, `readLocalCalendarSyncs`, `writeLocalCalendarSyncs`, `clearLocalCalendarSyncs` from `src/lib/calendarSync.ts`; `isMissingColumnOrRelationError` from `src/lib/notifications.ts`.
- Produces:
  - Connected external calendars list, `.ics` URL subscription form (`#sync-ics-url-input`, `#sync-ics-label-input`, `#sync-ics-url-btn`), `.ics` file import (`#sync-ics-file-input`, `#sync-ics-file-btn`), and `.ics` workspace export (`#export-ics-btn`) inside the **Shared Calendars** card on `/profile`.
  - Working `handleUnsyncCalendars` wired to `#unsync-calendar-btn` in the **Danger Zone** on `/profile`.

- [ ] **Step 1: Wire sync state, handlers, UI controls, and `#unsync-calendar-btn` in `src/app/profile/page.tsx`**

- Load the user's `calendar_syncs` rows on `/profile` mount (falling back to `readLocalCalendarSyncs(user.id)` when `isMissingColumnOrRelationError(error)`).
- Add `syncEventsIntoWorkspace(params)` helper inside `ProfilePage` that upserts/inserts `calendar_syncs` and upserts/replaces the parsed `events` for `(sync_id, external_uid)` in `activeGroupId` (with unmigrated fallback that inserts standard `events` rows and tracks their IDs in `writeLocalCalendarSyncs`).
- Wire:
  - `handleSyncIcsUrl`: validates URL with `validateExternalIcsUrl`, POSTs to `/api/calendar-sync/fetch`, parses `VEVENT`s via `parseIcsEvents`, and syncs into `activeGroupId`.
  - `handleImportIcsFile`: reads `.ics` file text, parses `VEVENT`s via `parseIcsEvents`, and syncs into `activeGroupId`.
  - `handleRefreshSync(sync)`: re-fetches `sync.source_url` and updates events + `last_synced_at` + `synced_event_count`.
  - `handleDisconnectSync(syncId)`: deletes the `calendar_syncs` row (cascading to its `events`) and removes any local fallback events.
  - `handleExportIcs`: queries `events` for `activeGroupId`, generates `.ics` text with `serializeEventsToIcs`, and triggers a browser `.ics` file download.
  - `handleUnsyncCalendars` wired to `#unsync-calendar-btn` in Danger Zone: calls `supabase.rpc("unsync_my_calendars")` (plus fallback deletion of `calendar_syncs` and any local fallback event IDs), clears `calendarSyncs` state, and sets `dangerNotice` with the count of disconnected calendars/events.

- [ ] **Step 2: Run full verification (`tsc`, `lint`, `test`, `build`)**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: All four commands exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/profile/page.tsx
git commit -m "feat: wire external calendar ICS sync, export, and unsync action on profile"
```
