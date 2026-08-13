# WeCalendar — Full Project Context

> Last updated: August 2026  
> Stack: **Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase**

---

## 1. What Is WeCalendar?

A **shared calendar and productivity web app** designed for small groups (couples, roommates, families, friend groups). The core idea is a collaborative space where multiple users share one calendar, event lists, reminders, and notes — all in real time.

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
| Deployment | Vercel (planned) |

### Key Dependencies

```json
"@supabase/ssr": "^0.12.3"
"@supabase/supabase-js": "^2.110.8"
"next": "16.2.11"
"react": "19.2.4"
```

---

## 3. Repository Structure

```
WeCalendar/
├── src/
│   ├── app/
│   │   ├── globals.css          # Design system (CSS custom properties)
│   │   ├── layout.tsx           # Root layout — loads fonts, metadata
│   │   ├── page.tsx             # Home → renders <AppShell />
│   │   ├── login/page.tsx       # Login page (auth UI placeholder)
│   │   └── profile/page.tsx     # Profile & Settings page (client component)
│   │
│   ├── components/
│   │   ├── AppShell/            # Root client shell — owns all shared state
│   │   ├── Navbar/              # Top bar: logo, nav, search, mode picker, avatar
│   │   ├── Sidebar/             # Left panel: create event, mini calendar, tag filters
│   │   ├── Calendar/            # Calendar view switcher (month/week/day/year)
│   │   ├── CalendarGrid/        # 6x7 month grid, weekday headers
│   │   ├── CalendarCell/        # Single day cell — today highlighting, event chips (future)
│   │   └── RightPanel/          # Tasks / Map side panel (placeholder)
│   │
│   ├── lib/
│   │   ├── calendar.ts          # Pure date utilities + CalendarDay type
│   │   └── supabase/
│   │       ├── client.ts        # Browser Supabase client
│   │       ├── server.ts        # Server Component Supabase client
│   │       └── proxy.ts         # Session refresh helper (used by src/proxy.ts)
│   │
│   ├── types/
│   │   └── database.ts          # Hand-maintained Supabase TypeScript types
│   │
│   └── proxy.ts                 # Next.js 16 request proxy (replaces middleware)
│
├── supabase/
│   ├── migrations/
│   │   └── 20260730120000_init_schema.sql   # Full DB schema + RLS
│   └── seed.sql
│
├── docs/
│   └── schema.md                # Schema reference + apply instructions
│
├── .env.local                   # Local env vars (not committed)
├── .env.example                 # Template for required env vars
└── CONTEXT.md                   # This file
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

Owns all top-level state and distributes it via props. Never fetches data.

| State | Type | Default | Purpose |
|---|---|---|---|
| `viewDate` | `Date` | `startOfMonth(today)` | Which month is displayed |
| `calendarMode` | `CalendarMode` | `"month"` | Day / Week / Month / Year |
| `screenView` | `ScreenView` | `"calendar"` | Calendar / Tasks / Map |
| `sidebarOpen` | `boolean` | `true` | Sidebar collapse toggle |
| `activeTagIds` | `string[]` | all 6 tags | Active filter tags |
| `searchQuery` | `string` | `""` | Search bar value |

---

### `Navbar`

`src/components/Navbar/Navbar.tsx`

Top bar (h-14, surface background, shadow-sm). Left-to-right:
- **Hamburger** → toggles `sidebarOpen`
- **Logo** — "W" badge + "WeCalendar" wordmark (Varela Round)
- **Today button** — resets `viewDate` to current month (pill shape)
- **Prev / Next arrows** — month navigation
- **Month label** — e.g. "August 2026" (`<h1>`)
- **Search bar** — hidden on mobile, pill input with magnifier + clear ✕
- **Mode select** — Day / Week / Month / Year (`<select>`, pill)
- **Screen view switcher** — icon toggle group (Calendar / Tasks / Map)
- **Avatar** — "M" initial circle, links to `/profile`

---

### `Sidebar`

`src/components/Sidebar/Sidebar.tsx`

Width animates `0 → 256px` (CSS transition on `width`). Contains:

1. **Create Event** — indigo pill button with `+` icon (handler is a no-op pending modal)
2. **MiniCalendar** — compact month grid, today circled with accent + pulse
3. **Tag Filters** — 6 color-coded custom checkboxes

| Tag ID | Label | Color |
|---|---|---|
| `personal` | Personal | `#6366f1` indigo |
| `work` | Work | `#0ea5e9` sky |
| `birthdays` | Birthdays | `#f43f5e` rose |
| `holidays` | Holidays | `#f59e0b` amber |
| `reminders` | Reminders | `#10b981` emerald |
| `shared` | Shared | `#8b5cf6` violet |

Select/Clear All toggle at the top. Active tags passed up to AppShell → down to Calendar.

---

