# Graph Report - WeCalendar  (2026-08-30)

## Corpus Check
- 73 files · ~33,941 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 442 nodes · 743 edges · 31 communities (24 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `703c6e85`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- events.ts
- calendar.ts
- WeCalendar — Full Project Context
- compilerOptions
- Sidebar.tsx
- WeCalendar
- AppShell.tsx
- 20260730120000_init_schema.sql
- 20260806140000_bootstrap_schema.sql
- scripts
- devDependencies
- Navbar.tsx
- WeCalendar — project context
- 6. Component Reference
- 20260818000000_tags.sql
- updateSession
- layout.tsx
- 20260806130000_fix_profile_signup_trigger.sql
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- public.events
- scheduling.ts
- public.events
- public.events

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `WeCalendar — Full Project Context` - 16 edges
3. `CalendarCell()` - 13 edges
4. `6. Component Reference` - 13 edges
5. `AppShell()` - 12 edges
6. `isSameDay()` - 12 edges
7. `TimeGrid()` - 11 edges
8. `startOfDay()` - 11 edges
9. `getMonthGrid()` - 11 edges
10. `CalendarEvent` - 11 edges

## Surprising Connections (you probably didn't know these)
- `ProfilePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/profile/page.tsx → src/lib/supabase/client.ts
- `AppShell()` --calls--> `getInitials()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/auth.ts
- `AppShell()` --calls--> `formatViewLabel()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `shiftViewDate()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `startOfDay()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts

## Import Cycles
- None detected.

## Communities (31 total, 7 thin omitted)

### Community 0 - "events.ts"
Cohesion: 0.08
Nodes (44): Calendar(), CalendarProps, barEdges(), barRadius(), CalendarCell(), CalendarCellProps, conflictBarShadow(), conflictOutline() (+36 more)

### Community 1 - "calendar.ts"
Cohesion: 0.14
Nodes (29): CreateEventModal(), CreateEventModalProps, DayPicker(), DayPickerProps, EventDraft, groupConsecutiveDates(), PICKER_DAYS, toDateInput() (+21 more)

### Community 2 - "WeCalendar — Full Project Context"
Cohesion: 0.06
Nodes (32): 10. Shared Lists / Tasks, 11. Calendar Interactions, 12. CI Pipeline, 13. What's Done vs. Pending, 14. Development Commands, 15. Key Design Decisions, 1. What Is WeCalendar?, 2. Tech Stack (+24 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (31): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+23 more)

### Community 4 - "Sidebar.tsx"
Cohesion: 0.16
Nodes (11): Group, SharedWorkspace(), SharedWorkspaceProps, MiniCalendar(), MiniCalendarProps, WEEKDAYS, Group, Sidebar() (+3 more)

### Community 5 - "WeCalendar"
Cohesion: 0.07
Nodes (25): Apply the migration, Option A — Supabase Dashboard (simplest), Option B — Supabase CLI, Out of scope (later phases), RPCs (use these from the app), Security, Smoke test (after auth exists), Tables (+17 more)

### Community 6 - "AppShell.tsx"
Cohesion: 0.10
Nodes (23): GET(), Group, ConflictToast(), ConflictToastItem, ConflictToastProps, RightPanel(), RightPanelProps, CATEGORIES (+15 more)

### Community 7 - "20260730120000_init_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 8 - "20260806140000_bootstrap_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 9 - "scripts"
Cohesion: 0.09
Nodes (22): next, dependencies, next, react, react-dom, @supabase/ssr, @supabase/supabase-js, name (+14 more)

### Community 10 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+13 more)

### Community 11 - "Navbar.tsx"
Cohesion: 0.10
Nodes (12): ProfilePage(), formatAuthError(), LoginForm(), Mode, MODE_ORDER, MODES, Navbar(), NavbarProps (+4 more)

### Community 12 - "WeCalendar — project context"
Cohesion: 0.13
Nodes (14): Branch note, How two accounts sync, Key paths, Not done yet / next ideas, Phase 1 — Scaffold + calendar UI, Phase 2 — Schema, Phase 3 — Auth, Shared sync (in progress / needs further testing) (+6 more)

### Community 13 - "6. Component Reference"
Cohesion: 0.14
Nodes (14): 6. Component Reference, `AppShell` — State Hub, `CalendarCell`, `CalendarGrid` (Month View), `CreateEventModal`, `LoginForm`, `Navbar`, Password field (+6 more)

### Community 14 - "20260818000000_tags.sql"
Cohesion: 0.25
Nodes (10): public.group_members, public.groups, public.profiles, public.event_tags, public.is_event_group_member(), public.is_tag_group_member(), public.tags, public.events (+2 more)

### Community 15 - "updateSession"
Cohesion: 0.53
Nodes (4): copyCookies(), updateSession(), config, proxy()

### Community 16 - "layout.tsx"
Cohesion: 0.40
Nodes (3): metadata, nunitoSans, varelaRound

### Community 23 - "scheduling.ts"
Cohesion: 0.25
Nodes (8): AppShell(), conflictFingerprint(), ConflictGroup, conflictingEventGroups(), conflictingEventIds(), draftOverlapsExisting(), rangesOverlap(), SCHEDULING_CONFLICT_MESSAGE

## Knowledge Gaps
- **168 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+163 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Navbar.tsx` to `AppShell.tsx`, `scheduling.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `WeCalendar — Full Project Context` connect `WeCalendar — Full Project Context` to `6. Component Reference`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `Tag` connect `events.ts` to `calendar.ts`, `Sidebar.tsx`, `AppShell.tsx`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _168 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `events.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08408249603384453 - nodes in this community are weakly interconnected._
- **Should `calendar.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14260249554367202 - nodes in this community are weakly interconnected._
- **Should `WeCalendar — Full Project Context` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._