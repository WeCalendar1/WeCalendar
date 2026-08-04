"use client";

import { MiniCalendar } from "./MiniCalendar";

type SidebarProps = {
  open: boolean;
  viewDate: Date;
  onCreateEvent: () => void;
};

export function Sidebar({ open, viewDate, onCreateEvent }: SidebarProps) {
  return (
    <aside
      className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${
        open ? "w-64" : "w-0"
      }`}
      aria-hidden={!open}
      style={{
        borderRight: open ? "1.5px solid var(--border)" : "none",
        background: "var(--surface)",
      }}
    >
      <div className="flex h-full w-64 flex-col gap-4 p-4 animate-fade-in">
        {/* Create Event button */}
        <button
          type="button"
          onClick={onCreateEvent}
          className="btn-bounce flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white"
          style={{
            borderRadius: "var(--radius-xl)",
            background: "var(--accent)",
            boxShadow: "var(--shadow-md)",
            transition: "all var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--accent)";
          }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Event
        </button>

        {/* Mini calendar */}
        <MiniCalendar viewDate={viewDate} />

        {/* Widgets placeholder */}
        <div className="flex flex-1 flex-col gap-2">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Widgets
          </p>
          <div
            className="rounded-2xl p-4 text-sm"
            style={{
              border: "1.5px dashed var(--border)",
              background: "var(--surface-2)",
              color: "var(--text-secondary)",
            }}
          >
            Shared lists, reminders, and modules coming soon.
          </div>
        </div>
      </div>
    </aside>
  );
}
