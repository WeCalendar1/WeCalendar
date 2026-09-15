# Graph Report - WeCalendar  (2026-09-07)

## Corpus Check
- 111 files · ~82,955 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1006 nodes · 1522 edges · 68 communities (57 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `003ca625`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AppShell.tsx
- ConflictToast.tsx
- WeCalendar — Full Project Context
- compilerOptions
- notes.ts
- WeCalendar
- Sidebar.tsx
- 20260730120000_init_schema.sql
- 20260806140000_bootstrap_schema.sql
- dependencies
- devDependencies
- database.ts
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
- Expo Animation Recipes
- public.events
- AppShell
- NotesApp.tsx
- NotesFolderSidebar.tsx
- CreateEventModal.tsx
- 20260831120000_notes_updated_at_content_only.sql
- public.note_folders
- NotesApp
- NoteToolbar.tsx
- NoteEditor.tsx
- Animation Recipes
- NotesFolderDialog.tsx
- Animation Standards Reference
- Animation Audit Playbook
- NotesDialogContent
- Write Swift
- Apple Design
- Workflow
- Glossary
- Finding Animation Opportunities
- eventPicker.ts
- Working With Sonner
- notes.test.ts
- The list
- Design Engineering
- Component Building Principles
- The Animation Decision Framework
- clip-path for Animation
- Performance Rules
- Gesture and Drag Interactions
- CSS Transform Mastery
- The Sonner Principles (Building Loved Components)
- Spring Animations
- Core Philosophy
- Debugging Animations

## God Nodes (most connected - your core abstractions)
1. `AppShell()` - 40 edges
2. `NotesApp()` - 23 edges
3. `Apple Design` - 20 edges
4. `Write Swift` - 18 edges
5. `compilerOptions` - 16 edges
6. `Design Engineering` - 16 edges
7. `Animation Standards Reference` - 16 edges
8. `WeCalendar — Full Project Context` - 16 edges
9. `CalendarEvent` - 15 edges
10. `Animation Recipes` - 15 edges

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

## Communities (68 total, 11 thin omitted)

### Community 0 - "AppShell.tsx"
Cohesion: 0.06
Nodes (72): Group, Calendar(), CalendarProps, barEdges(), barRadius(), CalendarCell(), CalendarCellProps, conflictBarShadow() (+64 more)

### Community 1 - "ConflictToast.tsx"
Cohesion: 0.50
Nodes (3): ConflictToast(), ConflictToastItem, ConflictToastProps

### Community 2 - "WeCalendar — Full Project Context"
Cohesion: 0.04
Nodes (46): 10. Shared Lists / Tasks, 11. Calendar Interactions, 12. CI Pipeline, 13. What's Done vs. Pending, 14. Development Commands, 15. Key Design Decisions, 1. What Is WeCalendar?, 2. Tech Stack (+38 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (31): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+23 more)

### Community 4 - "notes.ts"
Cohesion: 0.17
Nodes (23): Badge(), NotesListPanel(), NotesListPanelProps, BulkMoveFolderResult, DEFAULT_NOTES_SORT, filterLabel(), folderBadgeStyle(), folderForNote() (+15 more)

### Community 5 - "WeCalendar"
Cohesion: 0.07
Nodes (25): Apply the migration, Option A — Supabase Dashboard (simplest), Option B — Supabase CLI, Out of scope (later phases), RPCs (use these from the app), Security, Smoke test (after auth exists), Tables (+17 more)

### Community 6 - "Sidebar.tsx"
Cohesion: 0.12
Nodes (11): Group, SharedWorkspace(), SharedWorkspaceProps, MiniCalendar(), MiniCalendarProps, WEEKDAYS, Group, Sidebar() (+3 more)

### Community 7 - "20260730120000_init_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 8 - "20260806140000_bootstrap_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 9 - "dependencies"
Cohesion: 0.05
Nodes (43): framer-motion, next, dependencies, framer-motion, next, react, react-dom, @supabase/ssr (+35 more)

### Community 10 - "devDependencies"
Cohesion: 0.06
Nodes (32): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+24 more)

### Community 11 - "database.ts"
Cohesion: 0.06
Nodes (20): GET(), LeaveGroupRow(), ProfilePage(), formatAuthError(), LoginForm(), handleSubmit(), Mode, APPLE_ACCENTS (+12 more)

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
Cohesion: 0.29
Nodes (5): jetbrainsMono, merriweather, metadata, playfairDisplay, varelaRound

### Community 30 - "Expo Animation Recipes"
Cohesion: 0.06
Nodes (32): Bottom sheet you can drag to dismiss, Collapsing header on scroll, Expo Animation Recipes, Firing something once at a threshold, Keyboard-synced UI, List entrances, Press feedback, Screen transitions (Expo Router) (+24 more)

