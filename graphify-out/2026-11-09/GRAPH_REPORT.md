# Graph Report - .  (2026-10-11)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 964 nodes · 1502 edges · 75 communities (62 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.56)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3e4335c9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- calendar.ts
- WeCalendar — Full Project Context
- dependencies
- profile/page.tsx
- events.ts
- Expo Animation Recipes
- devDependencies
- Animation Recipes
- compilerOptions
- Animation Standards Reference
- WeCalendar
- Sidebar.tsx
- Animation Audit Playbook
- 20260730120000_init_schema.sql
- 20260806140000_bootstrap_schema.sql
- Write Swift
- Apple Design
- Workflow
- notes.ts
- Glossary
- EventViewerPanel.tsx
- NotesApp.tsx
- eventPicker.ts
- Finding Animation Opportunities
- notes.test.ts
- NoteToolbar.tsx
- WeCalendar — project context
- 20260830120000_notes.sql
- Working With Sonner
- AppShell.tsx
- 20260818000000_tags.sql
- The list
- database.ts
- NoteEditor.tsx
- Design Engineering
- NotesFolderDialog.tsx
- Component Building Principles
- Calendar.tsx
- theme.ts
- layout.tsx
- The Animation Decision Framework
- clip-path for Animation
- Performance Rules
- Gesture and Drag Interactions
- Tables
- updateSession
- CSS Transform Mastery
- The Sonner Principles (Building Loved Components)
- Spring Animations
- Ponytail
- Core Philosophy
- Debugging Animations
- 20260831120000_notes_updated_at_content_only.sql
- DayView.tsx
- RightPanel/index.ts
- 20260806130000_fix_profile_signup_trigger.sql
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- public.note_folders
- public.notes
- public.events
- public.events
- public.events
- public.profiles

## God Nodes (most connected - your core abstractions)
1. `Apple Design` - 20 edges
2. `AppShell()` - 19 edges
3. `CalendarEvent` - 18 edges
4. `Write Swift` - 18 edges
5. `WeCalendar — Full Project Context` - 16 edges
6. `Design Engineering` - 16 edges
7. `compilerOptions` - 16 edges
8. `Animation Standards Reference` - 16 edges
9. `startOfDay()` - 15 edges
10. `Animation Recipes` - 15 edges

