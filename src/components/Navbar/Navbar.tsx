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
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: "map",
    label: "Map",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
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
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={sidebarOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white shadow-sm">
            W
          </span>
          <span className="hidden text-lg font-semibold tracking-tight text-foreground sm:inline">
            WeCalendar
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center gap-2 sm:justify-start sm:pl-4">
        <button
          type="button"
          onClick={onToday}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-stone-50"
        >
          Today
        </button>

        <div className="flex items-center">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {monthLabel}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="calendar-mode">
          Calendar mode
        </label>
        <select
          id="calendar-mode"
          value={calendarMode}
          onChange={(e) => onCalendarModeChange(e.target.value as CalendarMode)}
          className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm font-medium text-foreground shadow-sm"
        >
          {MODES.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label}
            </option>
          ))}
        </select>

        <div
          className="flex items-center rounded-lg border border-border bg-stone-50 p-0.5 shadow-sm"
          role="group"
          aria-label="Screen view"
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
                className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                  active
                    ? "bg-surface text-accent shadow-sm"
                    : "text-stone-500 hover:text-foreground"
                }`}
              >
                {screen.icon}
              </button>
            );
          })}
        </div>

        <div
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent"
          aria-label="Profile"
          title="Profile"
        >
          M
        </div>
      </div>
    </header>
  );
}