### Community 33 - "AppShell"
Cohesion: 0.07
Nodes (19): AppShell(), applyNotePatchLocally(), closeEventModal(), handleCreateMultipleEvents(), handleCreateNote(), handleCreateNoteFolder(), handleCreateNoteForEvent(), handleNoteDraftChange() (+11 more)

### Community 34 - "NotesApp.tsx"
Cohesion: 0.18
Nodes (11): Group, NoteDraftContext, NotesAppProps, NotesDialog(), NotesDialogProps, NotesLinkEventDialog(), NotesMoveToFolderDialog(), NotesMoveToFolderDialogProps (+3 more)

### Community 35 - "NotesFolderSidebar.tsx"
Cohesion: 0.12
Nodes (16): dropTargetStyle(), FolderDialogState, FolderRow(), Group, isFilterActive(), NotesFolderSidebar(), acceptsNoteDrag(), handleFolderDragOver() (+8 more)

### Community 36 - "CreateEventModal.tsx"
Cohesion: 0.12
Nodes (19): CreateEventModal(), buildDraft(), handleSubmit(), CreateEventModalProps, DayPicker(), DayPickerProps, EventDraft, groupConsecutiveDates() (+11 more)

### Community 40 - "NotesApp"
Cohesion: 0.16
Nodes (8): NotesApp(), confirmBulkDelete(), confirmMoveNote(), exitSelectionMode(), finishDrag(), handleDropNoteOnFolder(), handleDropNoteOnTrash(), handleMoveNoteToFolder()

### Community 41 - "NoteToolbar.tsx"
Cohesion: 0.11
Nodes (12): BULLET_PRESETS, BulletPicker(), COLORS, FONT_OPTIONS, HIGHLIGHT_COLORS, LINE_SPACING_OPTIONS, normalizeHref(), NoteToolbar() (+4 more)

### Community 42 - "NoteEditor.tsx"
Cohesion: 0.21
Nodes (9): NoteEditor(), NoteEditorProps, Commands, CustomBullet, LineHeight, @tiptap/core, EMPTY_TIPTAP_DOC, serializeNoteContent() (+1 more)

### Community 43 - "Animation Recipes"
Cohesion: 0.06
Nodes (30): Accordion / collapse, Animation Recipes, Button press, Drag to dismiss, Drawer / sheet, Dropdown, popover, menu, select, Hold to confirm, Masking a crossfade that won't settle (+22 more)

### Community 44 - "NotesFolderDialog.tsx"
Cohesion: 0.20
Nodes (9): FolderColorIcon(), NotesFolderDialog(), NotesFolderDialogForm(), NotesFolderDialogFormProps, NotesFolderDialogProps, DEFAULT_FOLDER_COLOR, FOLDER_COLOR_PALETTE, FolderColor (+1 more)

### Community 45 - "Animation Standards Reference"
Cohesion: 0.07
Nodes (25): Aggressive Escalation Triggers, Guidelines, Operating Posture, Part 1 — Findings table (REQUIRED), Part 2 — Verdict (REQUIRED), Remedial Preference Hierarchy, Required Output Format, Reviewing Animations (+17 more)

### Community 46 - "Animation Audit Playbook"
Cohesion: 0.09
Nodes (21): 1. Purpose & frequency, 2. Easing & duration, 3. Physicality & origin, 4. Interruptibility, 5. Performance, 6. Accessibility, 7. Cohesion & tokens, 8. Missed opportunities (+13 more)

### Community 48 - "Write Swift"
Cohesion: 0.09
Nodes (21): 10. ARC and object lifetime, 11. Testing — Swift Testing by default, 12. Macros, 13. Logging and debugging, 14. Unsafe code and interop, 15. Modern syntax you should be using, 16. Migrating an existing codebase to Swift 6, 1. Model data with value types (+13 more)

### Community 49 - "Apple Design"
Cohesion: 0.10
Nodes (20): 10. Gesture design details (the "feel" checklist), 11. Frame-level smoothness, 12. Materials & depth — translucency conveys hierarchy, 13. Multimodal feedback — motion + sound + haptics, 14. Reduced motion & accessibility, 15. Typography — optical sizing, tracking, leading, 16. Design foundations — the eight principles, 17. Process (+12 more)

### Community 50 - "Workflow"
Cohesion: 0.10
Nodes (18): Behavior contract, Markup, Reference wiring, Rules, Styles, The Picker, Hard Rules, Invocation Variants (+10 more)

### Community 51 - "Glossary"
Cohesion: 0.11
Nodes (17): Animation Vocabulary, Easing — how speed changes over an animation, Entrances & Exits — how elements appear and disappear, Examples, Feedback & Interaction — responding to the user's actions, Glossary, Instructions, Looping & Ambient Motion — animations that run on their own (+9 more)

