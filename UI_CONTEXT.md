# WeCalendar — Full Project Context

> Last updated: August 2026
> Stack: **Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase**

---

## 1. What Is WeCalendar?

A **shared calendar and productivity web app** designed for small groups (couples, roommates, families, friend groups). The core idea is a collaborative space where multiple users share one calendar, event lists, shared task/grocery/wish lists, and tags — all in real time via Supabase Realtime.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.11 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS v4 + vanilla CSS custom properties |
| Backend / Auth / DB | Supabase (PostgreSQL + RLS + Auth + Realtime) |
| Fonts | Varela Round (display) + Nunito Sans (body) via `next/font/google` |
| Testing | Vitest 4 + `@vitest/coverage-v8` |
| Deployment | Vercel (planned) |

### Key Dependencies

```json
"@supabase/ssr": "^0.12.3"
"@supabase/supabase-js": "^2.110.8"
"next": "16.2.11"
"react": "19.2.4"
"vitest": "^4"
"@vitest/coverage-v8": "^4"
```

---

## 3. Repository Structure

```
WeCalendar/
├── src/
│   ├── app/
│   │   ├── globals.css               # Design system (CSS custom properties)
│   │   ├── layout.tsx                # Root layout — loads fonts, metadata
│   │   ├── page.tsx                  # Home → renders <AppShell />
│   │   ├── auth/callback/route.ts    # Supabase auth callback handler
│   │   ├── login/page.tsx            # Login page (LoginForm component)
│   │   └── profile/page.tsx          # Profile & Settings page (client component)
│   │
│   ├── components/
│   │   ├── AppShell/                 # Root client shell — owns ALL shared state
│   │   ├── Auth/                     # LoginForm component
│   │   ├── Navbar/                   # Top bar: logo, nav, search, mode picker, avatar
│   │   ├── Sidebar/                  # Left panel: create event, mini calendar, tag filters + creator
│   │   ├── Calendar/                 # Calendar view switcher (month/week/day/year)
│   │   ├── CalendarGrid/             # 6×7 month grid, weekday headers
│   │   ├── CalendarCell/             # Single day cell — event chips coloured by tag
│   │   ├── TimeGrid/                 # Hour-slotted grid for day/week views, event blocks
│   │   ├── WeekView/                 # 7-column time grid wrapper
│   │   ├── DayView/                  # 1-column time grid wrapper
│   │   ├── YearView/                 # 12-month compact year overview
│   │   ├── CreateEventModal/         # Event create/edit/delete modal with tag picker
│   │   ├── TagCreatorInline/         # Reusable inline tag creator (name + palette + color picker)
│   │   ├── SharedWorkspace/          # Group switcher + create/join modal (inside Sidebar)
│   │   ├── TaskPanel/                # Shared lists panel (lists + list_items CRUD)
│   │   └── RightPanel/               # Right side panel — hosts TaskPanel or Map placeholder
│   │
│   ├── lib/
│   │   ├── auth.ts                   # getInitials() helper
│   │   ├── calendar.ts               # Pure date utilities + CalendarDay type
│   │   ├── events.ts                 # eventsForDay(), eventPosition(), formatEventTime()
│   │   ├── scheduling.ts             # isSchedulingConflictError(), SCHEDULING_CONFLICT_MESSAGE
│   │   ├── tags.ts                   # Tag/EventTag types, TAG_PALETTE, colorForEvent(), tagIdsForEvent()
│   │   ├── calendar.test.ts          # Vitest: 33 tests for calendar.ts
│   │   ├── events.test.ts            # Vitest: 10 tests for events.ts
│   │   ├── tags.test.ts              # Vitest: 12 tests for tags.ts
│   │   └── supabase/
│   │       ├── client.ts             # Browser Supabase client
│   │       ├── server.ts             # Server Component Supabase client
│   │       └── proxy.ts              # Session refresh helper (used by src/proxy.ts)
│   │
│   ├── types/
│   │   └── database.ts               # Hand-maintained Supabase TypeScript types
│   │
│   └── proxy.ts                      # Next.js 16 request proxy (replaces middleware)
│
├── supabase/
│   └── migrations/
│       ├── 20260730120000_init_schema.sql              # Base schema
│       ├── 20260806130000_fix_profile_signup_trigger.sql
│       ├── 20260806140000_bootstrap_schema.sql         # Full schema with all tables + RLS
│       ├── 20260807150000_events_no_overlap.sql        # Scheduling conflict constraint
│       ├── 20260818000000_tags.sql                     # tags + event_tags tables + RLS
│       └── 20260818160000_lists_realtime.sql           # Adds lists/list_items to Realtime
│
├── graphify-out/
│   ├── GRAPH_REPORT.md               # Code graph community/hub analysis
│   ├── graph.html                    # Interactive graph viewer
│   └── graph.json                    # Raw graph data
│
├── vitest.config.mts                 # Vitest config (path alias @/ → src/)
├── .github/workflows/ci.yml         # CI: type-check → lint → unit tests → build
├── .env.local                        # Local env vars (not committed)
└── UI_CONTEXT.md                     # This file
```

