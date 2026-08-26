"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { CalendarMode, ScreenView } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/client";

type NavbarProps = {
  monthLabel: string;
  calendarMode: CalendarMode;
  screenView: ScreenView;
  sidebarOpen: boolean;
  searchQuery: string;
  userInitials: string;
  onToggleSidebar: () => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCalendarModeChange: (mode: CalendarMode) => void;
  onScreenViewChange: (view: ScreenView) => void;
  onSearchChange: (query: string) => void;
};

const MODES: { id: CalendarMode; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

const SCREENS: { id: ScreenView; label: string; icon: ReactNode }[] = [
  {
    id: "calendar",
    label: "Calendar",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: "map",
    label: "Map",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
        <path d="M9 3v15M15 6v15" />
      </svg>
    ),
  },
];

export function Navbar({
  monthLabel,
  calendarMode,
  screenView,
  sidebarOpen,
  searchQuery,
  userInitials,
  onToggleSidebar,
  onToday,
  onPrev,
  onNext,
  onCalendarModeChange,
  onScreenViewChange,
  onSearchChange,
}: NavbarProps) {
  return (
    <header
      className="flex h-14 shrink-0 items-center gap-3 px-3 sm:px-4"
      style={{
        background: "var(--surface)",
        borderBottom: "1.5px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Left: hamburger + logo */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={sidebarOpen}
          className="btn-bounce flex h-9 w-9 cursor-pointer items-center justify-center"
          style={{
            borderRadius: "var(--radius-md)",
            color: "var(--text-secondary)",
            transition: "background var(--transition-base), color var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--accent-muted)";
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-white"
            style={{
              borderRadius: "var(--radius-md)",
              background: "var(--accent)",
              boxShadow: "var(--shadow-sm)",
              fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
            }}
          >
            W
          </span>
          <span
            className="hidden text-lg tracking-tight sm:inline"
            style={{
              fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
              fontWeight: 400,
              color: "var(--foreground)",
            }}
          >
            WeCalendar
          </span>
        </div>
      </div>

      {/* Center: navigation controls */}
      <div className="flex flex-1 items-center justify-center gap-2 sm:justify-start sm:pl-4">
        <button
          type="button"
          onClick={onToday}
          className="btn-bounce cursor-pointer px-3 py-1.5 text-sm font-semibold"
          style={{
            borderRadius: "var(--radius-full)",
            border: "1.5px solid var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
            boxShadow: "var(--shadow-sm)",
            transition: "all var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--accent-muted)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--surface)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
          }}
        >
          Today
        </button>

        <div className="flex items-center gap-0.5">
          {[
            { onClick: onPrev, label: "Previous", path: "M15 6l-6 6 6 6" },
            { onClick: onNext, label: "Next", path: "M9 6l6 6-6 6" },
          ].map(({ onClick, label, path }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              aria-label={label}
              className="btn-bounce flex h-8 w-8 cursor-pointer items-center justify-center"
              style={{
                borderRadius: "var(--radius-md)",
                color: "var(--text-secondary)",
                transition: "background var(--transition-base), color var(--transition-base)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--accent-muted)";
                (e.currentTarget as HTMLElement).style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={path} />
              </svg>
            </button>
          ))}
        </div>

        <h1
          className="truncate text-base font-semibold tracking-tight sm:text-lg"
          style={{ color: "var(--foreground)" }}
        >
          {monthLabel}
        </h1>
      </div>

      {/* Right: search + mode picker + view switcher + avatar */}
      <div className="flex items-center gap-2">
        {/* Search bar */}
        <div
          className="hidden items-center gap-2 sm:flex"
          style={{
            borderRadius: "var(--radius-full)",
            border: "1.5px solid var(--border)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-sm)",
            padding: "0 12px",
            transition: "border-color var(--transition-base), box-shadow var(--transition-base)",
          }}
          onFocusCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px var(--accent-muted)";
          }}
          onBlurCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
          }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            id="calendar-search"
            type="search"
            placeholder="Search events…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-36 bg-transparent text-sm font-medium outline-none lg:w-48"
            style={{ color: "var(--foreground)" }}
            aria-label="Search events"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="cursor-pointer"
              style={{ color: "var(--text-muted)", lineHeight: 1 }}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <label className="sr-only" htmlFor="calendar-mode">
          Calendar mode
        </label>
        <select
          id="calendar-mode"
          value={calendarMode}
          onChange={(e) => onCalendarModeChange(e.target.value as CalendarMode)}
          className="cursor-pointer px-2.5 py-1.5 text-sm font-semibold"
          style={{
            borderRadius: "var(--radius-full)",
            border: "1.5px solid var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
            boxShadow: "var(--shadow-sm)",
            outline: "none",
          }}
        >
          {MODES.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label}
            </option>
          ))}
        </select>

        <div
          className="flex items-center p-1"
          role="group"
          aria-label="Screen view"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {SCREENS.map((screen) => {
            const active = screenView === screen.id;
            return (
              <button
                key={screen.id}
                type="button"
                onClick={() => onScreenViewChange(screen.id)}
                aria-label={screen.label}
                aria-pressed={active}
                className="btn-bounce flex h-8 w-8 cursor-pointer items-center justify-center"
                style={{
                  borderRadius: "var(--radius-md)",
                  transition: "all var(--transition-base)",
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "#fff" : "var(--text-secondary)",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                }}
              >
                {screen.icon}
              </button>
            );
          })}
        </div>

        <ProfileMenu userInitials={userInitials} />
      </div>
    </header>
  );
}

function ProfileMenu({ userInitials }: { userInitials: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Account"
        className="btn-bounce flex h-8 w-8 cursor-pointer items-center justify-center text-sm font-semibold"
        style={{
          borderRadius: "var(--radius-full)",
          background: "var(--accent-muted)",
          color: "var(--accent-text)",
          fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
          transition: "all var(--transition-base)",
        }}
      >
        {userInitials}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden py-1"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1.5px solid var(--border)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--foreground)" }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-[#fff0f0] disabled:opacity-50"
            style={{ color: "#dc2626" }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
