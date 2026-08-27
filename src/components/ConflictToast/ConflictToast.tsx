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

  if (!open) return null;

  const visibleCount = items.length;
  const preview = expanded || managing ? items : items.slice(0, PREVIEW_COUNT);
  const extra = items.length - PREVIEW_COUNT;

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
      <p className="text-sm font-semibold" style={{ color: "#b91c1c" }}>
        Scheduling conflict
      </p>
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
