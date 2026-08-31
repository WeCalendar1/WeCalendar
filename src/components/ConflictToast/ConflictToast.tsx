"use client";

import { useState } from "react";

export type ConflictToastItem = {
  key: string;
  title: string;
  color: string;
};

type ConflictToastProps = {
  open: boolean;
  items: ConflictToastItem[];
  hiddenKeys: ReadonlySet<string>;
  onDismiss: () => void;
  onHideHighlights: () => void;
  onToggleHidden: (key: string) => void;
  onSetHiddenKeys: (keys: Set<string>) => void;
};

const PREVIEW_COUNT = 3;

export function ConflictToast({
  open,
  items,
  hiddenKeys,
  onDismiss,
  onHideHighlights,
  onToggleHidden,
  onSetHiddenKeys,
}: ConflictToastProps) {
  const [expanded, setExpanded] = useState(false);
  const [managing, setManaging] = useState(false);
  const [minimized, setMinimized] = useState(false);

  if (!open) return null;

  const visibleCount = items.length;
  const preview = expanded || managing ? items : items.slice(0, PREVIEW_COUNT);
  const extra = items.length - PREVIEW_COUNT;

  /* ── Minimized bubble ── */
  if (minimized) {
    return (
      <button
        type="button"
        aria-label="Expand scheduling conflict panel"
        onClick={() => setMinimized(false)}
        className="fixed top-16 right-3 z-50 flex h-10 w-10 items-center justify-center sm:right-4"
        style={{
          borderRadius: "var(--radius-full)",
          background: "#dc2626",
          boxShadow: "0 2px 10px rgb(220 38 38 / 45%), var(--shadow-md)",
          border: "2px solid #fff",
          color: "#fff",
          fontSize: "1.1rem",
          fontWeight: 700,
          lineHeight: 1,
          cursor: "pointer",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 16px rgb(220 38 38 / 55%), var(--shadow-md)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 2px 10px rgb(220 38 38 / 45%), var(--shadow-md)";
        }}
      >
        !
      </button>
    );
  }

  /* ── Full panel ── */
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 right-3 z-50 w-[min(100%-1.5rem,22rem)] p-3 sm:right-4"
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1.5px solid #fca5a5",
        background: "var(--surface)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Header row with title + minimize button */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold" style={{ color: "#b91c1c" }}>
          Scheduling conflict
        </p>
        <button
          type="button"
          aria-label="Minimize scheduling conflict panel"
          onClick={() => setMinimized(true)}
          className="flex h-5 w-5 shrink-0 items-center justify-center"
          style={{
            borderRadius: "var(--radius-full)",
            border: "1.5px solid #fca5a5",
            background: "transparent",
            color: "#b91c1c",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 700,
            lineHeight: 1,
            transition: "background 0.12s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          −
        </button>
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
        {visibleCount === 1
          ? "1 event overlaps another on the calendar."
          : `${visibleCount} events overlap on the calendar.`}
      </p>

      {preview.length > 0 && (
        <ul className="mt-2 max-h-48 space-y-1 overflow-auto">
          {preview.map((item) => {
            const hidden = hiddenKeys.has(item.key);
            return (
              <li key={item.key} className="flex items-center gap-2 text-xs font-medium">
                {managing ? (
                  <input
                    type="checkbox"
                    checked={!hidden}
                    onChange={() => onToggleHidden(item.key)}
                    aria-label={`Highlight ${item.title}`}
                    className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#dc2626]"
                  />
                ) : null}
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: item.color,
                    opacity: hidden ? 0.35 : 1,
                    boxShadow: "0 0 0 1px rgb(0 0 0 / 12%)",
                  }}
                  aria-hidden
                />
                <span
                  className="min-w-0 flex-1 truncate"
                  style={{
                    color: hidden ? "var(--text-muted)" : "var(--foreground)",
                    textDecoration: hidden ? "line-through" : "none",
                  }}
                >
                  {item.title}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {!managing && !expanded && extra > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1.5 cursor-pointer text-xs font-semibold"
          style={{ color: "var(--accent)" }}
        >
          See more (+{extra})
        </button>
      )}

      {managing && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSetHiddenKeys(new Set())}
            className="cursor-pointer text-[11px] font-semibold"
            style={{ color: "var(--accent)" }}
          >
            Show all
          </button>
          <button
            type="button"
            onClick={() => onSetHiddenKeys(new Set(items.map((i) => i.key)))}
            className="cursor-pointer text-[11px] font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            Hide all
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="cursor-pointer px-2.5 py-1 text-xs font-semibold"
          style={{
            borderRadius: "var(--radius-md)",
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={onHideHighlights}
          className="cursor-pointer px-2.5 py-1 text-xs font-semibold"
          style={{
            borderRadius: "var(--radius-md)",
            border: "1.5px solid #fca5a5",
            background: "#fff5f5",
            color: "#b91c1c",
          }}
        >
          Hide highlights
        </button>
        <button
          type="button"
          onClick={() => {
            setManaging((prev) => !prev);
            if (!managing) setExpanded(true);
          }}
          className="cursor-pointer px-2.5 py-1 text-xs font-semibold"
          style={{
            borderRadius: "var(--radius-md)",
            border: "1.5px solid var(--border)",
            background: managing ? "var(--accent-muted)" : "transparent",
            color: managing ? "var(--accent-text)" : "var(--text-secondary)",
          }}
        >
          {managing ? "Done" : "Manage"}
        </button>
      </div>
    </div>
  );
}