## Surprising Connections (you probably didn't know these)
- `AppShell()` --calls--> `getInitials()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/auth.ts
- `AppShell()` --calls--> `useCalendarPrefs()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendarPrefs.ts
- `AppShell()` --calls--> `canMoveNoteToFolder()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/notes.ts
- `AppShell()` --calls--> `filterNotesByTags()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/notes.ts
- `AppShell()` --calls--> `isEmptyNotePatch()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/notes.ts

## Import Cycles
- None detected.

## Communities (75 total, 13 thin omitted)

### Community 0 - "calendar.ts"
Cohesion: 0.09
Nodes (42): AppShell(), CreateEventModal(), CreateEventModalContent(), CreateEventModalProps, DayPicker(), DayPickerProps, EventDraft, groupConsecutiveDates() (+34 more)

### Community 1 - "WeCalendar — Full Project Context"
Cohesion: 0.04
Nodes (46): 10. Shared Lists / Tasks, 11. Calendar Interactions, 12. CI Pipeline, 13. What's Done vs. Pending, 14. Development Commands, 15. Key Design Decisions, 1. What Is WeCalendar?, 2. Tech Stack (+38 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (44): framer-motion, next, dependencies, framer-motion, html2canvas-pro, next, react, react-dom (+36 more)

### Community 3 - "profile/page.tsx"
Cohesion: 0.06
Nodes (26): CALENDAR_VIEWS, CalendarSettingsSection(), Group, ProfilePage(), formatAuthError(), LoginForm(), Mode, APPLE_ACCENTS (+18 more)

### Community 4 - "events.ts"
Cohesion: 0.11
Nodes (33): barEdges(), barRadius(), CalendarCell(), CalendarCellProps, conflictBarShadow(), conflictOutline(), CalendarGrid(), CalendarGridProps (+25 more)

### Community 5 - "Expo Animation Recipes"
Cohesion: 0.06
Nodes (32): Bottom sheet you can drag to dismiss, Collapsing header on scroll, Expo Animation Recipes, Firing something once at a threshold, Keyboard-synced UI, List entrances, Press feedback, Screen transitions (Expo Router) (+24 more)

### Community 6 - "devDependencies"
Cohesion: 0.06
Nodes (32): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+24 more)

### Community 7 - "Animation Recipes"
Cohesion: 0.06
Nodes (30): Accordion / collapse, Animation Recipes, Button press, Drag to dismiss, Drawer / sheet, Dropdown, popover, menu, select, Hold to confirm, Masking a crossfade that won't settle (+22 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (31): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+23 more)

### Community 9 - "Animation Standards Reference"
Cohesion: 0.07
Nodes (25): Aggressive Escalation Triggers, Guidelines, Operating Posture, Part 1 — Findings table (REQUIRED), Part 2 — Verdict (REQUIRED), Remedial Preference Hierarchy, Required Output Format, Reviewing Animations (+17 more)

### Community 10 - "WeCalendar"
Cohesion: 0.07
Nodes (25): Apply the migration, Option A — Supabase Dashboard (simplest), Option B — Supabase CLI, Out of scope (later phases), RPCs (use these from the app), Security, Smoke test (after auth exists), Tables (+17 more)

### Community 11 - "Sidebar.tsx"
Cohesion: 0.11
Nodes (18): MiniCalendar(), MiniCalendarProps, WEEKDAYS, dropTargetStyle(), FolderDialogState, FolderRow(), Group, isFilterActive() (+10 more)

### Community 12 - "Animation Audit Playbook"
Cohesion: 0.09
Nodes (21): 1. Purpose & frequency, 2. Easing & duration, 3. Physicality & origin, 4. Interruptibility, 5. Performance, 6. Accessibility, 7. Cohesion & tokens, 8. Missed opportunities (+13 more)

### Community 13 - "20260730120000_init_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 14 - "20260806140000_bootstrap_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 15 - "Write Swift"
Cohesion: 0.09
Nodes (21): 10. ARC and object lifetime, 11. Testing — Swift Testing by default, 12. Macros, 13. Logging and debugging, 14. Unsafe code and interop, 15. Modern syntax you should be using, 16. Migrating an existing codebase to Swift 6, 1. Model data with value types (+13 more)

### Community 16 - "Apple Design"
Cohesion: 0.10
Nodes (20): 10. Gesture design details (the "feel" checklist), 11. Frame-level smoothness, 12. Materials & depth — translucency conveys hierarchy, 13. Multimodal feedback — motion + sound + haptics, 14. Reduced motion & accessibility, 15. Typography — optical sizing, tracking, leading, 16. Design foundations — the eight principles, 17. Process (+12 more)

### Community 17 - "Workflow"
Cohesion: 0.10
Nodes (18): Behavior contract, Markup, Reference wiring, Rules, Styles, The Picker, Hard Rules, Invocation Variants (+10 more)

### Community 18 - "notes.ts"
Cohesion: 0.23
Nodes (17): Badge(), NotesListPanel(), NotesListPanelProps, BulkMoveFolderResult, DEFAULT_NOTES_SORT, filterLabel(), folderBadgeStyle(), folderForNote() (+9 more)

### Community 19 - "Glossary"
Cohesion: 0.11
Nodes (17): Animation Vocabulary, Easing — how speed changes over an animation, Entrances & Exits — how elements appear and disappear, Examples, Feedback & Interaction — responding to the user's actions, Glossary, Instructions, Looping & Ambient Motion — animations that run on their own (+9 more)

### Community 20 - "EventViewerPanel.tsx"
Cohesion: 0.19
Nodes (14): BUCKET_META, BUCKET_ORDER, EventRow(), EventViewerPanelProps, TimeBucket, colorForEvent(), EventTag, Tag (+6 more)

### Community 21 - "NotesApp.tsx"
Cohesion: 0.18
Nodes (13): NoteDraftContext, NotesApp(), NotesAppProps, NotesDialog(), NotesDialogProps, NotesFolderDialog(), NotesLinkEventDialog(), canMoveNoteToFolder() (+5 more)

### Community 22 - "eventPicker.ts"
Cohesion: 0.26
Nodes (13): NoteMetaBar(), NotesLinkEventDialogContent(), NotesLinkEventDialogProps, EventPickerFilters, EventPickerGroup, filterAndGroupEventsForPicker(), filterEventsForPicker(), formatEventPickerTimeRange() (+5 more)

### Community 23 - "Finding Animation Opportunities"
Cohesion: 0.12
Nodes (15): 1. Frequency — how often will a user see this?, 2. Purpose — why does this animate?, 3. Speed — can it stay inside budget?, 4. Function — does motion help or hinder here?, Finding Animation Opportunities, Hard Rules, Operating Posture, Part 1 — Opportunities table (+7 more)

### Community 24 - "notes.test.ts"
Cohesion: 0.17
Nodes (12): NotesMoveToFolderDialog(), NotesMoveToFolderDialogProps, bulkMoveFolderOptions(), filterNoOpNotePatch(), filterNotesByTags(), folderNameForNote(), foldersForNote(), isEmptyNotePatch() (+4 more)

### Community 25 - "NoteToolbar.tsx"
Cohesion: 0.13
Nodes (9): BULLET_PRESETS, COLORS, FONT_OPTIONS, HIGHLIGHT_COLORS, LINE_SPACING_OPTIONS, normalizeHref(), NoteToolbar(), NoteToolbarProps (+1 more)

### Community 26 - "WeCalendar — project context"
Cohesion: 0.13
Nodes (14): Branch note, How two accounts sync, Key paths, Not done yet / next ideas, Phase 1 — Scaffold + calendar UI, Phase 2 — Schema, Phase 3 — Auth, Shared sync (in progress / needs further testing) (+6 more)

### Community 27 - "20260830120000_notes.sql"
Cohesion: 0.21
Nodes (14): public.validate_note_event_group, note_folders_set_updated_at, notes_set_updated_at, notes_validate_event_group, public.can_edit_note(), public.can_view_note(), public.can_view_note_folder(), public.note_folders (+6 more)

### Community 28 - "Working With Sonner"
Cohesion: 0.17
Nodes (10): Functions, Sonner API Reference, `toast()` options, `<Toaster />`, Picking the right call, Recipes, Setup, Styling — the escalation ladder (+2 more)

### Community 29 - "AppShell.tsx"
Cohesion: 0.23
Nodes (7): EventCreator, Group, ConflictToast(), ConflictToastItem, ConflictToastProps, EventViewerPanel(), getInitials()

### Community 30 - "20260818000000_tags.sql"
Cohesion: 0.25
Nodes (10): public.group_members, public.event_tags, public.is_event_group_member(), public.is_tag_group_member(), public.tags, public.events, public.groups, public.profiles (+2 more)

### Community 31 - "The list"
Cohesion: 0.20
Nodes (9): Charts, Common mismatches to catch, How to use this, Interaction & performance, Motion & visuals, Picking The Right Library, State & styling, The list (+1 more)

### Community 32 - "database.ts"
Cohesion: 0.29
Nodes (6): GET(), createClient(), Database, Json, TablesInsert, TablesUpdate

### Community 33 - "NoteEditor.tsx"
Cohesion: 0.27
Nodes (8): NoteEditor(), NoteEditorProps, Commands, CustomBullet, LineHeight, @tiptap/core, EMPTY_TIPTAP_DOC, serializeNoteContent()

### Community 34 - "Design Engineering"
Cohesion: 0.22
Nodes (8): Accessibility, Design Engineering, Initial Response, prefers-reduced-motion, Review Checklist, Review Format (Required), Stagger Animations, Touch device hover states

### Community 35 - "NotesFolderDialog.tsx"
Cohesion: 0.28
Nodes (8): FolderColorIcon(), NotesFolderDialogForm(), NotesFolderDialogFormProps, NotesFolderDialogProps, DEFAULT_FOLDER_COLOR, FOLDER_COLOR_PALETTE, FolderColor, normalizeFolderColor()

### Community 36 - "Component Building Principles"
Cohesion: 0.25
Nodes (8): Animate enter states with @starting-style, Buttons must feel responsive, Component Building Principles, Make popovers origin-aware, Never animate from scale(0), Tooltips: skip delay on subsequent hovers, Use blur to mask imperfect transitions, Use CSS transitions over keyframes for interruptible UI

### Community 37 - "Calendar.tsx"
Cohesion: 0.32
Nodes (4): Calendar(), CalendarProps, WeekView(), WeekViewProps

### Community 38 - "theme.ts"
Cohesion: 0.39
Nodes (7): applyTheme(), DEFAULT_ACCENT, getSystemTheme(), loadAccent(), loadTheme(), ThemeMode, useTheme()

### Community 39 - "layout.tsx"
Cohesion: 0.29
Nodes (5): jetbrainsMono, merriweather, metadata, playfairDisplay, varelaRound

### Community 40 - "The Animation Decision Framework"
Cohesion: 0.33
Nodes (6): 1. Should this animate at all?, 2. What is the purpose?, 3. What easing should it use?, 4. How fast should it be?, Perceived performance, The Animation Decision Framework

### Community 41 - "clip-path for Animation"
Cohesion: 0.33
Nodes (6): clip-path for Animation, Comparison sliders, Hold-to-delete pattern, Image reveals on scroll, Tabs with perfect color transitions, The inset shape

### Community 42 - "Performance Rules"
Cohesion: 0.33
Nodes (6): CSS animations beat JS under load, CSS variables are inheritable, Framer Motion hardware acceleration caveat, Only animate transform and opacity, Performance Rules, Use WAAPI for programmatic CSS animations

### Community 43 - "Gesture and Drag Interactions"
Cohesion: 0.33
Nodes (6): Damping at boundaries, Friction instead of hard stops, Gesture and Drag Interactions, Momentum-based dismissal, Multi-touch protection, Pointer capture for drag

### Community 44 - "Tables"
Cohesion: 0.40
Nodes (4): Group, SharedWorkspace(), SharedWorkspaceProps, Tables

### Community 45 - "updateSession"
Cohesion: 0.53
Nodes (4): copyCookies(), updateSession(), config, proxy()

### Community 46 - "CSS Transform Mastery"
Cohesion: 0.40
Nodes (5): 3D transforms for depth, CSS Transform Mastery, scale() scales children too, transform-origin, translateY with percentages

### Community 47 - "The Sonner Principles (Building Loved Components)"
Cohesion: 0.40
Nodes (5): Asymmetric enter/exit timing, Cohesion matters, Review your work the next day, The opacity + height combination, The Sonner Principles (Building Loved Components)

### Community 48 - "Spring Animations"
Cohesion: 0.40
Nodes (5): Interruptibility advantage, Spring Animations, Spring-based mouse interactions, Spring configuration, When to use springs

### Community 49 - "Ponytail"
Cohesion: 0.40
Nodes (4): Persistence, Ponytail, Rules, The ladder

### Community 50 - "Core Philosophy"
Cohesion: 0.50
Nodes (4): Beauty is leverage, Core Philosophy, Taste is trained, not innate, Unseen details compound

### Community 51 - "Debugging Animations"
Cohesion: 0.50
Nodes (4): Debugging Animations, Frame-by-frame inspection, Slow motion testing, Test on real devices

## Knowledge Gaps
- **461 isolated node(s):** `CreateEventModalProps`, `DayPickerProps`, `YearViewProps`, `ConflictGroup`, `MiniCalendarProps` (+456 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `CalendarEvent` connect `events.ts` to `calendar.ts`, `Calendar.tsx`, `EventViewerPanel.tsx`, `DayView.tsx`, `NotesApp.tsx`, `eventPicker.ts`, `AppShell.tsx`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `Tag` connect `EventViewerPanel.tsx` to `calendar.ts`, `events.ts`, `Calendar.tsx`, `Sidebar.tsx`, `DayView.tsx`, `NotesApp.tsx`, `eventPicker.ts`, `AppShell.tsx`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `CreateEventModalProps`, `DayPickerProps`, `YearViewProps` to the rest of the system?**
  _461 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `calendar.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0880503144654088 - nodes in this community are weakly interconnected._
- **Should `WeCalendar — Full Project Context` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._