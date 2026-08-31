# Graph Report - WeCalendar  (2026-08-30)

## Corpus Check
- 81 files · ~38,896 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 572 nodes · 953 edges · 31 communities (24 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e1f7ee1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- calendar.ts
- CreateEventModal.tsx
- WeCalendar — Full Project Context
- compilerOptions
- NotesApp.tsx
- WeCalendar
- AppShell.tsx
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
- AppShell
- public.events
- public.events

## God Nodes (most connected - your core abstractions)
1. `AppShell()` - 34 edges
2. `compilerOptions` - 16 edges
3. `WeCalendar — Full Project Context` - 16 edges
4. `CalendarCell()` - 13 edges
5. `CreateEventModal()` - 13 edges
6. `6. Component Reference` - 13 edges
7. `isSameDay()` - 12 edges
8. `CalendarEvent` - 12 edges
9. `TimeGrid()` - 11 edges
10. `startOfDay()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `AppShell()` --calls--> `getInitials()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/auth.ts
- `AppShell()` --calls--> `formatViewLabel()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `shiftViewDate()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `startOfDay()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `conflictFingerprint()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/scheduling.ts

## Import Cycles
- None detected.

## Communities (31 total, 7 thin omitted)

### Community 0 - "calendar.ts"
Cohesion: 0.07
Nodes (59): Calendar(), CalendarProps, barEdges(), barRadius(), CalendarCell(), CalendarCellProps, conflictBarShadow(), conflictOutline() (+51 more)

### Community 1 - "CreateEventModal.tsx"
Cohesion: 0.12
Nodes (18): CreateEventModal(), buildDraft(), handleSubmit(), CreateEventModalProps, DayPicker(), DayPickerProps, EventDraft, groupConsecutiveDates() (+10 more)

### Community 2 - "WeCalendar — Full Project Context"
Cohesion: 0.04
Nodes (46): 10. Shared Lists / Tasks, 11. Calendar Interactions, 12. CI Pipeline, 13. What's Done vs. Pending, 14. Development Commands, 15. Key Design Decisions, 1. What Is WeCalendar?, 2. Tech Stack (+38 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (31): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+23 more)

### Community 4 - "NotesApp.tsx"
Cohesion: 0.07
Nodes (34): NoteEditor(), NoteEditorProps, Group, NoteDraftContext, NotesApp(), NotesAppProps, NotesDialog(), NotesDialogProps (+26 more)

### Community 5 - "WeCalendar"
Cohesion: 0.07
Nodes (25): Apply the migration, Option A — Supabase Dashboard (simplest), Option B — Supabase CLI, Out of scope (later phases), RPCs (use these from the app), Security, Smoke test (after auth exists), Tables (+17 more)

### Community 6 - "AppShell.tsx"
Cohesion: 0.06
Nodes (32): GET(), Group, ConflictToast(), ConflictToastItem, ConflictToastProps, RightPanel(), RightPanelProps, Group (+24 more)

### Community 7 - "20260730120000_init_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 8 - "20260806140000_bootstrap_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 9 - "dependencies"
Cohesion: 0.07
Nodes (29): next, dependencies, next, react, react-dom, @supabase/ssr, @supabase/supabase-js, @tiptap/extension-blockquote (+21 more)

### Community 10 - "devDependencies"
Cohesion: 0.06
Nodes (32): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+24 more)

### Community 11 - "Navbar.tsx"
Cohesion: 0.06
Nodes (16): LeaveGroupRow(), ProfilePage(), formatAuthError(), LoginForm(), handleSubmit(), Mode, MODE_ORDER, MODES (+8 more)

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
Cohesion: 0.40
Nodes (3): metadata, nunitoSans, varelaRound

### Community 23 - "AppShell"
Cohesion: 0.10
Nodes (9): AppShell(), closeEventModal(), handleCreateMultipleEvents(), handleCreateNote(), handleCreateNoteForEvent(), handleNoteDraftChange(), handleUpdateNote(), handleUpdateSeries() (+1 more)

## Knowledge Gaps
- **183 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+178 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppShell()` connect `AppShell` to `calendar.ts`, `CreateEventModal.tsx`, `Navbar.tsx`, `AppShell.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Navbar.tsx` to `AppShell.tsx`, `AppShell`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `CreateEventModal()` connect `CreateEventModal.tsx` to `NotesApp.tsx`, `AppShell.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _183 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `calendar.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07059607059607059 - nodes in this community are weakly interconnected._
- **Should `CreateEventModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1164021164021164 - nodes in this community are weakly interconnected._
- **Should `WeCalendar — Full Project Context` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._