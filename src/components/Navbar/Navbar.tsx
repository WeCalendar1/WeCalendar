import Link from "next/link";
import type { ReactNode } from "react";
import type { CalendarMode, ScreenView } from "@/lib/calendar";

type NavbarProps = {
  monthLabel: string;
  calendarMode: CalendarMode;
  screenView: ScreenView;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCalendarModeChange: (mode: CalendarMode) => void;
  onScreenViewChange: (view: ScreenView) => void;
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
  onToggleSidebar,
  onToday,
  onPrev,
  onNext,
  onCalendarModeChange,
  onScreenViewChange,
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
              aria-label={`${label} month`}
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

      {/* Right: mode picker + view switcher + avatar */}
      <div className="flex items-center gap-2">
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

        <Link
          href="/profile"
          className="btn-bounce flex h-8 w-8 cursor-pointer items-center justify-center text-sm font-semibold"
          aria-label="Go to profile"
          title="Profile"
          style={{
            borderRadius: "var(--radius-full)",
            background: "var(--accent-muted)",
            color: "var(--accent-text)",
            fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
            transition: "all var(--transition-base)",
          }}
        >
          M
        </Link>
      </div>
    </header>
  );
}