---

## 4. Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Both variables are **public** (safe to expose to the browser). They rely on Row Level Security (RLS) for data protection.

> **Never** prefix the `service_role` key with `NEXT_PUBLIC_`. Only use it server-side.

---

## 5. Design System

All design tokens live in `src/app/globals.css` as CSS custom properties. The entire theme can be recolored by changing one variable.

### Color Tokens

```css
:root {
  --theme-primary: #6366f1;       /* Indigo — user-configurable */
  --theme-primary-hover: #4f46e5;
  --theme-primary-muted: #eef2ff;
  --theme-primary-text: #3730a3;

  --background: #f5f4ff;
  --foreground: #1e1b4b;
  --surface: #ffffff;
  --surface-2: #f0f0ff;
  --border: #e0e0f5;

  /* All accent-* vars alias theme-primary-* */
  --accent: var(--theme-primary);
  --accent-hover: var(--theme-primary-hover);
  --accent-muted: var(--theme-primary-muted);
  --accent-text: var(--theme-primary-text);
}
```

### Native Browser Widget Suppression

```css
/* Hides Edge/IE built-in password reveal button so it doesn't
   clash with our custom show/hide toggle */
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear { display: none; }
```

### Border Radius Scale (Bubbly-Minimal)

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 8px | Chips, checkboxes, focus rings |
| `--radius-md` | 14px | Buttons, icon badges |
| `--radius-lg` | 20px | Inputs, small cards |
| `--radius-xl` | 28px | Large cards, panels, calendar grid |
| `--radius-full` | 9999px | Pills, avatars, tag filters |

### Typography

| Role | Font | Weights |
|---|---|---|
| Display / Logo / Headings | Varela Round | 400 |
| Body / UI / Labels | Nunito Sans | 300–700 |

Loaded via `next/font/google` in `layout.tsx` — no `@import` needed in CSS.

### Micro-Interaction Utility Classes

| Class | Effect |
|---|---|
| `.btn-bounce` | Lifts 1px on hover, scales 0.97 on press |
| `.animate-fade-in` | 220ms fade + slide-up on mount |
| `.today-badge` | Soft indigo pulse ring (2.4s infinite) |

`prefers-reduced-motion` cuts all animations to 0.01ms globally.

---

## 6. Component Reference

### `AppShell` — State Hub

`src/components/AppShell/AppShell.tsx`

Single state owner for the entire app. Owns data fetching, Supabase Realtime subscriptions, and all event/tag/list handlers.

| State | Type | Purpose |
|---|---|---|
| `viewDate` | `Date` | Which date is currently displayed |
| `calendarMode` | `CalendarMode` | `"day"` / `"week"` / `"month"` / `"year"` |
| `screenView` | `ScreenView` | `"calendar"` / `"tasks"` / `"map"` |
| `sidebarOpen` | `boolean` | Sidebar collapse toggle |
| `activeTagIds` | `string[]` | DB tag IDs active in the filter (empty = show all) |
| `searchQuery` | `string` | Search bar value (filters event title + description) |
| `user` | `User \| null` | Supabase auth user |
| `groups` | `Group[]` | All groups the user belongs to |
| `activeGroupId` | `string \| null` | Currently selected group (persisted in localStorage) |
| `events` | `CalendarEvent[]` | All events for the active group |
| `tags` | `Tag[]` | All tags for the active group |
| `eventTags` | `EventTag[]` | All event↔tag join rows for the active group |
| `lists` | `SharedList[]` | All shared lists for the active group |
| `listItems` | `ListItem[]` | All list items across all lists |
| `modalOpen` | `boolean` | Create/edit event modal open state |
| `selectedEvent` | `CalendarEvent \| null` | Event being viewed/edited |
| `modalDefaultDate` | `Date` | Pre-filled date when opening modal via double-click |

