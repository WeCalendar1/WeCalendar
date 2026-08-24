# Graph Report - WeCalendar  (2026-08-24)

## Corpus Check
- 68 files · ~26,467 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 407 nodes · 652 edges · 27 communities (22 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b4167284`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- AppShell.tsx
- Sidebar.tsx
- TimeGrid.tsx
- 20260730120000_init_schema.sql
- 20260806140000_bootstrap_schema.sql
- scripts
- WeCalendar — Full Project Context
- devDependencies
- profile/page.tsx
- calendar.ts
- updateSession
- layout.tsx
- 20260806130000_fix_profile_signup_trigger.sql
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- WeCalendar
- WeCalendar — project context
- 6. Component Reference
- 20260818000000_tags.sql
- CreateEventModal.tsx
- public.events

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `WeCalendar — Full Project Context` - 16 edges
3. `6. Component Reference` - 13 edges
4. `Tag` - 11 edges
5. `AppShell()` - 10 edges
6. `TimeGrid()` - 10 edges
7. `isSameDay()` - 10 edges
8. `CalendarEvent` - 10 edges
9. `WeCalendar — project context` - 10 edges
10. `getMonthGrid()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `ProfilePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/profile/page.tsx → src/lib/supabase/client.ts
- `AppShell()` --calls--> `formatViewLabel()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `shiftViewDate()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `startOfDay()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `createClient()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/supabase/client.ts

## Import Cycles
- None detected.

## Communities (27 total, 5 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.06
Nodes (31): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+23 more)

### Community 1 - "AppShell.tsx"
Cohesion: 0.11
Nodes (22): AppShell(), Group, MODES, Navbar(), NavbarProps, SCREENS, RightPanel(), RightPanelProps (+14 more)

### Community 2 - "Sidebar.tsx"
Cohesion: 0.13
Nodes (15): GET(), Group, SharedWorkspace(), SharedWorkspaceProps, MiniCalendar(), MiniCalendarProps, WEEKDAYS, Group (+7 more)

### Community 3 - "TimeGrid.tsx"
Cohesion: 0.09
Nodes (33): Calendar(), CalendarProps, CalendarCell(), CalendarCellProps, CalendarGrid(), CalendarGridProps, WEEKDAYS, DayView() (+25 more)

### Community 4 - "20260730120000_init_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 5 - "20260806140000_bootstrap_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 6 - "scripts"
Cohesion: 0.09
Nodes (22): next, dependencies, next, react, react-dom, @supabase/ssr, @supabase/supabase-js, name (+14 more)

### Community 7 - "WeCalendar — Full Project Context"
Cohesion: 0.06
Nodes (32): 10. Shared Lists / Tasks, 11. Calendar Interactions, 12. CI Pipeline, 13. What's Done vs. Pending, 14. Development Commands, 15. Key Design Decisions, 1. What Is WeCalendar?, 2. Tech Stack (+24 more)

### Community 8 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+13 more)

### Community 9 - "profile/page.tsx"
Cohesion: 0.18
Nodes (5): ProfilePage(), formatAuthError(), LoginForm(), Mode, createClient()

### Community 10 - "calendar.ts"
Cohesion: 0.23
Nodes (20): MiniMonth(), WEEKDAYS, YearViewProps, addDays(), addMonths(), addYears(), DAY_HOURS, formatDayLabel() (+12 more)

### Community 11 - "updateSession"
Cohesion: 0.53
Nodes (4): copyCookies(), updateSession(), config, proxy()

### Community 12 - "layout.tsx"
Cohesion: 0.40
Nodes (3): metadata, nunitoSans, varelaRound

### Community 17 - "WeCalendar"
Cohesion: 0.07
Nodes (25): Apply the migration, Option A — Supabase Dashboard (simplest), Option B — Supabase CLI, Out of scope (later phases), RPCs (use these from the app), Security, Smoke test (after auth exists), Tables (+17 more)

### Community 20 - "WeCalendar — project context"
Cohesion: 0.13
Nodes (14): Branch note, How two accounts sync, Key paths, Not done yet / next ideas, Phase 1 — Scaffold + calendar UI, Phase 2 — Schema, Phase 3 — Auth, Shared sync (in progress / needs further testing) (+6 more)

### Community 21 - "6. Component Reference"
Cohesion: 0.14
Nodes (14): 6. Component Reference, `AppShell` — State Hub, `CalendarCell`, `CalendarGrid` (Month View), `CreateEventModal`, `LoginForm`, `Navbar`, Password field (+6 more)

### Community 22 - "20260818000000_tags.sql"
Cohesion: 0.25
Nodes (10): public.group_members, public.groups, public.profiles, public.event_tags, public.is_event_group_member(), public.is_tag_group_member(), public.tags, public.events (+2 more)

### Community 23 - "CreateEventModal.tsx"
Cohesion: 0.36
Nodes (6): CreateEventModal(), CreateEventModalProps, EventDraft, toDateInput(), toTimeInput(), TagCreatorInline()

## Knowledge Gaps
- **160 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `profile/page.tsx` to `AppShell.tsx`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `WeCalendar — Full Project Context` connect `WeCalendar — Full Project Context` to `6. Component Reference`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _160 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `AppShell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1051693404634581 - nodes in this community are weakly interconnected._
- **Should `Sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._