### Community 52 - "Finding Animation Opportunities"
Cohesion: 0.12
Nodes (15): 1. Frequency — how often will a user see this?, 2. Purpose — why does this animate?, 3. Speed — can it stay inside budget?, 4. Function — does motion help or hinder here?, Finding Animation Opportunities, Hard Rules, Operating Posture, Part 1 — Opportunities table (+7 more)

### Community 53 - "eventPicker.ts"
Cohesion: 0.30
Nodes (11): NoteMetaBar(), EventPickerFilters, EventPickerGroup, filterAndGroupEventsForPicker(), filterEventsForPicker(), formatEventPickerTimeRange(), formatLinkedEventLabel(), formatPickerDateLabel() (+3 more)

### Community 54 - "Working With Sonner"
Cohesion: 0.17
Nodes (10): Functions, Sonner API Reference, `toast()` options, `<Toaster />`, Picking the right call, Recipes, Setup, Styling — the escalation ladder (+2 more)

### Community 55 - "notes.test.ts"
Cohesion: 0.22
Nodes (8): bulkMoveFolderOptions(), canMoveNoteToFolder(), filterNoOpNotePatch(), filterNotes(), foldersForNote(), isEmptyNotePatch(), noteContentsEqual(), notePatchBumpsUpdatedAt()

### Community 56 - "The list"
Cohesion: 0.20
Nodes (9): Charts, Common mismatches to catch, How to use this, Interaction & performance, Motion & visuals, Picking The Right Library, State & styling, The list (+1 more)

### Community 57 - "Design Engineering"
Cohesion: 0.22
Nodes (8): Accessibility, Design Engineering, Initial Response, prefers-reduced-motion, Review Checklist, Review Format (Required), Stagger Animations, Touch device hover states

### Community 58 - "Component Building Principles"
Cohesion: 0.25
Nodes (8): Animate enter states with @starting-style, Buttons must feel responsive, Component Building Principles, Make popovers origin-aware, Never animate from scale(0), Tooltips: skip delay on subsequent hovers, Use blur to mask imperfect transitions, Use CSS transitions over keyframes for interruptible UI

### Community 59 - "The Animation Decision Framework"
Cohesion: 0.33
Nodes (6): 1. Should this animate at all?, 2. What is the purpose?, 3. What easing should it use?, 4. How fast should it be?, Perceived performance, The Animation Decision Framework

### Community 60 - "clip-path for Animation"
Cohesion: 0.33
Nodes (6): clip-path for Animation, Comparison sliders, Hold-to-delete pattern, Image reveals on scroll, Tabs with perfect color transitions, The inset shape

### Community 61 - "Performance Rules"
Cohesion: 0.33
Nodes (6): CSS animations beat JS under load, CSS variables are inheritable, Framer Motion hardware acceleration caveat, Only animate transform and opacity, Performance Rules, Use WAAPI for programmatic CSS animations

### Community 62 - "Gesture and Drag Interactions"
Cohesion: 0.33
Nodes (6): Damping at boundaries, Friction instead of hard stops, Gesture and Drag Interactions, Momentum-based dismissal, Multi-touch protection, Pointer capture for drag

### Community 63 - "CSS Transform Mastery"
Cohesion: 0.40
Nodes (5): 3D transforms for depth, CSS Transform Mastery, scale() scales children too, transform-origin, translateY with percentages

### Community 64 - "The Sonner Principles (Building Loved Components)"
Cohesion: 0.40
Nodes (5): Asymmetric enter/exit timing, Cohesion matters, Review your work the next day, The opacity + height combination, The Sonner Principles (Building Loved Components)

### Community 65 - "Spring Animations"
Cohesion: 0.40
Nodes (5): Interruptibility advantage, Spring Animations, Spring-based mouse interactions, Spring configuration, When to use springs

### Community 66 - "Core Philosophy"
Cohesion: 0.50
Nodes (4): Beauty is leverage, Core Philosophy, Taste is trained, not innate, Unseen details compound

### Community 67 - "Debugging Animations"
Cohesion: 0.50
Nodes (4): Debugging Animations, Frame-by-frame inspection, Slow motion testing, Test on real devices

## Knowledge Gaps
- **449 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+444 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppShell()` connect `AppShell` to `AppShell.tsx`, `database.ts`, `CreateEventModal.tsx`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `createClient()` connect `database.ts` to `AppShell.tsx`, `AppShell`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `NotesApp()` connect `NotesApp` to `AppShell.tsx`, `NotesApp.tsx`, `notes.ts`, `notes.test.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _449 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppShell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0586997685672207 - nodes in this community are weakly interconnected._
- **Should `WeCalendar — Full Project Context` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._