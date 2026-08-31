"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent } from "@/lib/events";
import {
  filterAndGroupEventsForPicker,
  formatEventPickerTimeRange,
  formatLinkedEventLabel,
} from "@/lib/eventPicker";

type NotesLinkEventDialogProps = {
  open: boolean;
  events: CalendarEvent[];
  selectedEventId: string | null;
  busy?: boolean;
  onClose: () => void;
  onSelect: (eventId: string | null) => void | Promise<void>;
};

export function NotesLinkEventDialog({
  open,
  events,
  selectedEventId,
  busy = false,
  onClose,
  onSelect,
}: NotesLinkEventDialogProps) {
  const [titleQuery, setTitleQuery] = useState("");
  const [onOrAfterDate, setOnOrAfterDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitleQuery("");
    setOnOrAfterDate("");
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const groups = useMemo(
    () =>
      filterAndGroupEventsForPicker(events, {
        titleQuery,
        onOrAfterDate: onOrAfterDate || null,
      }),
    [events, titleQuery, onOrAfterDate],
  );

  const totalMatches = useMemo(
    () => groups.reduce((count, group) => count + group.events.length, 0),
    [groups],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgb(15 23 42 / 0.35)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-link-event-title"
        className="flex w-full max-w-md flex-col"
        style={{
          borderRadius: "var(--radius-xl)",
          background: "var(--surface)",
          boxShadow: "var(--shadow-lg)",
          border: "1.5px solid var(--border)",
          maxHeight: "min(85vh, 36rem)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <h2
            id="notes-link-event-title"
            className="text-lg font-semibold"
            style={{
              color: "var(--foreground)",
              fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
            }}
          >
            Link to event
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Search and filter workspace events, grouped by date.
          </p>

          <div className="mt-3 space-y-2">
            <input
              autoFocus
              type="search"
              value={titleQuery}
              onChange={(e) => setTitleQuery(e.target.value)}
              placeholder="Search by title…"
              className="w-full px-3 py-2 text-sm outline-none"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
                background: "var(--surface)",
              }}
            />
            <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              On or after
              <input
                type="date"
                value={onOrAfterDate}
                onChange={(e) => setOnOrAfterDate(e.target.value)}
                className="min-w-0 flex-1 px-2 py-1.5 text-sm font-medium outline-none"
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--border)",
                  color: "var(--foreground)",
                  background: "var(--surface)",
                }}
              />
              {onOrAfterDate && (
                <button
                  type="button"
                  onClick={() => setOnOrAfterDate("")}
                  className="cursor-pointer text-xs font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  Clear
                </button>
              )}
            </label>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onSelect(null)}
            className="mb-2 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium disabled:opacity-60"
            style={{
              background: selectedEventId === null ? "var(--accent-muted)" : "var(--surface-2)",
              color: selectedEventId === null ? "var(--accent)" : "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: "var(--text-muted)" }}
              aria-hidden
            />
            No linked event
          </button>

          {totalMatches === 0 ? (
            <p className="px-2 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No events match your filters.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.dateKey} className="mb-3">
                <p
                  className="sticky top-0 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
                  style={{
                    color: "var(--text-muted)",
                    background: "var(--surface)",
                  }}
                >
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.events.map((event) => {
                    const selected = selectedEventId === event.id;
                    return (
                      <li key={event.id}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void onSelect(event.id)}
                          className="flex w-full cursor-pointer items-start gap-2 rounded-lg px-3 py-2 text-left disabled:opacity-60"
                          style={{
                            background: selected ? "var(--accent-muted)" : "transparent",
                            color: selected ? "var(--accent-text)" : "var(--foreground)",
                          }}
                        >
                          <span
                            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              background: "var(--accent)",
                              boxShadow: "0 0 0 1px rgb(0 0 0 / 12%)",
                            }}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{event.title}</span>
                            <span className="block text-xs" style={{ color: "var(--text-secondary)" }}>
                              {formatEventPickerTimeRange(event)}
                            </span>
                          </span>
                          {selected && (
                            <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--accent)" }}>
                              Linked
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer px-4 py-2 text-sm font-semibold disabled:opacity-60"
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1.5px solid var(--border)",
              color: "var(--foreground)",
              background: "var(--surface)",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export { formatLinkedEventLabel };