**Realtime subscriptions**: `events`, `tags`, `event_tags`, `lists`, `list_items` — all update on any `*` Postgres change.

**Filtered events**: `filteredEvents` is a `useMemo` that applies text search then tag filter. Tag filter shows events with ≥1 matching tag; empty `activeTagIds` shows all.

---

### `Navbar`

`src/components/Navbar/Navbar.tsx`

Top bar (h-14). Left-to-right:
- **Hamburger** → toggles `sidebarOpen`
- **Logo** — "W" badge + "WeCalendar" wordmark (Varela Round)
- **Today button** — resets `viewDate` to today
- **Prev / Next arrows** — navigate by day/week/month/year
- **View label** — e.g. "August 2026" or "Jun 15 - 21, 2025" (`<h1>`)
- **Search bar** — pill input with magnifier + clear ✕
- **Mode select** — Day / Week / Month / Year (`<select>`, pill)
- **Screen view switcher** — icon toggle group (Calendar / Tasks / Map)
- **Avatar** — user initials circle, links to `/profile`

---

### `Sidebar`

`src/components/Sidebar/Sidebar.tsx`

Width animates `0 → 256px` (CSS transition on `width`). Contains:

1. **Create Event** — indigo pill button with `+` icon
2. **SharedWorkspace** — group switcher + modal (create/join/show invite code)
3. **MiniCalendar** — compact month grid, today circled with accent + pulse
4. **Tag Filters** — dynamic DB-backed tag list with colour-coded checkboxes
   - Tags are fully dynamic (per group, created by members)
   - "Select all / Clear all" toggle
   - Inline **"+ New tag"** form when in a group (via `TagCreatorInline`)

---

### `TagCreatorInline`

`src/components/TagCreatorInline/TagCreatorInline.tsx`

Reusable inline form used in both `Sidebar` and `CreateEventModal`.

- Name text input (Enter to submit, Escape to dismiss)
- **5 preset colour swatches**: indigo, rose, emerald, amber, sky
- **Native `<input type="color">` picker** for any custom colour
- Live preview swatch of current selection
- "Add" button renders in the chosen colour

---

### `CreateEventModal`

`src/components/CreateEventModal/CreateEventModal.tsx`

Modal for create / edit / delete of events. Props: `open`, `defaultDate`, `event` (null = create mode), `tags`, `initialTagIds`, `onClose`, `onCreate`, `onUpdate`, `onDelete`, `onCreateTag`.

- **Title**, **description** (textarea), **date**, **start time**, **end time** fields
- **Tag picker** — pill-style multi-select of all group tags; active = filled colour
- **Inline `TagCreatorInline`** — create a new tag without leaving the modal
- **Delete flow** — first click shows "Confirm delete" (red), second click deletes
- Clicking outside the modal closes it

`EventDraft` type:
```ts
type EventDraft = {
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  tagIds: string[];   // ← tag IDs to attach on save
};
```

---

### `CalendarGrid` (Month View)

`src/components/CalendarGrid/CalendarGrid.tsx`

6×7 grid from `getMonthGrid(viewDate)`. Props include `tags` + `eventTags` for colour-coding.

- **Double-click** on a cell → opens create modal pre-filled with that date

---

### `CalendarCell`

`src/components/CalendarCell/CalendarCell.tsx`

Single day tile. Shows up to 3 event chips; "+N more" for overflow.

- Event chip colour = first tag's hex colour via `colorForEvent()`, fallback `var(--accent)`
- `onDoubleClick` → `onDayDoubleClick(day.date)` bubble

---

### `TimeGrid`

`src/components/TimeGrid/TimeGrid.tsx`

Hour-slotted grid used by both `WeekView` and `DayView`. Accepts `tags` + `eventTags`.

- Event blocks coloured by first tag via `colorForEvent()`
- "Now" indicator line (red dot + horizontal line)
- **Double-click** on hour slot → calculates exact time (snaps to `:00` or `:30`) → opens create modal

---

### `TaskPanel`

`src/components/TaskPanel/TaskPanel.tsx`

Shared lists CRUD panel, shown in `RightPanel` when `screenView === "tasks"`.