### `CalendarGrid`

`src/components/CalendarGrid/CalendarGrid.tsx`

6×7 grid built from `getMonthGrid(viewDate)`. Weekday header row (Sun–Sat) with `--surface-2` background.

---

### `CalendarCell`

`src/components/CalendarCell/CalendarCell.tsx`

Single day tile. Visual states:

| Condition | Style |
|---|---|
| Today | `--accent-muted` bg + thin top accent bar + pulsing badge |
| Current month | White surface |
| Adjacent month | `--surface-2`, muted date number |
| Hover | `--accent-muted` background tint |

Event chips area reserved inside each cell (not yet implemented).

---

### `Profile Page`

`src/app/profile/page.tsx` — `"use client"`

Four collapsible sections (chevron rotates 180°, content animates via `grid-template-rows: 0fr → 1fr`):

| Section | `defaultOpen` | Contents |
|---|---|---|
| Your Profile | `true` | Avatar upload, display name, pronouns, birthday, favorite color |
| Account & Security | `true` | Change password (current → new → confirm) |
| Notifications | `false` | 4 toggle checkboxes |
| Danger Zone | `false` | 5 destructive actions with two-step confirm |

**Danger zone button order:** `[Confirm action]` `[Cancel]` — Cancel is on the right to catch double-clicks safely.

Avatar: click circle → file input → `URL.createObjectURL()` → preview. Remove button appears when photo is set.

Favorite color: native `<input type="color">` picker + hex text input, synced bidirectionally.

---

## 7. Routing

| Route | Page | Notes |
|---|---|---|
| `/` | `AppShell` | Main calendar app |
| `/login` | `LoginPage` | Placeholder — no auth gating yet |
| `/profile` | `ProfilePage` | Settings — reached via avatar in navbar |

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
        │     ├── events         (starts_at, ends_at, has_conflict)
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

---

## 9. What's Done vs. Pending

### Done

- [x] Design system — tokens, fonts, shadows, animations, focus styles
- [x] App shell with sidebar, navbar, calendar grid layout
- [x] Month grid with today highlighting (tinted cell + top bar + pulse badge)
- [x] Sidebar tag filter system (6 tags, custom checkboxes, select/clear all)
- [x] Search bar in navbar (pill shape, magnifier, clear button)
- [x] Profile & Settings page (all 4 sections, collapsible, danger zone with confirm flow)
- [x] Supabase project connected (env vars configured)
- [x] Full DB schema + RLS written (`supabase/migrations/`)
- [x] TypeScript types for all tables (`src/types/database.ts`)
- [x] Next.js 16 `proxy.ts` (session refresh on all routes)
- [x] Dynamic theming via `--theme-primary` CSS variable

### Pending

- [ ] Auth UI — sign up / login forms wired to Supabase Auth
- [ ] Session gating — redirect unauthenticated users to `/login`
- [ ] Event create modal — form inserting into `events` table
- [ ] Event chips on calendar cells
- [ ] Search filtering — `searchQuery` filters visible events
- [ ] Tag filtering — `activeTagIds` filters events by category
- [ ] Profile persistence — save fields to `profiles` Supabase table
- [ ] Favorite color → runtime theme — apply hex to `--theme-primary`
- [ ] Group management UI — create / join via invite code
- [ ] Realtime subscriptions — live updates for events + list items
- [ ] Tasks panel — `RightPanel` wired to `lists` + `list_items`
- [ ] Week / Day / Year calendar views
- [ ] Vercel production deployment

---

## 10. Development Commands

```bash
npm run dev        # Start dev server → http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint
```

### Apply DB Schema

1. Open Supabase Dashboard → SQL Editor
2. Paste `supabase/migrations/20260730120000_init_schema.sql`
3. Run — confirms tables: `profiles`, `groups`, `group_members`, `events`, `lists`, `list_items`

Or via CLI:
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

---

## 11. Key Design Decisions

| Decision | Rationale |
|---|---|
| CSS custom properties for theming (not Tailwind config) | Runtime theme switching per user without a rebuild |
| Inline `style` props for themed elements (not Tailwind utilities) | Design tokens resolve at runtime, not at build time |
| `grid-template-rows: 0fr → 1fr` for collapse animation | Pure CSS, no JS height measurement, works with unknown content height |
| Danger zone: Confirm left, Cancel right | Cancel occupies the same position as the initial action button — safe for double-clicks |
| Fonts via `next/font/google` (not CSS `@import`) | Next.js optimizes loading (preload, no FOUT, no layout shift) |
| `proxy.ts` instead of `middleware.ts` | Next.js 16 deprecated the `middleware` file convention |
| All 6 tags start active | Show everything by default; users opt-out rather than opt-in |
| `AppShell` as the single state owner | Avoids context or global state for a small app; keeps data flow traceable |
