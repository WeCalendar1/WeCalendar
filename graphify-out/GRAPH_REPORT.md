# Graph Report - .  (2026-08-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 267 nodes · 433 edges · 20 communities (15 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f9fefe13`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- AppShell.tsx
- Sidebar.tsx
- TimeGrid.tsx
- 20260730120000_init_schema.sql
- 20260806140000_bootstrap_schema.sql
- package.json
- Calendar.tsx
- devDependencies
- profile/page.tsx
- calendar.ts
- updateSession
- layout.tsx
- 20260806130000_fix_profile_signup_trigger.sql
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- public.events

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `AppShell()` - 9 edges
3. `isSameDay()` - 9 edges
4. `TimeGrid()` - 9 edges
5. `CalendarEvent` - 8 edges
6. `getMonthGrid()` - 8 edges
7. `formatViewLabel()` - 7 edges
8. `getWeekDays()` - 7 edges
9. `createClient()` - 7 edges
10. `include` - 7 edges

## Surprising Connections (you probably didn't know these)
- `AppShell()` --calls--> `formatViewLabel()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `shiftViewDate()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `startOfDay()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `createClient()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/supabase/client.ts
- `WeekView()` --calls--> `getWeekDays()`  [EXTRACTED]
  src/components/WeekView/WeekView.tsx → src/lib/calendar.ts

## Import Cycles
- None detected.

## Communities (20 total, 5 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 1 - "AppShell.tsx"
Cohesion: 0.11
Nodes (16): ALL_TAG_IDS, AppShell(), Group, CreateEventModal(), CreateEventModalProps, toDateInput(), MODES, Navbar() (+8 more)

### Community 2 - "Sidebar.tsx"
Cohesion: 0.11
Nodes (18): GET(), Group, SharedWorkspace(), SharedWorkspaceProps, MiniCalendar(), MiniCalendarProps, WEEKDAYS, DEFAULT_TAGS (+10 more)

### Community 3 - "TimeGrid.tsx"
Cohesion: 0.18
Nodes (17): CalendarCell(), CalendarCellProps, DayView(), DayViewProps, dayAsCalendarDay(), HOUR_HEIGHT_PX, TimeGrid(), TimeGridProps (+9 more)

### Community 4 - "20260730120000_init_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 5 - "20260806140000_bootstrap_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 6 - "package.json"
Cohesion: 0.10
Nodes (19): next, dependencies, next, react, react-dom, @supabase/ssr, @supabase/supabase-js, name (+11 more)

### Community 7 - "Calendar.tsx"
Cohesion: 0.16
Nodes (13): Calendar(), CalendarProps, CalendarGrid(), CalendarGridProps, WEEKDAYS, WeekView(), MiniMonth(), WEEKDAYS (+5 more)

### Community 8 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 9 - "profile/page.tsx"
Cohesion: 0.20
Nodes (5): ProfilePage(), formatAuthError(), LoginForm(), Mode, createClient()

### Community 10 - "calendar.ts"
Cohesion: 0.26
Nodes (14): addDays(), addMonths(), addYears(), DAY_HOURS, formatDayLabel(), formatMonthYear(), formatViewLabel(), formatWeekLabel() (+6 more)

### Community 11 - "updateSession"
Cohesion: 0.53
Nodes (4): copyCookies(), updateSession(), config, proxy()

### Community 12 - "layout.tsx"
Cohesion: 0.40
Nodes (3): metadata, nunitoSans, varelaRound

## Knowledge Gaps
- **79 isolated node(s):** `Group`, `CreateEventModalProps`, `NavbarProps`, `RightPanelProps`, `Group` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `profile/page.tsx` to `AppShell.tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Tables` connect `Sidebar.tsx` to `AppShell.tsx`, `TimeGrid.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `Group`, `CreateEventModalProps`, `NavbarProps` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `AppShell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11384615384615385 - nodes in this community are weakly interconnected._