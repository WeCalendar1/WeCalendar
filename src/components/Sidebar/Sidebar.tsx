"use client";

import { MiniCalendar } from "./MiniCalendar";

// ─── Tag definitions ─────────────────────────────────────────────────────────

export type Tag = {
  id: string;
  label: string;
  color: string; // hex
};

const DEFAULT_TAGS: Tag[] = [
  { id: "personal",   label: "Personal",   color: "#6366f1" },
  { id: "work",       label: "Work",       color: "#0ea5e9" },
  { id: "birthdays",  label: "Birthdays",  color: "#f43f5e" },
  { id: "holidays",   label: "Holidays",   color: "#f59e0b" },
  { id: "reminders",  label: "Reminders",  color: "#10b981" },
  { id: "shared",     label: "Shared",     color: "#8b5cf6" },
];

// ─── Props ───────────────────────────────────────────────────────────────────

type SidebarProps = {
  open: boolean;
  viewDate: Date;
  onCreateEvent: () => void;
  activeTagIds: string[];
  onTagToggle: (id: string) => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Sidebar({
  open,
  viewDate,
  onCreateEvent,
  activeTagIds,
  onTagToggle,
}: SidebarProps) {
  const allOn = activeTagIds.length === DEFAULT_TAGS.length;

  function toggleAll() {
    if (allOn) {
      DEFAULT_TAGS.forEach((t) => {
        if (activeTagIds.includes(t.id)) onTagToggle(t.id);
      });
    } else {
      DEFAULT_TAGS.forEach((t) => {
        if (!activeTagIds.includes(t.id)) onTagToggle(t.id);
      });
    }
  }

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

        {/* ── Tag Filters ─────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Filters
            </p>
            <button
              type="button"
              onClick={toggleAll}
              className="cursor-pointer text-xs font-semibold"
              style={{
                color: "var(--accent)",
                transition: "opacity var(--transition-fast)",
              }}
            >
              {allOn ? "Clear all" : "Select all"}
            </button>
          </div>

          <div
            className="flex flex-col gap-1 overflow-hidden p-2"
            style={{
              borderRadius: "var(--radius-xl)",
              border: "1.5px solid var(--border)",
              background: "var(--surface-2)",
            }}
          >
            {DEFAULT_TAGS.map((tag) => {
              const active = activeTagIds.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  htmlFor={`tag-${tag.id}`}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-medium"
                  style={{
                    transition: "background var(--transition-fast)",
                    background: active ? `${tag.color}18` : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = `${tag.color}18`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = active
                      ? `${tag.color}18`
                      : "transparent";
                  }}
                >
                  {/* Custom checkbox */}
                  <span
                    className="relative flex h-4 w-4 shrink-0 items-center justify-center"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      border: active ? "none" : `2px solid ${tag.color}`,
                      background: active ? tag.color : "transparent",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    {active && (
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </span>
                  <input
                    id={`tag-${tag.id}`}
                    type="checkbox"
                    checked={active}
                    onChange={() => onTagToggle(tag.id)}
                    className="sr-only"
                  />
                  {/* Color dot */}
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: tag.color }}
                  />
                  <span style={{ color: "var(--foreground)" }}>{tag.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
