# Graph Report - WeCalendar  (2026-11-11)

## Corpus Check
- 149 files · ~136,436 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1444 nodes · 2403 edges · 106 communities (92 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dba348d9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- calendar.ts
- WeCalendar — Full Project Context
- dependencies
- calendarSync.ts
- Expo Animation Recipes
- devDependencies
- Animation Recipes
- compilerOptions
- Animation Standards Reference
- WeCalendar
- CreateEventModal.tsx
- Animation Audit Playbook
- 20260730120000_init_schema.sql
- 20260806140000_bootstrap_schema.sql
- Write Swift
- Apple Design
- Workflow
- NotesApp.tsx
- Glossary
- EventViewerPanel.tsx
- 20261107013000_notifications_and_nudges.sql
- eventPicker.ts
- Finding Animation Opportunities
- AppShell
- NoteToolbar.tsx
- WeCalendar — project context
- 20260830120000_notes.sql
- Working With Sonner
- ConflictToast
- 20260818000000_tags.sql
- The list
- Navbar.tsx
- events.ts
- Design Engineering
- 5. Detailed Design
- Component Building Principles
- places.ts
- theme.ts
- layout.tsx
- The Animation Decision Framework
- clip-path for Animation
- Performance Rules
- Gesture and Drag Interactions
- rsvps.ts
- updateSession
- CSS Transform Mastery
- The Sonner Principles (Building Loved Components)
- Spring Animations
- Ponytail
- Core Philosophy
- Debugging Animations
- 20260831120000_notes_updated_at_content_only.sql
- Phase 2: Event RSVPs & `showDeclinedEvents` — Design Spec
- RightPanel/index.ts
- 20260806130000_fix_profile_signup_trigger.sql
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- calendarPrefs.ts
- notifications.ts
- public.events
- public.events
- public.events
- public.profiles
- 20261105230000_event_rsvps.sql
- Review Focus
- notes.ts
- 20261108210000_calendar_sync.sql
- Phase 3: Persisted Notifications & Availability Nudges — Design Spec
- Phase 5: External Calendar Sync & Unsync Calendar — Design Spec
- Review Focus
- Review Focus
- public.profiles
- PanelResizeHandle.tsx
- Review Focus
- 20261107210000_places_hardening.sql
- public.places
- 20261104210000_account_and_group_lifecycle.sql
- public.note_folders
- public.notes
- public.events
- public.notes
- Sidebar.tsx
- profile/page.tsx
- CalendarCell.tsx
- NotesApp
- NotesListPanel.tsx
- database.ts
- createClient
- ProfilePage
- NotesFolderDialog.tsx
- fetch/route.ts
- AppShell.tsx
- scheduling.ts

## God Nodes (most connected - your core abstractions)
1. `AppShell()` - 66 edges
2. `ProfilePage()` - 27 edges
3. `NotesApp()` - 21 edges
4. `startOfDay()` - 21 edges
5. `CalendarEvent` - 21 edges
6. `Apple Design` - 20 edges
7. `CreateEventModalContent()` - 19 edges
8. `Write Swift` - 18 edges
9. `addDays()` - 17 edges
10. `isSameDay()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `handleMarkAllNotificationsRead()` --calls--> `isMissingColumnOrRelationError()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/notifications.ts
- `handleDismissNotification()` --calls--> `isMissingColumnOrRelationError()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/notifications.ts
- `handleClearNotifications()` --calls--> `isMissingColumnOrRelationError()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/notifications.ts
- `handleCreateNoteFolder()` --calls--> `normalizeFolderColor()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/notes.ts
- `handleUpdateNoteFolder()` --calls--> `normalizeFolderColor()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/notes.ts

## Import Cycles
- None detected.

## Communities (106 total, 14 thin omitted)

### Community 0 - "calendar.ts"
Cohesion: 0.14
Nodes (27): CalendarGrid(), CalendarGridProps, DayPicker(), MiniCalendar(), MiniCalendarProps, Sidebar(), MiniMonth(), YearViewProps (+19 more)

### Community 1 - "WeCalendar — Full Project Context"
Cohesion: 0.04
Nodes (46): 10. Shared Lists / Tasks, 11. Calendar Interactions, 12. CI Pipeline, 13. What's Done vs. Pending, 14. Development Commands, 15. Key Design Decisions, 1. What Is WeCalendar?, 2. Tech Stack (+38 more)

### Community 2 - "dependencies"
Cohesion: 0.04
Nodes (47): framer-motion, next, dependencies, framer-motion, html2canvas-pro, leaflet, next, react (+39 more)

### Community 3 - "calendarSync.ts"
Cohesion: 0.11
Nodes (33): RFC-5545, handleExportIcs(), handleImportIcsFile(), handleLeaveAllGroups(), handleRefreshSync(), handleSyncIcsUrl(), syncEventsIntoWorkspace(), CalendarSync (+25 more)

### Community 5 - "Expo Animation Recipes"
Cohesion: 0.06
Nodes (32): Bottom sheet you can drag to dismiss, Collapsing header on scroll, Expo Animation Recipes, Firing something once at a threshold, Keyboard-synced UI, List entrances, Press feedback, Screen transitions (Expo Router) (+24 more)

### Community 6 - "devDependencies"
Cohesion: 0.06
Nodes (34): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/leaflet (+26 more)

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

### Community 11 - "CreateEventModal.tsx"
Cohesion: 0.23
Nodes (7): CreateEventModal(), CreateEventModalProps, DayPickerProps, EventDraft, RSVP_OPTIONS, toDateInput(), TagCreatorInline()

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

### Community 18 - "NotesApp.tsx"
Cohesion: 0.11
Nodes (16): NoteEditor(), NoteEditorProps, Commands, CustomBullet, LineHeight, @tiptap/core, NoteDraftContext, NotesAppProps (+8 more)

### Community 19 - "Glossary"
Cohesion: 0.11
Nodes (17): Animation Vocabulary, Easing — how speed changes over an animation, Entrances & Exits — how elements appear and disappear, Examples, Feedback & Interaction — responding to the user's actions, Glossary, Instructions, Looping & Ambient Motion — animations that run on their own (+9 more)

### Community 20 - "EventViewerPanel.tsx"
Cohesion: 0.11
Nodes (23): CalendarProps, DayView(), DayViewProps, BUCKET_META, BUCKET_ORDER, EventRow(), EventViewerPanelProps, TimeBucket (+15 more)

### Community 21 - "20261107013000_notifications_and_nudges.sql"
Cohesion: 0.11
Nodes (24): inserted_rows, public.event_rsvps, public.notify_on_event_insert, public.notify_on_list_activity, public.notify_on_member_join, public.notify_on_member_leave, events_notify_insert, group_members_notify_join (+16 more)

### Community 22 - "eventPicker.ts"
Cohesion: 0.26
Nodes (13): NoteMetaBar(), NotesLinkEventDialogContent(), NotesLinkEventDialogProps, EventPickerFilters, EventPickerGroup, filterAndGroupEventsForPicker(), filterEventsForPicker(), formatEventPickerTimeRange() (+5 more)

### Community 23 - "Finding Animation Opportunities"
Cohesion: 0.12
Nodes (15): 1. Frequency — how often will a user see this?, 2. Purpose — why does this animate?, 3. Speed — can it stay inside budget?, 4. Function — does motion help or hinder here?, Finding Animation Opportunities, Hard Rules, Operating Posture, Part 1 — Opportunities table (+7 more)

### Community 24 - "AppShell"
Cohesion: 0.06
Nodes (21): AppShell(), applyNotePatchLocally(), closeEventModal(), handleClearNotifications(), handleCreateMultipleEvents(), handleCreateNote(), handleCreateNoteFolder(), handleCreateNoteForEvent() (+13 more)

### Community 25 - "NoteToolbar.tsx"
Cohesion: 0.11
Nodes (12): BULLET_PRESETS, BulletPicker(), COLORS, FONT_OPTIONS, HIGHLIGHT_COLORS, LINE_SPACING_OPTIONS, normalizeHref(), NoteToolbar() (+4 more)

### Community 26 - "WeCalendar — project context"
Cohesion: 0.13
Nodes (14): Branch note, How two accounts sync, Key paths, Not done yet / next ideas, Phase 1 — Scaffold + calendar UI, Phase 2 — Schema, Phase 3 — Auth, Shared sync (in progress / needs further testing) (+6 more)

### Community 27 - "20260830120000_notes.sql"
Cohesion: 0.21
Nodes (14): public.validate_note_event_group, note_folders_set_updated_at, notes_set_updated_at, notes_validate_event_group, public.can_edit_note(), public.can_view_note(), public.can_view_note_folder(), public.note_folders (+6 more)

### Community 28 - "Working With Sonner"
Cohesion: 0.17
Nodes (10): Functions, Sonner API Reference, `toast()` options, `<Toaster />`, Picking the right call, Recipes, Setup, Styling — the escalation ladder (+2 more)

### Community 29 - "ConflictToast"
Cohesion: 0.22
Nodes (3): ConflictToast(), ConflictToastItem, ConflictToastProps

### Community 30 - "20260818000000_tags.sql"
Cohesion: 0.25
Nodes (10): public.event_tags, public.is_event_group_member(), public.is_tag_group_member(), public.tags, public.events, public.group_members, public.groups, public.profiles (+2 more)

### Community 31 - "The list"
Cohesion: 0.20
Nodes (9): Charts, Common mismatches to catch, How to use this, Interaction & performance, Motion & visuals, Picking The Right Library, State & styling, The list (+1 more)

### Community 32 - "Navbar.tsx"
Cohesion: 0.12
Nodes (11): APPLE_ACCENTS, loadRecentColors(), MODES, Navbar(), NavbarProps, PRESET_COLORS, ProfileMenu(), handleSignOut() (+3 more)

### Community 33 - "events.ts"
Cohesion: 0.12
Nodes (29): handleUpdateSeries(), computeMultiDaySlots(), CreateEventModalContent(), buildDraft(), handleSubmit(), toTimeInput(), bucketEvents(), addDays() (+21 more)

### Community 34 - "Design Engineering"
Cohesion: 0.22
Nodes (8): Accessibility, Design Engineering, Initial Response, prefers-reduced-motion, Review Checklist, Review Format (Required), Stagger Animations, Touch device hover states

### Community 35 - "5. Detailed Design"
Cohesion: 0.10
Nodes (19): 1. Intent & Why, 2. Goals, Non-Goals & Anti-Goals, 3. Constraints, 4. Approaches Considered, 5.1 Reactive Preferences & `defaultView` (`src/lib/calendarPrefs.ts`, `src/components/AppShell/AppShell.tsx`), 5.2 `weekStartsOnMonday` Across Calendar & Events, 5.3 Zero-Group Onboarding & Interactive `MiniCalendar`, 5.4 Multi-Day Events: Validation, Editing & TimeGrid Clipping (`src/components/CreateEventModal/CreateEventModal.tsx`, `src/lib/events.ts`, `src/components/TimeGrid/TimeGrid.tsx`) (+11 more)

### Community 36 - "Component Building Principles"
Cohesion: 0.25
Nodes (8): Animate enter states with @starting-style, Buttons must feel responsive, Component Building Principles, Make popovers origin-aware, Never animate from scale(0), Tooltips: skip delay on subsequent hovers, Use blur to mask imperfect transitions, Use CSS transitions over keyframes for interruptible UI

### Community 37 - "places.ts"
Cohesion: 0.06
Nodes (66): fetchJson(), fetchNominatim(), GET(), OSM_HEADERS, searchCache, cappedSignal(), DraftPin, LocationStatus (+58 more)

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

### Community 44 - "rsvps.ts"
Cohesion: 0.26
Nodes (10): unansweredMemberIdsForEvent(), EventRsvp, filterConflictCandidateEvents(), filterVisibleEvents(), isRsvpStatus(), rsvpMapForUser(), RsvpMemberSummary, RsvpStatus (+2 more)

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

### Community 53 - "Phase 2: Event RSVPs & `showDeclinedEvents` — Design Spec"
Cohesion: 0.12
Nodes (16): 1. Intent & Why, 2. Goals, Non-Goals & Anti-Goals, 3. Constraints, 4. Approaches Considered, 5.1 Database Migration (`supabase/migrations/20261105230000_event_rsvps.sql`), 5.2 TypeScript Types & Pure Domain Helpers (`src/types/database.ts`, `src/lib/rsvps.ts`, `src/lib/events.ts`), 5.3 App State, Realtime & Export (`src/components/AppShell/AppShell.tsx`, `src/lib/accountExport.ts`), 5.4 Modal UI & Dimmed Declined Rendering (+8 more)

### Community 61 - "calendarPrefs.ts"
Cohesion: 0.20
Nodes (15): CalendarSettingsSection(), CalendarMode, ALLOWED_VIEWS, CalendarPrefs, DEFAULTS, getPrefsSnapshot(), getServerPrefsSnapshot(), KEYS (+7 more)

### Community 62 - "notifications.ts"
Cohesion: 0.18
Nodes (17): handleToggleNotificationPref(), handleUnsyncCalendars(), loadUser(), NotificationBell(), AppNotification, consumePendingOpenTarget(), countUnreadNotifications(), DEFAULT_NOTIFICATION_PREFS (+9 more)

### Community 75 - "20261105230000_event_rsvps.sql"
Cohesion: 0.17
Nodes (11): public.reset_event_rsvps_on_reschedule, event_rsvps_set_updated_at, events_reset_rsvps_on_reschedule, public.event_rsvps, public.is_event_in_group(), public.leave_group(), public.events, public.group_members (+3 more)

### Community 76 - "Review Focus"
Cohesion: 0.18
Nodes (10): Core UX & Account Settings Implementation Plan, Global Constraints, Review Focus, Task 1: Password Validation Helper & Reactive Calendar Preferences, Task 2: Monday-First Calendar Math & Multi-Day Span / TimeGrid Helpers, Task 3: Multi-Day Event Draft Expansion, Validation & `CreateEventModal`, Task 4: Thread `weekStartsOnMonday`, `TimeGrid` Clipping & Interactive `MiniCalendar`, Task 5: Account & Group Lifecycle SQL Migration, Database Types & Data Export Helper (+2 more)

### Community 77 - "notes.ts"
Cohesion: 0.17
Nodes (19): NotesMoveToFolderDialog(), NotesMoveToFolderDialogProps, bulkMoveFolderOptions(), BulkMoveFolderResult, filterNoOpNotePatch(), filterNotesByTags(), foldersForNote(), isEmptyNotePatch() (+11 more)

### Community 78 - "20261108210000_calendar_sync.sql"
Cohesion: 0.18
Nodes (5): calendar_syncs_updated_at, public.calendar_syncs, public.groups, public.profiles, public.set_updated_at

### Community 79 - "Phase 3: Persisted Notifications & Availability Nudges — Design Spec"
Cohesion: 0.22
Nodes (8): 1. Intent & Why, 2. Goals, Non-Goals & Anti-Goals, 3. Sensible Defaults Chosen (Builder Calls), 4. Schema & Security (`supabase/migrations/20261107013000_notifications_and_nudges.sql`), Anti-Goals, Goals, Non-Goals (Builder Calls), Phase 3: Persisted Notifications & Availability Nudges — Design Spec

### Community 80 - "Phase 5: External Calendar Sync & Unsync Calendar — Design Spec"
Cohesion: 0.22
Nodes (8): 1. Intent & Why, 2. Goals, Non-Goals & Anti-Goals, 3. Sensible Defaults Chosen (Builder Calls), 4. Schema & Security (`supabase/migrations/20261108210000_calendar_sync.sql`), Anti-Goals, Goals, Non-Goals (Builder Calls), Phase 5: External Calendar Sync & Unsync Calendar — Design Spec

### Community 81 - "Review Focus"
Cohesion: 0.25
Nodes (7): Event RSVPs & `showDeclinedEvents` Implementation Plan, Global Constraints, Review Focus, Task 1: `event_rsvps` SQL Migration, Database Types & Account Export, Task 2: Pure RSVP Domain Helpers & In-Place Series Reconciliation, Task 3: `CreateEventModal` Attendance Controls, Group Tally & `softOverlap` Declined Filtering, Task 4: Wire `AppShell` Realtime RSVPs & Dimmed Declined Rendering Across Views

### Community 82 - "Review Focus"
Cohesion: 0.25
Nodes (7): Global Constraints, Persisted Notifications & Availability Nudges Implementation Plan, Review Focus, Task 1: Notifications & Nudges SQL Migration, Database Types & Account Export, Task 2: Notification Domain Helpers & Persisted `/profile` Notification Toggles, Task 3: Navbar Notification Bell Popover & Nudge Controls in `CreateEventModal` / `SharedWorkspace`, Task 4: Wire Realtime Notifications & Nudge Handlers in `AppShell`

### Community 83 - "public.profiles"
Cohesion: 0.25
Nodes (8): public.list_items, public.lists, public.tags, public.events, public.groups, public.note_folders, public.notes, public.profiles

### Community 84 - "PanelResizeHandle.tsx"
Cohesion: 0.36
Nodes (7): clamp(), loadWidth(), PANEL_DEFAULT_WIDTH, PANEL_MIN_WIDTH, PanelResizeHandle(), PanelResizeHandleProps, usePanelWidth()

### Community 85 - "Review Focus"
Cohesion: 0.29
Nodes (6): External Calendar Sync & Unsync Implementation Plan, Global Constraints, Review Focus, Task 1: Calendar Sync SQL Migration, Database Types & Account Export, Task 2: Pure `.ics` Parser, Serializer, SSRF URL Validator & Fetch Route, Task 3: Wire External Calendar Sync UI & `#unsync-calendar-btn` on `/profile`

### Community 86 - "20261107210000_places_hardening.sql"
Cohesion: 0.33
Nodes (5): public.enforce_place_same_group, public.places, events_enforce_place_same_group, notes_enforce_place_same_group, public.is_place_in_group()

### Community 87 - "public.places"
Cohesion: 0.33
Nodes (5): places_set_updated_at, public.places, public.groups, public.profiles, public.set_updated_at

### Community 88 - "20261104210000_account_and_group_lifecycle.sql"
Cohesion: 0.50
Nodes (3): public.leave_all_groups(), public.leave_group(), public.group_members

### Community 95 - "Sidebar.tsx"
Cohesion: 0.13
Nodes (16): dropTargetStyle(), FolderDialogState, FolderRow(), Group, isFilterActive(), NotesSidebarContent(), acceptsNoteDrag(), handleFolderDragOver() (+8 more)

### Community 96 - "profile/page.tsx"
Cohesion: 0.17
Nodes (10): CALENDAR_VIEWS, Group, LeaveGroupRow(), handleExportData(), AccountExportBundle, fetchAccountExportBundle(), formatExportFilename(), isMissingRelationError() (+2 more)

### Community 97 - "CalendarCell.tsx"
Cohesion: 0.18
Nodes (19): barEdges(), barRadius(), CalendarCell(), CalendarCellProps, conflictBarShadow(), conflictOutline(), EventCreatorBadge(), getEventCreatorColor() (+11 more)

### Community 98 - "NotesApp"
Cohesion: 0.13
Nodes (7): NotesApp(), confirmBulkDelete(), confirmMoveNote(), exitSelectionMode(), handleMoveNoteToFolder(), canMoveNoteToFolder(), filterNotes()

### Community 99 - "NotesListPanel.tsx"
Cohesion: 0.21
Nodes (14): Badge(), NotesListPanel(), NotesListPanelProps, filterLabel(), folderBadgeStyle(), folderForNote(), folderNameForNote(), formatNoteDate() (+6 more)

### Community 100 - "database.ts"
Cohesion: 0.18
Nodes (6): Group, SharedWorkspace(), SharedWorkspaceProps, Tables, TablesInsert, TablesUpdate

### Community 101 - "createClient"
Cohesion: 0.23
Nodes (9): formatAuthError(), LoginForm(), handleSubmit(), Mode, getInitials(), isPasswordValid(), PasswordRules, validatePasswordRules() (+1 more)

### Community 102 - "ProfilePage"
Cohesion: 0.21
Nodes (8): ProfilePage(), handleCreateGroup(), handleDisconnectSync(), handleJoinGroup(), handleLeaveGroup(), handleSelectGroup(), reloadGroups(), writeLocalCalendarSyncs()

### Community 103 - "NotesFolderDialog.tsx"
Cohesion: 0.20
Nodes (9): FolderColorIcon(), NotesFolderDialog(), NotesFolderDialogForm(), NotesFolderDialogFormProps, NotesFolderDialogProps, DEFAULT_FOLDER_COLOR, FOLDER_COLOR_PALETTE, FolderColor (+1 more)

### Community 104 - "fetch/route.ts"
Cohesion: 0.27
Nodes (9): createPinnedSsrfLookup(), fetchSingleHopPinned(), HopResult, POST(), REDIRECT_STATUS_CODES, GET(), selectPinnedLookupAddresses(), createClient() (+1 more)

### Community 105 - "AppShell.tsx"
Cohesion: 0.20
Nodes (6): emptySubscribe(), EventCreator, Group, Calendar(), EventViewerPanel(), PendingOpenTarget

### Community 107 - "scheduling.ts"
Cohesion: 0.38
Nodes (7): conflictFingerprint(), ConflictGroup, conflictingEventGroups(), conflictingEventIds(), draftOverlapsExisting(), rangesOverlap(), SCHEDULING_CONFLICT_MESSAGE

## Knowledge Gaps
- **546 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+541 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppShell()` connect `AppShell` to `calendar.ts`, `events.ts`, `createClient`, `theme.ts`, `AppShell.tsx`, `scheduling.ts`, `rsvps.ts`, `notes.ts`, `PanelResizeHandle.tsx`, `EventViewerPanel.tsx`, `calendarPrefs.ts`, `notifications.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `ProfilePage()` connect `ProfilePage` to `profile/page.tsx`, `calendarSync.ts`, `createClient`, `calendarPrefs.ts`, `notifications.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `profile/page.tsx`, `Navbar.tsx`, `ProfilePage`, `AppShell.tsx`, `AppShell`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _546 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `calendar.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13513513513513514 - nodes in this community are weakly interconnected._
- **Should `WeCalendar — Full Project Context` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._