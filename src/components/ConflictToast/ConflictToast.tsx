"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  const visibleCount = items.length;
  const preview = expanded || managing ? items : items.slice(0, PREVIEW_COUNT);
  const extra = items.length - PREVIEW_COUNT;

  return (
    <AnimatePresence>
      {open && (
        <>
          {minimized ? (
            /* Minimized bubble */
            <motion.button
              key="conflict-bubble"
              type="button"
              aria-label="Expand scheduling conflict panel"
              onClick={() => setMinimized(false)}
              className="pressable fixed top-16 right-3 z-50 flex h-9 w-9 items-center justify-center sm:right-4"
              style={{
                borderRadius: "var(--radius-full)",
                background: "var(--color-danger)",
                boxShadow: "var(--shadow-md)",
                border: "2px solid var(--surface)",
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: 700,
                lineHeight: 1,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            >
              !
            </motion.button>
          ) : (
            /* Full glass panel */
            <motion.div
              key="conflict-panel"
              role="status"
              aria-live="polite"
              className="glass-heavy fixed top-16 right-3 z-50 w-[min(100%-1.5rem,22rem)] overflow-hidden p-3.5 sm:right-4"
              style={{
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-menu)",
              }}
              initial={{ opacity: 0, scale: 0.96, y: -8, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, y: -8, filter: "blur(4px)" }}
              transition={{ type: "spring", bounce: 0, duration: 0.32 }}
            >
              {/* Header row with title + minimize button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: "var(--color-danger)" }}
                  >
                    !
                  </span>
                  <p className="text-xs font-semibold" style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}>
                    Scheduling Conflict
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Minimize scheduling conflict panel"
                  onClick={() => setMinimized(true)}
                  className="pressable flex h-5 w-5 items-center justify-center rounded-full"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                  }}
                >
                  −
                </button>
              </div>

              <p className="mt-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {visibleCount === 1
                  ? "1 event overlaps another on the calendar."
                  : `${visibleCount} events overlap on the calendar.`}
              </p>

              {preview.length > 0 && (
                <ul className="mt-2.5 max-h-44 space-y-1 overflow-auto pr-1">
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
                            className="h-3.5 w-3.5 shrink-0 accent-[var(--color-danger)]"
                          />
                        ) : null}
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            background: item.color,
                            opacity: hidden ? 0.35 : 1,
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
                  className="pressable mt-1.5 text-[11px] font-semibold"
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
                    className="pressable text-[11px] font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    Show all
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetHiddenKeys(new Set(items.map((i) => i.key)))}
                    className="pressable text-[11px] font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Hide all
                  </button>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-2.5" style={{ borderColor: "var(--separator)" }}>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="pressable px-2.5 py-1 text-xs font-medium"
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--foreground)",
                  }}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={onHideHighlights}
                  className="pressable px-2.5 py-1 text-xs font-medium"
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(255, 59, 48, 0.25)",
                    background: "rgba(255, 59, 48, 0.08)",
                    color: "var(--color-danger)",
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
                  className="pressable ml-auto px-2.5 py-1 text-xs font-medium"
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: managing ? "var(--accent-muted)" : "transparent",
                    color: managing ? "var(--accent-text)" : "var(--text-secondary)",
                  }}
                >
                  {managing ? "Done" : "Manage"}
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
