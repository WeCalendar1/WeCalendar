# Graph Report - WeCalendar (2026-08-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- ~340 nodes · ~560 edges · 23 communities (18 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Last updated: 2026-08-19 (manual refresh after tags, TaskPanel, and lists features)
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- AppShell.tsx
- Sidebar.tsx
- TimeGrid.tsx
- 20260806140000_bootstrap_schema.sql
- 20260818000000_tags.sql
- package.json
- Calendar.tsx
- devDependencies
- profile/page.tsx
- calendar.ts
- tags.ts
- TaskPanel.tsx
- updateSession
- layout.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `AppShell()` - 18 edges  ← grown: now manages events, tags, event_tags, lists, list_items
3. `isSameDay()` - 9 edges
4. `TimeGrid()` - 11 edges  ← grown: now receives tags + eventTags props
5. `CalendarEvent` - 8 edges
6. `Tag` - 8 edges           ← new god node: imported by AppShell, Sidebar, Calendar, CalendarCell, TimeGrid, CreateEventModal, TagCreatorInline, tags.ts
7. `getMonthGrid()` - 8 edges
8. `formatViewLabel()` - 7 edges
9. `getWeekDays()` - 7 edges
10. `createClient()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `AppShell()` --calls--> `formatViewLabel()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `shiftViewDate()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `startOfDay()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `createClient()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/supabase/client.ts
- `AppShell()` --calls--> `tagIdsForEvent()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/tags.ts
- `TagCreatorInline()` --imports--> `TAG_PALETTE`  [EXTRACTED]
  src/components/TagCreatorInline/TagCreatorInline.tsx → src/lib/tags.ts
- `CalendarCell()` --calls--> `colorForEvent()`  [EXTRACTED]
  src/components/CalendarCell/CalendarCell.tsx → src/lib/tags.ts
- `TimeGrid()` --calls--> `colorForEvent()`  [EXTRACTED]
  src/components/TimeGrid/TimeGrid.tsx → src/lib/tags.ts
- `WeekView()` --calls--> `getWeekDays()`  [EXTRACTED]
  src/components/WeekView/WeekView.tsx → src/lib/calendar.ts
- `TaskPanel()` --uses--> `Tables<"lists">` + `Tables<"list_items">`  [EXTRACTED]
  src/components/TaskPanel/TaskPanel.tsx → src/types/database.ts

## Import Cycles
- None detected.

## Communities (23 total, 5 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 1 - "AppShell.tsx"
Cohesion: 0.10
Nodes (22): AppShell(), Group, CreateEventModal(), CreateEventModalProps, EventDraft, toDateInput(), MODES, Navbar(), SharedList, ListItem, ListCategory, handleCreateList(), handleAddListItem(), handleToggleListItem(), handleDeleteListItem(), loadLists(), loadTags(), loadEventTags() (+4 more)

### Community 2 - "Sidebar.tsx"
Cohesion: 0.11
Nodes (16): GET(), Group, SharedWorkspace(), SharedWorkspaceProps, MiniCalendar(), MiniCalendarProps, WEEKDAYS, TagCreatorInline(), Tag, SidebarProps (+6 more)

### Community 3 - "TimeGrid.tsx"
Cohesion: 0.18
Nodes (19): CalendarCell(), CalendarCellProps, DayView(), DayViewProps, dayAsCalendarDay(), HOUR_HEIGHT_PX, TimeGrid(), TimeGridProps, colorForEvent(), Tag, EventTag (+8 more)

### Community 4 - "20260806140000_bootstrap_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 5 - "20260818000000_tags.sql"
Cohesion: 0.14
Nodes (12): public.tags, public.event_tags, tags_group_id_idx, event_tags_event_id_idx, is_event_group_member(), is_tag_group_member(), tags_set_updated_at (+5 more)

### Community 6 - "package.json"
Cohesion: 0.10
Nodes (21): next, dependencies, react, react-dom, @supabase/ssr, @supabase/supabase-js, vitest, @vitest/coverage-v8, name (+12 more)

### Community 7 - "Calendar.tsx"
Cohesion: 0.16
Nodes (13): Calendar(), CalendarProps, CalendarGrid(), CalendarGridProps, WEEKDAYS, WeekView(), MiniMonth(), WEEKDAYS (+5 more)

### Community 8 - "devDependencies"
Cohesion: 0.12
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, vitest, @vitest/coverage-v8 (+9 more)

### Community 9 - "profile/page.tsx"
Cohesion: 0.20
Nodes (5): ProfilePage(), formatAuthError(), LoginForm(), Mode, createClient()

### Community 10 - "calendar.ts"
Cohesion: 0.26
Nodes (14): addDays(), addMonths(), addYears(), DAY_HOURS, formatDayLabel(), formatMonthYear(), formatViewLabel(), formatWeekLabel() (+6 more)

### Community 11 - "tags.ts"
Cohesion: 0.30
Nodes (8): Tag, EventTag, TAG_PALETTE, colorForEvent(), tagIdsForEvent(), tags.test.ts, calendar.test.ts, events.test.ts

### Community 12 - "TaskPanel.tsx"
Cohesion: 0.22
Nodes (10): TaskPanel(), ListCard(), SharedList, ListItem, ListCategory, CATEGORIES, categoryLabel(), RightPanel(), TaskPanelProps, RightPanelProps

### Community 13 - "updateSession"
Cohesion: 0.53
Nodes (4): copyCookies(), updateSession(), config, proxy()

### Community 14 - "layout.tsx"
Cohesion: 0.40
Nodes (3): metadata, nunitoSans, varelaRound

## Knowledge Gaps
- **~85 isolated node(s):** `Group`, `CreateEventModalProps`, `NavbarProps`, `RightPanelProps`, `EventDraft`, `TagCreatorInlineProps` (+79 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `profile/page.tsx` to `AppShell.tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Tag` connect `tags.ts` to `Sidebar.tsx`, `TimeGrid.tsx`, `CalendarCell.tsx`, `CreateEventModal.tsx`?**
  _New god node with high betweenness — central to the new tagging system._
- **Why does `Tables` connect `Sidebar.tsx` to `AppShell.tsx`, `TimeGrid.tsx`, `TaskPanel.tsx`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `AppShell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10 — now 597 lines; owns events, tags, lists, and auth state together._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **What connects `Group`, `CreateEventModalProps`, `NavbarProps` to the rest of the system?**
  _~85 weakly-connected nodes found - possible documentation gaps or missing edges._