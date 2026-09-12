# Graph Report - WeCalendar  (2026-09-04)

## Corpus Check
- 90 files · ~46,270 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 604 nodes · 1089 edges · 37 communities (27 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c917738e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- events.ts
- AppShell.tsx
- WeCalendar — Full Project Context
- compilerOptions
- notes.ts
- WeCalendar
- database.ts
- 20260730120000_init_schema.sql
- 20260806140000_bootstrap_schema.sql
- dependencies
- devDependencies
- Navbar.tsx
- WeCalendar — project context
- 20260830120000_notes.sql
- 20260818000000_tags.sql
- updateSession
- layout.tsx
- 20260806130000_fix_profile_signup_trigger.sql
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- public.events
- public.events
- public.notes
- calendar.ts
- public.events
- 20260831120000_notes_updated_at_content_only.sql
- public.note_folders
- NoteToolbar.tsx

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `WeCalendar — Full Project Context` - 16 edges
3. `CalendarEvent` - 15 edges
4. `AppShell()` - 14 edges
5. `CalendarCell()` - 13 edges
6. `startOfDay()` - 13 edges
7. `Tag` - 13 edges
8. `6. Component Reference` - 13 edges
9. `isSameDay()` - 12 edges
10. `TimeGrid()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `NoteMetaBar()` --calls--> `formatLinkedEventLabel()`  [EXTRACTED]
  src/components/Notes/NotesApp.tsx → src/lib/eventPicker.ts
- `ProfilePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/profile/page.tsx → src/lib/supabase/client.ts
- `AppShell()` --calls--> `formatViewLabel()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `shiftViewDate()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `startOfDay()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts

## Import Cycles
- None detected.

## Communities (37 total, 10 thin omitted)

### Community 0 - "events.ts"
Cohesion: 0.09
Nodes (44): barEdges(), barRadius(), CalendarCell(), CalendarCellProps, conflictBarShadow(), conflictOutline(), CalendarGrid(), CalendarGridProps (+36 more)

### Community 1 - "AppShell.tsx"
Cohesion: 0.09
Nodes (25): AppShell(), Group, Calendar(), ConflictToast(), ConflictToastItem, ConflictToastProps, RightPanel(), RightPanelProps (+17 more)

### Community 2 - "WeCalendar — Full Project Context"
Cohesion: 0.04
Nodes (46): 10. Shared Lists / Tasks, 11. Calendar Interactions, 12. CI Pipeline, 13. What's Done vs. Pending, 14. Development Commands, 15. Key Design Decisions, 1. What Is WeCalendar?, 2. Tech Stack (+38 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (31): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+23 more)

### Community 4 - "notes.ts"
Cohesion: 0.06
Nodes (66): NoteEditor(), NoteEditorProps, Commands, CustomBullet, LineHeight, @tiptap/core, Group, NoteDraftContext (+58 more)

### Community 5 - "WeCalendar"
Cohesion: 0.07
Nodes (25): Apply the migration, Option A — Supabase Dashboard (simplest), Option B — Supabase CLI, Out of scope (later phases), RPCs (use these from the app), Security, Smoke test (after auth exists), Tables (+17 more)

### Community 6 - "database.ts"
Cohesion: 0.11
Nodes (17): GET(), Group, SharedWorkspace(), SharedWorkspaceProps, MiniCalendar(), MiniCalendarProps, WEEKDAYS, Group (+9 more)

### Community 7 - "20260730120000_init_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 8 - "20260806140000_bootstrap_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 9 - "dependencies"
Cohesion: 0.05
Nodes (41): next, dependencies, next, react, react-dom, @supabase/ssr, @supabase/supabase-js, @tiptap/core (+33 more)

### Community 10 - "devDependencies"
Cohesion: 0.06
Nodes (32): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+24 more)

### Community 11 - "Navbar.tsx"
Cohesion: 0.10
Nodes (13): ProfilePage(), formatAuthError(), LoginForm(), Mode, MODE_ORDER, MODES, Navbar(), NavbarProps (+5 more)

### Community 12 - "WeCalendar — project context"
Cohesion: 0.13
Nodes (14): Branch note, How two accounts sync, Key paths, Not done yet / next ideas, Phase 1 — Scaffold + calendar UI, Phase 2 — Schema, Phase 3 — Auth, Shared sync (in progress / needs further testing) (+6 more)

### Community 13 - "20260830120000_notes.sql"
Cohesion: 0.21
Nodes (14): public.validate_note_event_group, note_folders_set_updated_at, notes_set_updated_at, notes_validate_event_group, public.can_edit_note(), public.can_view_note(), public.can_view_note_folder(), public.note_folders (+6 more)

### Community 14 - "20260818000000_tags.sql"
Cohesion: 0.25
Nodes (10): public.group_members, public.event_tags, public.is_event_group_member(), public.is_tag_group_member(), public.tags, public.events, public.groups, public.profiles (+2 more)

### Community 15 - "updateSession"
Cohesion: 0.53
Nodes (4): copyCookies(), updateSession(), config, proxy()

### Community 16 - "layout.tsx"
Cohesion: 0.25
Nodes (6): jetbrainsMono, merriweather, metadata, nunitoSans, playfairDisplay, varelaRound

### Community 30 - "calendar.ts"
Cohesion: 0.11
Nodes (31): CalendarProps, CreateEventModal(), CreateEventModalProps, DayPicker(), DayPickerProps, EventDraft, groupConsecutiveDates(), PICKER_DAYS (+23 more)

### Community 41 - "NoteToolbar.tsx"
Cohesion: 0.13
Nodes (9): BULLET_PRESETS, COLORS, FONT_OPTIONS, HIGHLIGHT_COLORS, LINE_SPACING_OPTIONS, normalizeHref(), NoteToolbar(), NoteToolbarProps (+1 more)

## Knowledge Gaps
- **207 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Navbar.tsx` to `AppShell.tsx`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `CalendarEvent` connect `events.ts` to `AppShell.tsx`, `notes.ts`, `calendar.ts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `events.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08766803039158387 - nodes in this community are weakly interconnected._
- **Should `AppShell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._
- **Should `WeCalendar — Full Project Context` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._