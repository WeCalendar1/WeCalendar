# Graph Report - WeCalendar  (2026-08-31)

## Corpus Check
- 88 files · ~43,081 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 639 nodes · 1121 edges · 40 communities (31 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1e7e5d5e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- events.ts
- calendar.ts
- WeCalendar — Full Project Context
- compilerOptions
- notes.ts
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
- NotesApp.tsx
- eventPicker.ts
- public.events
- NotesFolderSidebar.tsx
- NotesFolderDialog.tsx
- NoteEditor.tsx
- NotesApp
- 20260831120000_notes_updated_at_content_only.sql
- public.note_folders

## God Nodes (most connected - your core abstractions)
1. `AppShell()` - 35 edges
2. `compilerOptions` - 16 edges
3. `WeCalendar — Full Project Context` - 16 edges
4. `CalendarEvent` - 15 edges
5. `CalendarCell()` - 13 edges
6. `CreateEventModal()` - 13 edges
7. `NotesApp()` - 13 edges
8. `startOfDay()` - 13 edges
9. `6. Component Reference` - 13 edges
10. `isSameDay()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `AppShell()` --calls--> `getInitials()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/auth.ts
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

## Communities (40 total, 9 thin omitted)

### Community 0 - "events.ts"
Cohesion: 0.10
Nodes (32): barEdges(), barRadius(), CalendarCell(), CalendarCellProps, conflictBarShadow(), conflictOutline(), CalendarGrid(), CalendarGridProps (+24 more)

### Community 1 - "calendar.ts"
Cohesion: 0.10
Nodes (32): CreateEventModal(), buildDraft(), handleSubmit(), CreateEventModalProps, DayPicker(), DayPickerProps, EventDraft, groupConsecutiveDates() (+24 more)

### Community 2 - "WeCalendar — Full Project Context"
Cohesion: 0.04
Nodes (46): 10. Shared Lists / Tasks, 11. Calendar Interactions, 12. CI Pipeline, 13. What's Done vs. Pending, 14. Development Commands, 15. Key Design Decisions, 1. What Is WeCalendar?, 2. Tech Stack (+38 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (31): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+23 more)

### Community 4 - "notes.ts"
Cohesion: 0.20
Nodes (19): Badge(), NotesListPanel(), NotesListPanelProps, filterLabel(), folderBadgeStyle(), folderForNote(), folderNameForNote(), formatNoteDate() (+11 more)

### Community 5 - "WeCalendar"
Cohesion: 0.07
Nodes (25): Apply the migration, Option A — Supabase Dashboard (simplest), Option B — Supabase CLI, Out of scope (later phases), RPCs (use these from the app), Security, Smoke test (after auth exists), Tables (+17 more)

### Community 6 - "AppShell.tsx"
Cohesion: 0.05
Nodes (37): GET(), Group, Calendar(), CalendarProps, ConflictToast(), ConflictToastItem, ConflictToastProps, RightPanel() (+29 more)

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
Nodes (17): LeaveGroupRow(), ProfilePage(), formatAuthError(), LoginForm(), handleSubmit(), Mode, MODE_ORDER, MODES (+9 more)

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
Cohesion: 0.08
Nodes (17): AppShell(), applyNotePatchLocally(), closeEventModal(), handleCreateMultipleEvents(), handleCreateNote(), handleCreateNoteForEvent(), handleNoteDraftChange(), handleUpdateNote() (+9 more)

### Community 29 - "NotesApp.tsx"
Cohesion: 0.12
Nodes (16): NoteEditor(), Group, NoteDraftContext, NotesAppProps, NotesDialog(), NotesDialogContent(), NotesDialogContentProps, NotesDialogProps (+8 more)

### Community 30 - "eventPicker.ts"
Cohesion: 0.25
Nodes (14): NoteMetaBar(), NotesLinkEventDialogContent(), NotesLinkEventDialogProps, EventPickerFilters, EventPickerGroup, filterAndGroupEventsForPicker(), filterEventsForPicker(), formatEventPickerTimeRange() (+6 more)

### Community 33 - "NotesFolderSidebar.tsx"
Cohesion: 0.13
Nodes (9): FolderDialogState, Group, isFilterActive(), NotesFolderSidebar(), handleFolderDrop(), readDraggedNoteId(), NotesFolderSidebarProps, NOTE_DRAG_MIME (+1 more)

### Community 34 - "NotesFolderDialog.tsx"
Cohesion: 0.16
Nodes (11): handleCreateNoteFolder(), handleUpdateNoteFolder(), FolderColorIcon(), NotesFolderDialog(), NotesFolderDialogForm(), NotesFolderDialogFormProps, NotesFolderDialogProps, DEFAULT_FOLDER_COLOR (+3 more)

### Community 35 - "NoteEditor.tsx"
Cohesion: 0.21
Nodes (8): NoteEditorProps, normalizeHref(), NoteToolbar(), applyLink(), closeLinkDialog(), NoteToolbarProps, SavedSelection, EMPTY_TIPTAP_DOC

### Community 36 - "NotesApp"
Cohesion: 0.24
Nodes (6): NotesApp(), confirmMoveNote(), handleDropNoteOnFolder(), handleMoveNoteToFolder(), canMoveNoteToFolder(), filterNotes()

## Knowledge Gaps
- **191 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppShell()` connect `AppShell` to `calendar.ts`, `NotesFolderDialog.tsx`, `Navbar.tsx`, `AppShell.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Navbar.tsx` to `AppShell.tsx`, `AppShell`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `CalendarEvent` connect `eventPicker.ts` to `events.ts`, `calendar.ts`, `AppShell.tsx`, `AppShell`, `NotesApp.tsx`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `events.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10299003322259136 - nodes in this community are weakly interconnected._
- **Should `calendar.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10188261351052048 - nodes in this community are weakly interconnected._
- **Should `WeCalendar — Full Project Context` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._