- **Categories**: `todo`, `grocery`, `wishlist`, `custom`
- **Create list** — name input + category select + Add button
- **ListCard** per list — shows name, category, "N left" count, items, delete
- **Items**: checkbox toggle (optimistic update), ✕ to delete, inline "Add item" input
- Shows "Join or create a workspace" placeholder when no `groupId`

**Exports**: `SharedList`, `ListItem`, `ListCategory` types (re-used in `AppShell` and `RightPanel`).

---

### `RightPanel`

`src/components/RightPanel/RightPanel.tsx`

Right side panel (`w-80` on desktop, full-width on mobile). Visible when `screenView` is `"tasks"` or `"map"`.

- `tasks` → renders `<TaskPanel />`
- `map` → "Content coming soon" placeholder

---

### `LoginForm`

`src/components/Auth/LoginForm.tsx`

Handles both sign-up and sign-in via a tab switcher (`Create account` / `Sign in`).

**Sign-up fields:** Display name, Email, Password  
**Sign-in fields:** Email, Password

#### Password field
- **Show/hide toggle** — persistent eye/eye-off SVG button inside a `<div className="relative">` wrapper; the input `type` attribute toggles between `"password"` and `"text"` without remounting
- **Native reveal suppressed** — `input[type="password"]::-ms-reveal { display: none }` in `globals.css` prevents Edge/IE from showing a second icon
- **Mode-aware placeholder** — `"Min. 8 characters"` in signup, `"Password"` in sign-in
- **Strength checklist** — appears in signup mode once the user starts typing; 4 rules derived from current value (no extra state, just a computed `pwRules` object):

| Rule | Regex / check |
|---|---|
| 8+ characters | `password.length >= 8` |
| Uppercase letter | `/[A-Z]/` |
| Number | `/[0-9]/` |
| Symbol (`!@#…`) | `/[^A-Za-z0-9]/` |

  - Each row shows a green ✓ (met) or grey ✗ (unmet)
  - Input border turns green when all 4 pass (`pwAllValid`)
  - "Create account" button disabled until `pwAllValid` is true
  - Server-side guard in `handleSubmit` as a fallback

**Error handling:** `formatAuthError()` maps Supabase error shapes to human-readable strings.

---

### `Profile Page`

`src/app/profile/page.tsx` — `"use client"`

Four collapsible sections (chevron rotates 180°, content animates via `grid-template-rows: 0fr → 1fr`):

| Section | `defaultOpen` | Contents |
|---|---|---|
| Your Profile | `true` | Avatar upload, display name, pronouns, birthday, favorite color |
| Account & Security | `true` | Change password (current → new → confirm) |
| Notifications | `false` | 4 toggle checkboxes |
| Danger Zone | `false` | Sign out, Unsync, Leave a group (selector), Leave all, Export, Delete account |

**Sub-components:**
- `SectionCard` — collapsible card wrapper
- `FieldLabel` — styled `<label>` helper
- `TextInput` — styled `<input>` with focus ring
- `DangerButton` — two-step confirm/cancel row. Props: `id`, `icon`, `title`, `description`, `onClick?`, `confirmLabel`, `buttonLabel?` (overrides the first-word-of-title default for the trigger button)
- `LeaveGroupRow` — single danger row with a styled `<select>` dropdown of the user's groups + `Leave` button. States: `selectedId`, `confirming`. On confirm: calls `onLeave(groupId)`, resets selector. Shows disabled `"No groups"` option when user has no groups.

**Danger zone button order:** `[Confirm action]` `[Cancel]` — Cancel is on the right to catch double-clicks safely.

**State loaded on mount:**
- Auth user → email, display name
- `profiles` table → display name, theme_preferences (favorite_color, pronouns, birthday)
- `group_members` joined with `groups` → `groups: { id, name }[]` for the `LeaveGroupRow` selector

**Handlers:**
- `handleSaveProfile` — upserts `profiles` + updates auth metadata
- `handleChangePassword` — `supabase.auth.updateUser({ password })`
- `handleSignOut` — signs out + redirects to `/login`
- `handleLeaveGroup(groupId)` — deletes from `group_members` where `(group_id, user_id)` match; removes group from local state optimistically

**Avatar:** click circle → file input → `URL.createObjectURL()` → preview. Remove button appears when photo is set.

**Favorite color:** native `<input type="color">` picker + hex text input, synced bidirectionally.

