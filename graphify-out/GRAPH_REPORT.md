# Graph Report - WeCalendar  (2026-09-01)

## Corpus Check
- 89 files · ~44,581 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 654 nodes · 1153 edges · 43 communities (33 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8e8c242a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- events.ts
- CreateEventModal.tsx
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
- public.events
- public.notes
- calendar.ts
- public.events
- AppShell
- NotesApp.tsx
- NotesFolderSidebar.tsx
- NotesApp
- 20260831120000_notes_updated_at_content_only.sql
- public.note_folders
- NotesFolderDialog.tsx
- NoteToolbar.tsx
- NotesMoveToFolderDialog.tsx

## God Nodes (most connected - your core abstractions)
1. `AppShell()` - 39 edges
2. `compilerOptions` - 16 edges
3. `WeCalendar — Full Project Context` - 16 edges
4. `CalendarEvent` - 15 edges
5. `NotesApp()` - 14 edges
6. `CalendarCell()` - 13 edges
7. `CreateEventModal()` - 13 edges
8. `startOfDay()` - 13 edges
9. `Tag` - 13 edges
10. `6. Component Reference` - 13 edges

## Surprising Connections (you probably didn't know these)
- `handleCreateNoteFolder()` --calls--> `normalizeFolderColor()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/notes.ts
- `handleUpdateNoteFolder()` --calls--> `normalizeFolderColor()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/notes.ts
- `AppShell()` --calls--> `getInitials()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/auth.ts
- `AppShell()` --calls--> `formatViewLabel()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `shiftViewDate()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts

## Import Cycles
- None detected.

## Communities (43 total, 10 thin omitted)

### Community 0 - "events.ts"
Cohesion: 0.11
Nodes (32): barEdges(), barRadius(), CalendarCell(), CalendarCellProps, conflictBarShadow(), conflictOutline(), CalendarGrid(), CalendarGridProps (+24 more)

### Community 1 - "CreateEventModal.tsx"
Cohesion: 0.11
Nodes (19): CreateEventModal(), buildDraft(), handleSubmit(), CreateEventModalProps, DayPicker(), DayPickerProps, EventDraft, groupConsecutiveDates() (+11 more)

### Community 2 - "WeCalendar — Full Project Context"
Cohesion: 0.04
Nodes (46): 10. Shared Lists / Tasks, 11. Calendar Interactions, 12. CI Pipeline, 13. What's Done vs. Pending, 14. Development Commands, 15. Key Design Decisions, 1. What Is WeCalendar?, 2. Tech Stack (+38 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (31): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+23 more)

### Community 4 - "notes.ts"
Cohesion: 0.16
Nodes (24): Badge(), NotesListPanel(), NotesListPanelProps, filterLabel(), filterNoOpNotePatch(), folderBadgeStyle(), folderForNote(), folderNameForNote() (+16 more)

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

### Community 30 - "calendar.ts"
Cohesion: 0.09
Nodes (38): Calendar(), CalendarProps, DayView(), DayViewProps, dayAsCalendarDay(), HOUR_HEIGHT_PX, TimeGrid(), TimeGridProps (+30 more)

### Community 33 - "AppShell"
Cohesion: 0.08
Nodes (12): AppShell(), applyNotePatchLocally(), closeEventModal(), handleCreateMultipleEvents(), handleCreateNote(), handleCreateNoteFolder(), handleCreateNoteForEvent(), handleNoteDraftChange() (+4 more)

### Community 34 - "NotesApp.tsx"
Cohesion: 0.13
Nodes (14): NoteEditor(), NoteEditorProps, Group, NoteDraftContext, NotesAppProps, NotesDialog(), NotesDialogContent(), NotesDialogContentProps (+6 more)

### Community 35 - "NotesFolderSidebar.tsx"
Cohesion: 0.13
Nodes (12): NotesFolderDialog(), dropTargetStyle(), FolderDialogState, FolderRow(), Group, isFilterActive(), NotesFolderSidebar(), handleFolderDrop() (+4 more)

### Community 36 - "NotesApp"
Cohesion: 0.22
Nodes (6): NotesApp(), confirmMoveNote(), handleDropNoteOnFolder(), handleMoveNoteToFolder(), canMoveNoteToFolder(), filterNotes()

### Community 40 - "NotesFolderDialog.tsx"
Cohesion: 0.24
Nodes (8): FolderColorIcon(), NotesFolderDialogForm(), NotesFolderDialogFormProps, NotesFolderDialogProps, DEFAULT_FOLDER_COLOR, FOLDER_COLOR_PALETTE, FolderColor, normalizeFolderColor()

### Community 41 - "NoteToolbar.tsx"
Cohesion: 0.28
Nodes (6): normalizeHref(), NoteToolbar(), applyLink(), closeLinkDialog(), NoteToolbarProps, SavedSelection

### Community 42 - "NotesMoveToFolderDialog.tsx"
Cohesion: 0.33
Nodes (5): NotesMoveToFolderDialog(), NotesMoveToFolderDialogProps, foldersForNote(), Note, NoteFolder

## Knowledge Gaps
- **191 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppShell()` connect `AppShell` to `events.ts`, `CreateEventModal.tsx`, `AppShell.tsx`, `Navbar.tsx`, `calendar.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Navbar.tsx` to `AppShell`, `AppShell.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `NotesApp()` connect `NotesApp` to `NotesApp.tsx`, `notes.ts`, `AppShell.tsx`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `events.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11295681063122924 - nodes in this community are weakly interconnected._
- **Should `CreateEventModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._
- **Should `WeCalendar — Full Project Context` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._