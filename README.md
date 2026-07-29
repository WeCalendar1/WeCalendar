# WeCalendar

A shared calendar and notes app focused on customizability and collaboration. WeCalendar gives groups a single, easy-to-view canvas for events, reminders, and flexible modules like grocery lists, to-dos, and wishlists.

## Problem

Scheduling and coordination often live across texts, screenshots, and scattered notes. WeCalendar centralizes that information so collaborators can see everyone’s schedule in one place, spot conflicts and gaps in time, and keep shared lists and reminders in sync.

## Scope

A responsive web app for desktop and mobile browsers, including:

- Secure user authentication
- Real-time sync for shared calendars
- Basic scheduling conflict detection
- Interactive collaborative modules (grocery lists, to-dos, wishlists)

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is fine)

### Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project URL and anon key (Project Settings → API).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start local development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |

## Architecture

| Layer | Choice | Role |
| --- | --- | --- |
| Frontend / UI | Next.js (App Router) | App UI, deployed on Vercel |
| Backend / Real-time | Supabase | Auth, database, row-level security, WebSocket updates |
| Object storage | AWS S3 (later) | Image uploads (wishlist items, event flyers) |

**Hosting:** Vercel for the web app initially; Supabase for accounts and data; AWS for media storage when needed.

### Data model (high level)

- **Users** — ID, display name, theme preferences
- **Groups / pairs** — relational links between user IDs for shared access
- **Events** — timestamp, description, group ID, conflict flags
- **Lists** — group ID, item state (checked/unchecked), category (grocery, wishlist, etc.)

## Project structure

```
src/
  app/                 # Next.js App Router pages
  lib/supabase/        # Browser, server, and middleware clients
  middleware.ts        # Session refresh for Supabase auth
```

## Main features

- **Secure authentication & grouping** — Sign in and link accounts via invite links or codes to create shared workspaces
- **Unified calendar canvas** — Aggregate all group members’ events; visualize conflicts and open time
- **Real-time collaborative modules** — Checkboxes and text fields for grocery lists, to-dos, and wishlists that sync across clients
- **Custom modules** — Add your own sections or lists beyond the defaults
- **Subtle notifications** — Low-pressure sync updates and “nudges” to request availability or flag schedule changes without heavy interrupt

## Optional features

- Deep UI customizability (templates, palettes, themes)
- Bi-directional sync with Google Calendar or Outlook
- Expense splitting module

## Tech stack

- **Frontend:** Next.js + TypeScript + Tailwind CSS + Vercel
- **Backend & auth:** Supabase (RLS + real-time)
- **Storage:** Amazon S3 (planned)
