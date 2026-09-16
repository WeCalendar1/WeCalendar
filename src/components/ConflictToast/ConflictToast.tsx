"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";

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

/** Default list shows one item — scanning many titles is itself a choice cost (Hick's). */
const DEFAULT_PREVIEW = 1;

/**
 * Arranged by Hick's Law: decision time grows with visible choices.
 * Default surface exposes one primary action (Dismiss) + one overflow.
 * Secondary tasks (hide highlights, per-event manage) use progressive disclosure.
 */
export function ConflictToast({
  open,
  items,
  hiddenKeys,
  onDismiss,
  onHideHighlights,
  onToggleHidden,
  onSetHiddenKeys,
}: ConflictToastProps) {
  const [listOpen, setListOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const visibleCount = items.length;
  const preview = listOpen || managing ? items : items.slice(0, DEFAULT_PREVIEW);
  const hiddenExtra = Math.max(items.length - DEFAULT_PREVIEW, 0);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setListOpen(false);
      setManaging(false);
      setMoreOpen(false);
      setMinimized(false);
    }
  }

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!moreMenuRef.current?.contains(event.target as Node)) setMoreOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  function enterManage() {
    setMoreOpen(false);
    setManaging(true);
    setListOpen(true);
  }

  function exitManage() {
    setManaging(false);
  }

  function handleHideHighlights() {
    setMoreOpen(false);
    onHideHighlights();
  }

  return (
    <AnimatePresence>
      {open && (
        <div ref={constraintsRef} className="pointer-events-none fixed inset-0 z-50">
          {minimized ? (
            <motion.button
              key="conflict-bubble"
              type="button"
              aria-label="Expand scheduling conflict panel. Drag to move."
              title="Drag to move · Click to expand"
              onClick={() => setMinimized(false)}
              drag
              dragConstraints={constraintsRef}
              dragMomentum={false}
              dragElastic={0.12}
              style={{
                x,
                y,
                borderRadius: "var(--radius-full)",
                background: "var(--color-danger)",
                boxShadow: "var(--shadow-md)",
                border: "2px solid var(--surface)",
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: 700,
                lineHeight: 1,
                cursor: "grab",
              }}
              whileDrag={{ cursor: "grabbing", scale: 1.05 }}
              className="pressable pointer-events-auto absolute top-16 right-3 flex h-9 w-9 items-center justify-center sm:right-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            >
              !
            </motion.button>
          ) : (
            <motion.div
              key="conflict-panel"
              role="status"
              aria-live="polite"
              aria-label="Scheduling conflict panel. Drag the header to move."
              drag
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={constraintsRef}
              dragMomentum={false}
              dragElastic={0.12}
              className="glass-heavy pointer-events-auto absolute top-16 right-3 w-[min(100%-1.5rem,20rem)] overflow-hidden p-3.5 sm:right-4"
              style={{
                x,
                y,
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-menu)",
              }}
              initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
              transition={{ type: "spring", bounce: 0, duration: 0.32 }}
            >
              <div
                className="flex cursor-grab items-center justify-between gap-2 active:cursor-grabbing"
                onPointerDown={(event) => {
                  if ((event.target as HTMLElement).closest("[data-no-drag]")) return;
                  dragControls.start(event);
                }}
                title="Drag to move"
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: "var(--color-danger)" }}
                    aria-hidden
                  >
                    !
                  </span>
                  <p
                    className="truncate text-xs font-semibold"
                    style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
                  >
                    Scheduling conflict
                  </p>
                </div>
                <button
                  type="button"
                  data-no-drag
                  aria-label="Minimize scheduling conflict panel"
                  onClick={() => setMinimized(true)}
                  className="pressable flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                  }}
                >
                  −
                </button>
              </div>

              {/* Status only — not a choice */}
              <p className="mt-1.5 text-[11px] leading-snug" style={{ color: "var(--text-secondary)" }}>
                {visibleCount === 1
                  ? "1 event overlaps another."
                  : `${visibleCount} events overlap on the calendar.`}
              </p>

              {/* Compact list: one title by default */}
              {preview.length > 0 && (
                <ul className="mt-2.5 max-h-40 space-y-1 overflow-auto pr-0.5">
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
                          style={{ background: item.color, opacity: hidden ? 0.35 : 1 }}
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

              {!managing && !listOpen && hiddenExtra > 0 && (
                <button
                  type="button"
                  onClick={() => setListOpen(true)}
                  className="pressable mt-1.5 text-[11px] font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  And {hiddenExtra} more
                </button>
              )}

              {/* Manage mode: one binary batch control + Done */}
              {managing && (
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const allHidden = items.every((item) => hiddenKeys.has(item.key));
                      onSetHiddenKeys(allHidden ? new Set() : new Set(items.map((i) => i.key)));
                    }}
                    className="pressable text-[11px] font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    {items.every((item) => hiddenKeys.has(item.key)) ? "Show all" : "Hide all"}
                  </button>
                </div>
              )}

              {/*
                Default: 2 choices (Dismiss | More) — Hick's primary surface.
                Manage mode: Done replaces More (still 2 choices).
              */}
              <div
                className="relative mt-3 flex items-center gap-2 border-t pt-2.5"
                style={{ borderColor: "var(--separator)" }}
              >
                {managing ? (
                  <button
                    type="button"
                    onClick={exitManage}
                    className="pressable flex-1 px-3 py-1.5 text-xs font-semibold"
                    style={{
                      borderRadius: "var(--radius-md)",
                      background: "var(--accent)",
                      color: "#fff",
                    }}
                  >
                    Done
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onDismiss}
                      className="pressable flex-1 px-3 py-1.5 text-xs font-semibold"
                      style={{
                        borderRadius: "var(--radius-md)",
                        background: "var(--accent)",
                        color: "#fff",
                      }}
                    >
                      Dismiss
                    </button>

                    <div ref={moreMenuRef} className="relative shrink-0">
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={moreOpen}
                        aria-label="More conflict actions"
                        onClick={() => setMoreOpen((v) => !v)}
                        className="pressable flex h-8 w-8 items-center justify-center text-sm font-semibold"
                        style={{
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                          background: moreOpen ? "var(--accent-muted)" : "var(--surface)",
                          color: moreOpen ? "var(--accent)" : "var(--text-secondary)",
                        }}
                      >
                        ⋯
                      </button>

                      <AnimatePresence>
                        {moreOpen && (
                          <motion.div
                            role="menu"
                            aria-label="Conflict actions"
                            className="absolute bottom-full right-0 mb-1.5 min-w-[10.5rem] overflow-hidden py-1"
                            style={{
                              borderRadius: "var(--radius-md)",
                              background: "var(--glass-bg-heavy)",
                              backdropFilter: "var(--glass-blur)",
                              WebkitBackdropFilter: "var(--glass-blur)",
                              boxShadow: "var(--shadow-menu)",
                              transformOrigin: "bottom right",
                            }}
                            initial={{ opacity: 0, scale: 0.96, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 4 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.22 }}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={handleHideHighlights}
                              className="flex w-full cursor-pointer px-3 py-2 text-left text-xs font-medium"
                              style={{ color: "var(--color-danger)" }}
                            >
                              Hide highlights
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={enterManage}
                              className="flex w-full cursor-pointer px-3 py-2 text-left text-xs font-medium"
                              style={{ color: "var(--foreground)" }}
                            >
                              Manage highlights…
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
