# Graph Report - WeCalendar  (2026-09-23)

## Corpus Check
- 114 files · ~87,827 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 951 nodes · 1481 edges · 63 communities (53 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0ce8a47`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- scheduling.ts
- Ponytail
- WeCalendar — Full Project Context
- compilerOptions
- AppShell.tsx
- WeCalendar
- Sidebar.tsx
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
- Expo Animation Recipes
- public.events
- events.ts
- theme.ts
- 20260831120000_notes_updated_at_content_only.sql
- public.note_folders
- calendar.ts
- NoteToolbar.tsx
- Animation Recipes
- Animation Standards Reference
- Animation Audit Playbook
- Write Swift
- Apple Design
- Workflow
- Glossary
- Finding Animation Opportunities
- Working With Sonner
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
- ConflictToast.tsx

## God Nodes (most connected - your core abstractions)
1. `Apple Design` - 20 edges
2. `AppShell()` - 19 edges
3. `Write Swift` - 18 edges
4. `CalendarEvent` - 16 edges
5. `compilerOptions` - 16 edges
6. `Design Engineering` - 16 edges
7. `Animation Standards Reference` - 16 edges
8. `WeCalendar — Full Project Context` - 16 edges
9. `startOfDay()` - 15 edges
10. `Animation Recipes` - 15 edges

## Surprising Connections (you probably didn't know these)
- `CalendarSettingsSection()` --calls--> `useCalendarPrefs()`  [EXTRACTED]
  src/app/profile/page.tsx → src/lib/calendarPrefs.ts
- `ProfilePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/profile/page.tsx → src/lib/supabase/client.ts
- `AppShell()` --calls--> `formatViewLabel()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `isDateInView()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts
- `AppShell()` --calls--> `shiftViewDate()`  [EXTRACTED]
  src/components/AppShell/AppShell.tsx → src/lib/calendar.ts

## Import Cycles
- None detected.

## Communities (63 total, 10 thin omitted)

### Community 0 - "scheduling.ts"
Cohesion: 0.38
Nodes (7): conflictFingerprint(), ConflictGroup, conflictingEventGroups(), conflictingEventIds(), draftOverlapsExisting(), rangesOverlap(), SCHEDULING_CONFLICT_MESSAGE

### Community 1 - "Ponytail"
Cohesion: 0.40
Nodes (4): Persistence, Ponytail, Rules, The ladder

### Community 2 - "WeCalendar — Full Project Context"
Cohesion: 0.04
Nodes (46): 10. Shared Lists / Tasks, 11. Calendar Interactions, 12. CI Pipeline, 13. What's Done vs. Pending, 14. Development Commands, 15. Key Design Decisions, 1. What Is WeCalendar?, 2. Tech Stack (+38 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (31): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+23 more)

### Community 4 - "AppShell.tsx"
Cohesion: 0.06
Nodes (68): AppShell(), Group, NoteEditor(), NoteEditorProps, Commands, CustomBullet, LineHeight, @tiptap/core (+60 more)

### Community 5 - "WeCalendar"
Cohesion: 0.07
Nodes (25): Apply the migration, Option A — Supabase Dashboard (simplest), Option B — Supabase CLI, Out of scope (later phases), RPCs (use these from the app), Security, Smoke test (after auth exists), Tables (+17 more)

### Community 6 - "Sidebar.tsx"
Cohesion: 0.08
Nodes (23): GET(), Group, SharedWorkspace(), SharedWorkspaceProps, MiniCalendar(), MiniCalendarProps, WEEKDAYS, dropTargetStyle() (+15 more)

### Community 7 - "20260730120000_init_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 8 - "20260806140000_bootstrap_schema.sql"
Cohesion: 0.14
Nodes (18): events_set_updated_at, groups_set_updated_at, list_items_set_updated_at, lists_set_updated_at, on_auth_user_created, profiles_set_updated_at, public.events, public.group_members (+10 more)

### Community 9 - "dependencies"
Cohesion: 0.04
Nodes (45): framer-motion, next, dependencies, framer-motion, html2canvas, next, react, react-dom (+37 more)

### Community 10 - "devDependencies"
Cohesion: 0.06
Nodes (32): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+24 more)

### Community 11 - "Navbar.tsx"
Cohesion: 0.07
Nodes (24): CALENDAR_VIEWS, CalendarSettingsSection(), ProfilePage(), formatAuthError(), LoginForm(), Mode, APPLE_ACCENTS, loadRecentColors() (+16 more)

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

### Community 34 - "events.ts"
Cohesion: 0.06
Nodes (59): Calendar(), CalendarProps, barEdges(), barRadius(), CalendarCell(), CalendarCellProps, conflictBarShadow(), conflictOutline() (+51 more)

### Community 36 - "theme.ts"
Cohesion: 0.39
Nodes (7): applyTheme(), DEFAULT_ACCENT, getSystemTheme(), loadAccent(), loadTheme(), ThemeMode, useTheme()

### Community 40 - "calendar.ts"
Cohesion: 0.12
Nodes (35): CreateEventModal(), CreateEventModalContent(), CreateEventModalProps, DayPicker(), DayPickerProps, EventDraft, groupConsecutiveDates(), PICKER_DAYS (+27 more)

### Community 41 - "NoteToolbar.tsx"
Cohesion: 0.13
Nodes (9): BULLET_PRESETS, COLORS, FONT_OPTIONS, HIGHLIGHT_COLORS, LINE_SPACING_OPTIONS, normalizeHref(), NoteToolbar(), NoteToolbarProps (+1 more)

### Community 43 - "Animation Recipes"
Cohesion: 0.06
Nodes (30): Accordion / collapse, Animation Recipes, Button press, Drag to dismiss, Drawer / sheet, Dropdown, popover, menu, select, Hold to confirm, Masking a crossfade that won't settle (+22 more)

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

### Community 54 - "Working With Sonner"
Cohesion: 0.17
Nodes (10): Functions, Sonner API Reference, `toast()` options, `<Toaster />`, Picking the right call, Recipes, Setup, Styling — the escalation ladder (+2 more)

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

### Community 68 - "ConflictToast.tsx"
Cohesion: 0.50
Nodes (3): ConflictToast(), ConflictToastItem, ConflictToastProps

## Knowledge Gaps
- **459 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+454 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Navbar.tsx` to `AppShell.tsx`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `Tag` connect `events.ts` to `calendar.ts`, `AppShell.tsx`, `Sidebar.tsx`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _459 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WeCalendar — Full Project Context` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `AppShell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.057711950970377936 - nodes in this community are weakly interconnected._