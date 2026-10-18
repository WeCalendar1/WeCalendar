"use client";

import { useCallback, useRef, useState } from "react";

const STORAGE_KEY = "wecalendar.rightPanelWidth";
export const PANEL_DEFAULT_WIDTH = 380;
export const PANEL_MIN_WIDTH = 280;
const PANEL_MAX_WIDTH = 760;
const KEY_STEP = 24;

function clamp(width: number): number {
  // Never let the panel take more than 60% of the window, so the calendar stays usable.
  const max = typeof window === "undefined"
    ? PANEL_MAX_WIDTH
    : Math.min(PANEL_MAX_WIDTH, Math.floor(window.innerWidth * 0.6));
  return Math.round(Math.min(Math.max(width, PANEL_MIN_WIDTH), Math.max(max, PANEL_MIN_WIDTH)));
}

function loadWidth(): number {
  if (typeof window === "undefined") return PANEL_DEFAULT_WIDTH;
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? clamp(stored) : PANEL_DEFAULT_WIDTH;
}

/** Width (px) of the right-hand panel, persisted per browser. */
export function usePanelWidth() {
  const [width, setWidthState] = useState(loadWidth);

  const setWidth = useCallback((next: number, persist = false) => {
    const value = clamp(next);
    setWidthState(value);
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, String(value)); } catch { /* ignore */ }
    }
  }, []);

  return { width, setWidth };
}

interface PanelResizeHandleProps {
  width: number;
  onResize: (width: number, persist?: boolean) => void;
  onDraggingChange?: (dragging: boolean) => void;
}

/** Thin draggable divider that sits between the calendar and the right panel. */
export function PanelResizeHandle({ width, onResize, onDraggingChange }: PanelResizeHandleProps) {
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState(false);
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startWidth: width };
    setActive(true);
    onDraggingChange?.(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    // Panel is on the right, so dragging left makes it wider.
    onResize(drag.current.startWidth + (drag.current.startX - e.clientX));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    onResize(drag.current.startWidth + (drag.current.startX - e.clientX), true);
    drag.current = null;
    setActive(false);
    onDraggingChange?.(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); onResize(width + KEY_STEP, true); }
    if (e.key === "ArrowRight") { e.preventDefault(); onResize(width - KEY_STEP, true); }
    if (e.key === "Home" || e.key === "Enter") { e.preventDefault(); onResize(PANEL_DEFAULT_WIDTH, true); }
  };

  const lit = active || hover;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize side panel"
      aria-valuenow={width}
      aria-valuemin={PANEL_MIN_WIDTH}
      aria-valuemax={PANEL_MAX_WIDTH}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onDoubleClick={() => onResize(PANEL_DEFAULT_WIDTH, true)}
      onKeyDown={handleKeyDown}
      className="relative z-10 hidden w-1.5 shrink-0 cursor-col-resize touch-none outline-none sm:block"
      style={{ marginLeft: -3, marginRight: -3 }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full"
        style={{
          background: "var(--accent)",
          opacity: lit ? 0.7 : 0,
          transition: "opacity 120ms var(--ease-out, ease-out)",
        }}
      />
    </div>
  );
}