---

## 7. Routing

| Route | Page | Notes |
|---|---|---|
| `/` | `AppShell` | Main calendar app |
| `/login` | `LoginPage` | Auth form wired to Supabase |
| `/profile` | `ProfilePage` | Settings — reached via avatar in navbar |
| `/auth/callback` | Route Handler | Supabase OAuth/magic link callback |

---

## 8. Supabase / Backend

### Request Proxy (Next.js 16)

`src/proxy.ts` exports `proxy()` — replaces the deprecated `middleware.ts` file convention. Refreshes the Supabase auth session on every request.

### Supabase Clients

| File | Context | Client type |
|---|---|---|
| `lib/supabase/client.ts` | Client Components | `createBrowserClient` |
| `lib/supabase/server.ts` | Server Components / Route Handlers | `createServerClient` |

### Database Tables

```
auth.users
  └── profiles            (1:1 — auto-created via trigger on auth.users insert)
        ├── groups         (created_by → profiles.id)
        │     ├── group_members  (user_id, role: "owner" | "member")
        │     ├── events         (starts_at, ends_at, has_conflict; no-overlap constraint)
        │     ├── tags           (name, color; unique per group+name)
        │     │     └── event_tags  (event_id ↔ tag_id join table)
        │     └── lists          (category: "grocery"|"todo"|"wishlist"|"custom")
        │           └── list_items  (content, is_checked, sort_order)
```

RLS is enabled on all tables. Members only see data for groups they belong to.

### RPCs (use these — don't insert directly)

| RPC | Args | Purpose |
|---|---|---|
| `create_group` | `p_name: string` | Creates group, sets invite code, adds caller as `owner` |
| `join_group_by_invite` | `p_invite_code: string` | Adds caller as `member` |
| `is_group_member` | `p_group_id: string` | Boolean — used internally by RLS |
| `is_group_owner` | `p_group_id: string` | Boolean — used internally by RLS |
| `is_list_group_member` | `p_list_id: string` | Boolean — used internally by RLS |
| `is_event_group_member` | `p_event_id: uuid` | Boolean — used by event_tags RLS |
| `is_tag_group_member` | `p_tag_id: uuid` | Boolean — used by event_tags RLS |

### Realtime Subscriptions (in AppShell)

| Table | Filter | Trigger |
|---|---|---|
| `events` | `group_id=eq.{id}` | `loadEvents()` |
| `tags` | `group_id=eq.{id}` | `loadTags()` |
| `event_tags` | none | `loadEventTags()` |
| `lists` | `group_id=eq.{id}` | `loadLists()` |
| `list_items` | none | `loadLists()` |

---

## 9. Tags System

Tags are group-scoped labels that can be attached to events. They drive both event colour-coding and sidebar filtering.

### Data flow

```
Supabase tags table
  → AppShell (tags[], eventTags[])
    → Sidebar (filter checkboxes + TagCreatorInline)
    → CreateEventModal (tag picker + TagCreatorInline)
    → Calendar → CalendarGrid → CalendarCell (chip colour)
    → Calendar → WeekView/DayView → TimeGrid (block colour)
```

### Key helpers (`src/lib/tags.ts`)

| Export | Purpose |
|---|---|
| `TAG_PALETTE` | 5 preset hex colours for the tag creator swatches |
| `colorForEvent(eventId, eventTags, tags)` | Returns hex of first tag, or `undefined` |
| `tagIdsForEvent(eventId, eventTags)` | Returns `string[]` of tag IDs for an event |

### Filtering logic

- `activeTagIds.length === 0` → show all events (no filter)
- `activeTagIds.length > 0` → show events with ≥1 matching tag ID

---

## 10. Shared Lists / Tasks

Lists and items are stored in `lists` + `list_items` tables and CRUD'd through `AppShell` handlers.

| Handler | Action |
|---|---|
| `handleCreateList(name, category)` | INSERT into `lists` |
| `handleDeleteList(listId)` | DELETE from `lists` (cascade deletes items) |
| `handleAddListItem(listId, content)` | INSERT into `list_items` with `sort_order` = sibling count |
| `handleToggleListItem(itemId, isChecked)` | UPDATE `is_checked` (optimistic UI update) |
| `handleDeleteListItem(itemId)` | DELETE from `list_items` (optimistic UI update) |

Realtime keeps lists in sync across all group members.

