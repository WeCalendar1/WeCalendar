# WeCalendar — project context

Short status doc for teammates / future sessions. Last updated: Aug 2026.

## What was worked on

- Project README / outline (problem, scope, architecture, features)
- Phase 1 scaffolding: Next.js + Supabase client setup, early README/docs
- Phase 2: schema migrations, applying SQL in Supabase, fixing migration history (`schema_migrations`), bootstrap when `profiles` was missing
- Env setup (`.env` URL + anon key); diagnosing signup `{}` / HTTP 500 (`Database error saving new user`)
- Supabase Preview PR check failure (`profiles already exists`) — marked migration as applied
- Calendar **day / week / year** views (prev/next/today mode-aware)
- **Account creation / auth**: login & signup UI, session gating, profile load/save, sign out
- **Shared calendar sync**: create workspace, invite code, join between two accounts, create event, realtime refresh
- PR / merge conflict resolution on profile + AppShell (keep `dev` auth over `main` stubs)
- This context doc (`docs/CONTEXT.md`)

## What this app is

Shared calendar + notes for small groups (couples, roommates, etc.). Users join a **shared workspace** via invite code and see the same events.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind |
| Auth / DB / realtime | Supabase |
| Hosting | Vercel (planned) |

Env (local only, never commit):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (prefer legacy `eyJ...` anon JWT)

## What’s done

### Phase 1 — Scaffold + calendar UI
- Next.js app, Supabase client helpers, landing/login stubs (later replaced)
- Full calendar shell: navbar, sidebar, month/day/week/year views
- Tag filters + search UI (search filters event titles; tags not backed by DB yet)

### Phase 2 — Schema
- Tables: `profiles`, `groups`, `group_members`, `events`, `lists`, `list_items`
- RLS + RPCs: `create_group()`, `join_group_by_invite()`
- Profile auto-created on signup (trigger)
- Docs: `docs/schema.md`
- Migrations under `supabase/migrations/`
- **Important:** If signup fails with `Database error saving new user` / missing `profiles`, run `supabase/migrations/20260806140000_bootstrap_schema.sql` in the SQL Editor

### Phase 3 — Auth
- `/login` — create account + sign in (email/password)
- `/auth/callback` — email confirm exchange
- Proxy protects routes; signed-out users → `/login`
- Profile page loads/saves profile; sign out works
- Navbar shows user initials

### Shared sync (in progress / needs testing)
- Sidebar **Shared calendar**: create workspace, copy invite code, join by code
- **Create Event** saves to active group
- Events show on day / week / month
- Realtime subscription refreshes events when the other member adds one
- Commit note: further testing once activities are solid

## How two accounts sync

1. User A creates a workspace → copies invite code  
2. User B joins with that code  
3. Either user creates an event → both see it (same `group_id`)

This is **not** Google/Outlook sync; it’s WeCalendar shared workspaces.

## Key paths

```
src/app/login/          Auth UI
src/app/profile/        Profile + sign out
src/app/auth/callback/  OAuth/email code exchange
src/components/AppShell/          Main app state (user, groups, events)
src/components/SharedWorkspace/   Create / join / invite
src/components/CreateEventModal/  New shared event
src/lib/supabase/       Browser, server, proxy clients
src/types/database.ts   DB TypeScript types
supabase/migrations/    SQL schema
docs/schema.md          Schema apply guide
```

## Supabase Auth checklist (local)

1. Authentication → Providers → Email enabled  
2. For local testing: Confirm email **off** (optional but easier)  
3. URL config: Site URL `http://localhost:3000`, redirect `http://localhost:3000/auth/callback`

## Not done yet / next ideas

- Lists modules (grocery / todo / wishlist) UI
- Conflict detection beyond schema flag
- Day/week/year polish + editing/deleting events
- Nudges / notifications
- Google/Outlook sync (optional)
- Tag filters backed by real event categories

## Branch note

Primary work happens on `dev`. Prefer `git pull` before `git push` if remote moved (e.g. after a PR merge). For profile-page merge conflicts vs `main`, keep **`dev`** (auth-wired) over `main` stubs.
