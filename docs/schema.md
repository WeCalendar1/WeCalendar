# WeCalendar schema (Phase 2)

Versioned SQL lives in `supabase/migrations/`. Apply it to your Supabase project before building auth or events UI.

## Apply the migration

### Option A — Supabase Dashboard (simplest)

1. Open your project → **SQL Editor**
2. Paste the contents of `supabase/migrations/20260730120000_init_schema.sql`
3. Run the script
4. Confirm tables under **Table Editor**: `profiles`, `groups`, `group_members`, `events`, `lists`, `list_items`

### Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Project ref is the subdomain in your URL: `https://<project-ref>.supabase.co`.

## Tables

| Table | Purpose |
| --- | --- |
| `profiles` | App user profile (1:1 with `auth.users`) |
| `groups` | Shared workspace + invite code |
| `group_members` | User ↔ group membership (`owner` / `member`) |
| `events` | Calendar events for a group |
| `lists` | Collaborative list modules |
| `list_items` | Items on a list (checked state, sort order) |

```
auth.users
    └── profiles
            ├── groups (created_by)
            │     └── group_members
            │     └── events
            │     └── lists
            │           └── list_items
```

## RPCs (use these from the app)

| Function | What it does |
| --- | --- |
| `create_group(p_name)` | Creates a group, generates invite code, adds caller as `owner` |
| `join_group_by_invite(p_invite_code)` | Adds caller as `member` |

Do **not** insert into `groups` / `group_members` directly from the client for create/join — use these functions so RLS stays consistent.

## Security

- RLS is enabled on all public tables
- Members only see data for groups they belong to
- `create_group` / `join_group_by_invite` / membership checks are `security definer` helpers
- New signups automatically get a `profiles` row via trigger on `auth.users`

## Smoke test (after auth exists)

1. Sign up two users
2. As user A: `select public.create_group('Test household');`
3. Copy `invite_code` from the result
4. As user B: `select public.join_group_by_invite('<code>');`
5. Insert an event as A; confirm B can `select` it
6. Confirm a third user **cannot** see that group’s events

## TypeScript types

Hand-maintained types: `src/types/database.ts`.

After schema changes, either update that file or regenerate:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
```

## Out of scope (later phases)

- Auth UI / session gating
- Event create modal wired to `events`
- Realtime UI subscriptions (tables are already added to `supabase_realtime`)