---

## 11. Calendar Interactions

| Interaction | Result |
|---|---|
| Click event chip (month view) | Opens event detail/edit modal |
| Click event block (week/day view) | Opens event detail/edit modal |
| Double-click day cell (month view) | Opens create modal pre-filled with that date |
| Double-click hour slot (week/day view) | Opens create modal pre-filled with exact time (snaps to :00/:30) |
| "Create Event" sidebar button | Opens create modal for current `viewDate` |

---

## 12. CI Pipeline

`.github/workflows/ci.yml` runs on every pull request:

1. `npx tsc --noEmit` — TypeScript type check (0 errors required)
2. `npm run lint` — ESLint (0 errors required; warnings allowed)
3. `npm test` — Vitest: 55 unit tests across `calendar.ts`, `events.ts`, `tags.ts`
4. `npm run build` — Next.js production build (requires Supabase secrets)

---

## 13. What's Done vs. Pending

### Done

- [x] Design system — tokens, fonts, shadows, animations, focus styles
- [x] App shell with sidebar, navbar, calendar grid layout
- [x] Month / Week / Day / Year calendar views
- [x] Today highlighting (tinted cell + top bar + pulse badge)
- [x] Supabase auth — login, session refresh, auth callback route
- [x] Group create / join via invite code (SharedWorkspace modal)
- [x] Events — create, edit, delete via modal; real-time sync
- [x] Scheduling conflict detection (DB constraint + UI message)
- [x] Double-click to create event (month cells + time grid slots)
- [x] **Tags system** — per-group tags, event tagging, colour-coded chips, sidebar filter
- [x] **TagCreatorInline** — name + 5 presets + native colour picker
- [x] **Shared lists (Tasks panel)** — to-do, grocery, wishlist, custom; real-time sync
- [x] Search bar — filters events by title + description
- [x] Profile & Settings page (collapsible sections, danger zone)
- [x] TypeScript types for all tables (`src/types/database.ts`)
- [x] Unit tests — 55 tests via Vitest (`calendar.ts`, `events.ts`, `tags.ts`)
- [x] CI pipeline — type check + lint + tests + build

### Pending

- [ ] Profile persistence — save fields to `profiles` Supabase table
- [ ] Favorite color → runtime theme — apply hex to `--theme-primary`
- [ ] Tasks panel — drag-to-reorder list items
- [ ] Map view — `RightPanel` "map" mode content
- [ ] Vercel production deployment

---

## 14. Development Commands

```bash
npm run dev            # Start dev server → http://localhost:3000
npm run build          # Production build
npm run lint           # ESLint
npm test               # Vitest unit tests (one-shot)
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Vitest with lcov coverage report
```

### Apply DB Schema

1. Open Supabase Dashboard → SQL Editor
2. Run migrations in order:
   - `20260806140000_bootstrap_schema.sql` (full base schema)
   - `20260807150000_events_no_overlap.sql` (conflict constraint)
   - `20260818000000_tags.sql` (tags + event_tags)
   - `20260818160000_lists_realtime.sql` (realtime for lists)

---

## 15. Key Design Decisions

| Decision | Rationale |
|---|---|
| CSS custom properties for theming (not Tailwind config) | Runtime theme switching per user without a rebuild |
| Inline `style` props for themed elements (not Tailwind utilities) | Design tokens resolve at runtime, not at build time |
| `grid-template-rows: 0fr → 1fr` for collapse animation | Pure CSS, no JS height measurement, works with unknown content height |
| Danger zone: Confirm left, Cancel right | Cancel occupies the same position as the initial action button — safe for double-clicks |
| Fonts via `next/font/google` (not CSS `@import`) | Next.js optimizes loading (preload, no FOUT, no layout shift) |
| `proxy.ts` instead of `middleware.ts` | Next.js 16 deprecated the `middleware` file convention |
| Tags default to empty filter (show all) | Show everything by default; users opt-in to narrowing |
| `AppShell` as the single state owner | Avoids context or global state for a small app; keeps data flow traceable |
| `TagCreatorInline` as a shared component | Used in both Sidebar and CreateEventModal — single source of truth for tag creation UX |
| `colorForEvent()` returns `undefined` (not a default) | Callers decide the fallback; prevents accidental colour overrides |
| Optimistic updates for list item toggle/delete | Instant UI response; Realtime corrects any drift from the server |
