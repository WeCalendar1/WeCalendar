# Graph Report - .  (2026-08-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 212 nodes · 350 edges · 15 communities (12 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f9fefe13`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AppShell.tsx
- Sidebar.tsx
- TimeGrid.tsx
- package.json
- compilerOptions
- Calendar.tsx
- calendar.ts
- devDependencies
- profile/page.tsx
- include
- updateSession
- layout.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `AppShell()` - 9 edges
3. `TimeGrid()` - 9 edges
4. `isSameDay()` - 9 edges
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
- `dayAsCalendarDay()` --calls--> `isSameDay()`  [EXTRACTED]
  src/components/TimeGrid/TimeGrid.tsx → src/lib/calendar.ts

## Import Cycles
- None detected.

## Communities (15 total, 3 thin omitted)

### Community 0 - "AppShell.tsx"
Cohesion: 0.11
Nodes (17): ALL_TAG_IDS, AppShell(), Group, CreateEventModal(), CreateEventModalProps, toDateInput(), MODES, Navbar() (+9 more)

### Community 1 - "Sidebar.tsx"
Cohesion: 0.11
Nodes (18): GET(), Group, SharedWorkspace(), SharedWorkspaceProps, MiniCalendar(), MiniCalendarProps, WEEKDAYS, DEFAULT_TAGS (+10 more)

### Community 2 - "TimeGrid.tsx"
Cohesion: 0.19
Nodes (16): CalendarCell(), CalendarCellProps, DayView(), DayViewProps, dayAsCalendarDay(), HOUR_HEIGHT_PX, TimeGrid(), TimeGridProps (+8 more)

### Community 3 - "package.json"
Cohesion: 0.10
Nodes (19): next, dependencies, next, react, react-dom, @supabase/ssr, @supabase/supabase-js, name (+11 more)

### Community 4 - "compilerOptions"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 5 - "Calendar.tsx"
Cohesion: 0.19
Nodes (12): Calendar(), CalendarProps, CalendarGrid(), CalendarGridProps, WEEKDAYS, MiniMonth(), WEEKDAYS, YearView() (+4 more)

### Community 6 - "calendar.ts"
Cohesion: 0.22
Nodes (15): WeekView(), WeekViewProps, addDays(), addMonths(), addYears(), formatDayLabel(), formatMonthYear(), formatViewLabel() (+7 more)

### Community 7 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 8 - "profile/page.tsx"
Cohesion: 0.20
Nodes (5): ProfilePage(), formatAuthError(), LoginForm(), Mode, createClient()

### Community 9 - "include"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 10 - "updateSession"
Cohesion: 0.53
Nodes (4): copyCookies(), updateSession(), config, proxy()

### Community 11 - "layout.tsx"
Cohesion: 0.40
Nodes (3): metadata, nunitoSans, varelaRound

## Knowledge Gaps
- **79 isolated node(s):** `Group`, `CreateEventModalProps`, `NavbarProps`, `RightPanelProps`, `Group` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `profile/page.tsx` to `AppShell.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `Tables` connect `Sidebar.tsx` to `AppShell.tsx`, `TimeGrid.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `Group`, `CreateEventModalProps`, `NavbarProps` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppShell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10837438423645321 - nodes in this community are weakly interconnected._
- **Should `Sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11384615384615385 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._