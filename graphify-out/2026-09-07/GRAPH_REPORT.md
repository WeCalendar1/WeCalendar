# Graph Report - WeCalendar  (2026-09-04)

## Corpus Check
- 90 files · ~47,542 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 701 nodes · 1222 edges · 48 communities (37 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cd688010`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- events.ts
- AppShell.tsx
- WeCalendar — Full Project Context
- compilerOptions
- notes.ts
- WeCalendar
- Sidebar.tsx
- 20260730120000_init_schema.sql
- 20260806140000_bootstrap_schema.sql
- dependencies
- devDependencies
- createClient
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
- CreateEventModal.tsx
- 20260831120000_notes_updated_at_content_only.sql
- public.note_folders
- NotesApp
- NoteToolbar.tsx
- database.ts
- Navbar.tsx
- NotesFolderDialog.tsx
- scheduling.ts
- getMonthGrid
- NotesDialogContent

## God Nodes (most connected - your core abstractions)
1. `AppShell()` - 39 edges
2. `NotesApp()` - 23 edges
3. `compilerOptions` - 16 edges
4. `WeCalendar — Full Project Context` - 16 edges
5. `CalendarEvent` - 15 edges
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

## Communities (48 total, 11 thin omitted)

### Community 0 - "events.ts"
Cohesion: 0.07
Nodes (56): CalendarProps, barEdges(), barRadius(), CalendarCell(), CalendarCellProps, conflictBarShadow(), conflictOutline(), CalendarGrid() (+48 more)

### Community 1 - "AppShell.tsx"
Cohesion: 0.19
Nodes (8): Group, Calendar(), ConflictToast(), ConflictToastItem, ConflictToastProps, RightPanel(), RightPanelProps, getInitials()

### Community 2 - "WeCalendar — Full Project Context"
Cohesion: 0.04
Nodes (46): 10. Shared Lists / Tasks, 11. Calendar Interactions, 12. CI Pipeline, 13. What's Done vs. Pending, 14. Development Commands, 15. Key Design Decisions, 1. What Is WeCalendar?, 2. Tech Stack (+38 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (31): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+23 more)

### Community 4 - "notes.ts"
Cohesion: 0.15
Nodes (28): Badge(), NotesListPanel(), NotesListPanelProps, BulkMoveFolderResult, filterLabel(), filterNoOpNotePatch(), FOLDER_COLOR_PALETTE, folderBadgeStyle() (+20 more)

### Community 5 - "WeCalendar"
Cohesion: 0.07
Nodes (25): Apply the migration, Option A — Supabase Dashboard (simplest), Option B — Supabase CLI, Out of scope (later phases), RPCs (use these from the app), Security, Smoke test (after auth exists), Tables (+17 more)

### Community 6 - "Sidebar.tsx"
Cohesion: 0.11
Nodes (12): Group, SharedWorkspace(), SharedWorkspaceProps, MiniCalendar(), MiniCalendarProps, WEEKDAYS, Group, Sidebar() (+4 more)

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

### Community 11 - "createClient"
Cohesion: 0.08
Nodes (12): GET(), LeaveGroupRow(), ProfilePage(), formatAuthError(), LoginForm(), handleSubmit(), Mode, ProfileMenu() (+4 more)

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
Cohesion: 0.30
Nodes (14): addDays(), addMonths(), addYears(), DAY_HOURS, formatDayLabel(), formatHourLabel(), formatViewLabel(), formatWeekLabel() (+6 more)

### Community 33 - "AppShell"
Cohesion: 0.08
Nodes (12): AppShell(), applyNotePatchLocally(), closeEventModal(), handleCreateMultipleEvents(), handleCreateNote(), handleCreateNoteFolder(), handleCreateNoteForEvent(), handleNoteDraftChange() (+4 more)

### Community 34 - "NotesApp.tsx"
Cohesion: 0.13
Nodes (16): Group, NoteDraftContext, NotesAppProps, NotesDialog(), NotesDialogContentProps, NotesDialogProps, NotesLinkEventDialog(), NotesMoveToFolderDialog() (+8 more)

### Community 35 - "NotesFolderSidebar.tsx"
Cohesion: 0.13
Nodes (15): dropTargetStyle(), FolderDialogState, FolderRow(), Group, isFilterActive(), NotesFolderSidebar(), acceptsNoteDrag(), handleFolderDragOver() (+7 more)

### Community 36 - "CreateEventModal.tsx"
Cohesion: 0.15
Nodes (12): CreateEventModal(), buildDraft(), handleSubmit(), CreateEventModalProps, DayPicker(), DayPickerProps, EventDraft, groupConsecutiveDates() (+4 more)

### Community 40 - "NotesApp"
Cohesion: 0.16
Nodes (8): NotesApp(), confirmBulkDelete(), confirmMoveNote(), exitSelectionMode(), finishDrag(), handleDropNoteOnFolder(), handleDropNoteOnTrash(), handleMoveNoteToFolder()

### Community 41 - "NoteToolbar.tsx"
Cohesion: 0.11
Nodes (12): BULLET_PRESETS, BulletPicker(), COLORS, FONT_OPTIONS, HIGHLIGHT_COLORS, LINE_SPACING_OPTIONS, normalizeHref(), NoteToolbar() (+4 more)

### Community 42 - "database.ts"
Cohesion: 0.16
Nodes (12): NoteEditor(), NoteEditorProps, Commands, CustomBullet, LineHeight, @tiptap/core, EMPTY_TIPTAP_DOC, serializeNoteContent() (+4 more)

### Community 43 - "Navbar.tsx"
Cohesion: 0.17
Nodes (8): MODE_ORDER, MODES, Navbar(), NavbarProps, SCREENS, ViewModePicker(), CalendarMode, ScreenView

### Community 44 - "NotesFolderDialog.tsx"
Cohesion: 0.22
Nodes (8): FolderColorIcon(), NotesFolderDialog(), NotesFolderDialogForm(), NotesFolderDialogFormProps, NotesFolderDialogProps, DEFAULT_FOLDER_COLOR, FolderColor, normalizeFolderColor()

### Community 45 - "scheduling.ts"
Cohesion: 0.38
Nodes (7): conflictFingerprint(), ConflictGroup, conflictingEventGroups(), conflictingEventIds(), draftOverlapsExisting(), rangesOverlap(), SCHEDULING_CONFLICT_MESSAGE

### Community 46 - "getMonthGrid"
Cohesion: 0.39
Nodes (6): MiniMonth(), WEEKDAYS, YearView(), YearViewProps, getMonthGrid(), startOfMonth()

## Knowledge Gaps
- **208 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+203 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppShell()` connect `AppShell` to `events.ts`, `AppShell.tsx`, `createClient`, `scheduling.ts`, `calendar.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `AppShell.tsx`, `Navbar.tsx`, `AppShell`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `NotesApp()` connect `NotesApp` to `AppShell.tsx`, `NotesApp.tsx`, `notes.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _208 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `events.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07298245614035087 - nodes in this community are weakly interconnected._
- **Should `WeCalendar — Full Project Context` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._