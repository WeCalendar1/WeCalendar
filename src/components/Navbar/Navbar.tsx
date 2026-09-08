"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CalendarMode, ScreenView } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/client";

// ─── View Mode Picker (Calendar only) ───────────────────────────────────────

const MODES: { id: CalendarMode; label: string }[] = [
  { id: "day",   label: "Day"   },
  { id: "week",  label: "Week"  },
  { id: "month", label: "Month" },
  { id: "year",  label: "Year"  },
];
const MODE_ORDER: CalendarMode[] = ["day", "week", "month", "year"];

function ViewModePicker({
  calendarMode,
  onCalendarModeChange,
}: {
  calendarMode: CalendarMode;
  onCalendarModeChange: (mode: CalendarMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLabel = MODES.find((m) => m.id === calendarMode)?.label ?? calendarMode;
  const currentIndex = MODE_ORDER.indexOf(calendarMode);

  function shiftMode(dir: 1 | -1) {
    const next = (currentIndex + dir + MODE_ORDER.length) % MODE_ORDER.length;
    onCalendarModeChange(MODE_ORDER[next]!);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const RADIUS = 52;
  const angles = [-90, 0, 90, 180];

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* ‹ Prev */}
      <button
        type="button"
        aria-label="Previous view mode"
        onClick={() => shiftMode(-1)}
        className="pressable flex h-7 w-6 items-center justify-center"
        style={{
          borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
          border: "1px solid var(--border)",
          borderRight: "none",
          background: "var(--surface)",
          color: "var(--text-secondary)",
        }}
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>

      {/* Label / trigger */}
      <button
        type="button"
        id="view-mode-picker-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Current view: ${currentLabel}. Click to change.`}
        onClick={() => setOpen((v) => !v)}
        className="pressable px-3 py-1 text-sm font-semibold"
        style={{
          border: "1px solid var(--border)",
          borderLeft: "none",
          borderRight: "none",
          background: open ? "var(--accent-muted)" : "var(--surface)",
          color: open ? "var(--accent)" : "var(--foreground)",
          minWidth: "4rem",
          textAlign: "center",
          lineHeight: "1.5rem",
          letterSpacing: "-0.004em",
        }}
      >
        {currentLabel}
      </button>

      {/* › Next */}
      <button
        type="button"
        aria-label="Next view mode"
        onClick={() => shiftMode(1)}
        className="pressable flex h-7 w-6 items-center justify-center"
        style={{
          borderRadius: "0 var(--radius-md) var(--radius-md) 0",
          border: "1px solid var(--border)",
          borderLeft: "none",
          background: "var(--surface)",
          color: "var(--text-secondary)",
        }}
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {/* Radial picker */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Select calendar view"
            className="pointer-events-auto absolute left-1/2 top-full z-50"
            style={{ transform: "translateX(-50%)", marginTop: "0.5rem" }}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ type: "spring", bounce: 0, duration: 0.28 }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{ width: RADIUS * 2 + 80, height: RADIUS * 2 + 80 }}
            >
              <div
                className="absolute inset-0 glass"
                style={{ borderRadius: "50%" }}
              />
              <span className="relative z-10 text-xs font-semibold" style={{ color: "var(--accent)", letterSpacing: "-0.002em" }}>
                {currentLabel}
              </span>
              {MODES.map((mode, i) => {
                const angleDeg = angles[i]!;
                const angleRad = (angleDeg * Math.PI) / 180;
                const x = Math.cos(angleRad) * RADIUS;
                const y = Math.sin(angleRad) * RADIUS;
                const isActive = mode.id === calendarMode;
                return (
                  <motion.button
                    key={mode.id}
                    type="button"
                    onClick={() => { onCalendarModeChange(mode.id); setOpen(false); }}
                    aria-label={mode.label}
                    aria-pressed={isActive}
                    className="absolute flex items-center justify-center text-xs font-semibold"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      width: 48,
                      height: 28,
                      borderRadius: "var(--radius-full)",
                      border: isActive ? "none" : "1px solid var(--border)",
                      background: isActive ? "var(--accent)" : "var(--surface)",
                      color: isActive ? "#fff" : "var(--foreground)",
                      letterSpacing: "-0.004em",
                      cursor: "pointer",
                    }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.32, delay: i * 0.04 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    {mode.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Screen switcher ─────────────────────────────────────────────────────────

const SCREENS: { id: ScreenView; label: string; icon: ReactNode }[] = [
  {
    id: "calendar",
    label: "Calendar",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    id: "notes",
    label: "Notes",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    id: "map",
    label: "Map",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
        <path d="M9 3v15M15 6v15" />
      </svg>
    ),
  },
];

function ScreenSwitcher({
  screenView,
  onScreenViewChange,
}: {
  screenView: ScreenView;
  onScreenViewChange: (v: ScreenView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Screen view"
      className="relative flex items-center p-1 gap-0.5"
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        background: "var(--surface-2)",
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
            title={screen.label}
            className="relative flex h-8 w-8 items-center justify-center"
            style={{
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              color: active ? "var(--accent)" : "var(--text-secondary)",
              background: "transparent",
              border: "none",
              zIndex: 1,
              transition: "color 120ms ease",
            }}
          >
            {/* Framer Motion sliding pill indicator */}
            {active && (
              <motion.div
                layoutId="screen-tab-indicator"
                className="absolute inset-0"
                style={{
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface)",
                  boxShadow: "var(--shadow-sm)",
                  zIndex: -1,
                }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              />
            )}
            {screen.icon}
          </button>
        );
      })}
    </div>
  );
}

// ─── Dark mode toggle ─────────────────────────────────────────────────────────

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={onToggle}
      className="pressable flex h-8 w-8 items-center justify-center"
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text-secondary)",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.svg
            key="sun"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
            transition={{ duration: 0.2 }}
          >
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </motion.svg>
        ) : (
          <motion.svg
            key="moon"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0, rotate: 30, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -30, scale: 0.7 }}
            transition={{ duration: 0.2 }}
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Profile Menu ─────────────────────────────────────────────────────────────

const APPLE_ACCENTS = [
  { name: "Blue", color: "#007AFF" },
  { name: "Purple", color: "#AF52DE" },
  { name: "Pink", color: "#FF2D55" },
  { name: "Red", color: "#FF3B30" },
  { name: "Orange", color: "#FF9500" },
  { name: "Yellow", color: "#FFCC00" },
  { name: "Green", color: "#34C759" },
  { name: "Graphite", color: "#8E8E93" },
];

function ProfileMenu({
  userInitials,
  accent = "#007AFF",
  onSelectAccent,
}: {
  userInitials: string;
  accent?: string;
  onSelectAccent?: (color: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Account"
        className="pressable flex h-8 w-8 items-center justify-center text-sm font-semibold"
        style={{
          borderRadius: "var(--radius-full)",
          background: "var(--accent)",
          color: "#fff",
          letterSpacing: "-0.01em",
        }}
      >
        {userInitials}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Account"
            className="absolute right-0 z-50 mt-2 w-52 overflow-hidden py-1"
            style={{
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-menu)",
            }}
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ type: "spring", bounce: 0, duration: 0.22 }}
          >
            {/* Glass backdrop */}
            <div className="glass-heavy absolute inset-0" style={{ borderRadius: "var(--radius-lg)" }} />
            <div className="relative z-10">
              {/* Accent Color picker */}
              <div className="border-b px-3.5 py-2.5" style={{ borderColor: "var(--separator)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Accent Color
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {APPLE_ACCENTS.map((item) => {
                    const isSelected = accent.toLowerCase() === item.color.toLowerCase();
                    return (
                      <button
                        key={item.color}
                        type="button"
                        title={item.name}
                        onClick={() => onSelectAccent?.(item.color)}
                        className="pressable relative flex h-5 w-5 items-center justify-center rounded-full"
                        style={{
                          background: item.color,
                          boxShadow: isSelected ? `0 0 0 2px var(--surface), 0 0 0 3.5px ${item.color}` : "none",
                        }}
                      >
                        {isSelected && (
                          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M2.5 6l2.5 2.5 4.5-5" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                  <label
                    title="Custom color"
                    className="pressable relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border text-[11px] overflow-hidden"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                  >
                    <input
                      type="color"
                      value={accent}
                      onChange={(e) => onSelectAccent?.(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span style={{ color: "var(--text-secondary)" }}>+</span>
                  </label>
                </div>
              </div>

              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[var(--accent-muted)]"
                style={{ color: "var(--foreground)", letterSpacing: "-0.004em" }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                Settings
              </Link>
              <div style={{ height: "1px", background: "var(--separator)", margin: "0.25rem 0.75rem" }} />
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium disabled:opacity-50 transition-colors hover:bg-[var(--accent-muted)]"
                style={{ color: "var(--color-danger)", letterSpacing: "-0.004em", cursor: "pointer" }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export type NavbarProps = {
  monthLabel: string;
  calendarMode: CalendarMode;
  screenView: ScreenView;
  sidebarOpen: boolean;
  searchQuery: string;
  userInitials: string;
  isDark: boolean;
  accent?: string;
  onToggleSidebar: () => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCalendarModeChange: (mode: CalendarMode) => void;
  onScreenViewChange: (view: ScreenView) => void;
  onSearchChange: (query: string) => void;
  onToggleTheme: () => void;
  onSelectAccent?: (color: string) => void;
};

export function Navbar({
  monthLabel,
  calendarMode,
  screenView,
  sidebarOpen,
  searchQuery,
  userInitials,
  isDark,
  accent,
  onToggleSidebar,
  onToday,
  onPrev,
  onNext,
  onCalendarModeChange,
  onScreenViewChange,
  onSearchChange,
  onToggleTheme,
  onSelectAccent,
}: NavbarProps) {
  return (
    <header
      className="glass relative z-30 flex h-14 shrink-0 items-center gap-3 px-3 sm:px-4"
      style={{
        borderBottom: "1px solid var(--separator)",
        borderRadius: 0,
        boxShadow: "none",
      }}
    >
      {/* Left: hamburger + logo */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={sidebarOpen}
          className="pressable flex h-9 w-9 items-center justify-center"
          style={{ borderRadius: "var(--radius-md)", color: "var(--text-secondary)" }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span
            className="flex h-[30px] w-[30px] items-center justify-center text-sm font-bold text-white"
            style={{
              borderRadius: "var(--radius-sm)",
              background: "var(--accent)",
              letterSpacing: "-0.01em",
            }}
          >
            W
          </span>
          <span
            className="hidden text-base font-semibold tracking-tight sm:inline"
            style={{ color: "var(--foreground)", letterSpacing: "-0.018em" }}
          >
            WeCalendar
          </span>
        </div>
      </div>

      {/* Center: context controls */}
      <div className="flex flex-1 items-center gap-2 pl-2">
        {screenView === "calendar" ? (
          <>
            <button
              type="button"
              onClick={onToday}
              className="pressable px-3 py-1.5 text-sm font-medium"
              style={{
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--foreground)",
                letterSpacing: "-0.004em",
              }}
            >
              Today
            </button>

            <div className="flex items-center gap-0.5">
              {[
                { onClick: onPrev, label: "Previous", path: "M15 6l-6 6 6 6" },
                { onClick: onNext, label: "Next",     path: "M9 6l6 6-6 6"  },
              ].map(({ onClick, label, path }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  aria-label={label}
                  className="pressable flex h-8 w-8 items-center justify-center"
                  style={{ borderRadius: "var(--radius-md)", color: "var(--text-secondary)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={path} />
                  </svg>
                </button>
              ))}
            </div>

            <h1
              className="truncate font-semibold"
              style={{ fontSize: "1.0625rem", letterSpacing: "-0.012em", color: "var(--foreground)" }}
            >
              {monthLabel}
            </h1>
          </>
        ) : (
          <h1
            className="truncate font-semibold"
            style={{ fontSize: "1.0625rem", letterSpacing: "-0.012em", color: "var(--foreground)" }}
          >
            {screenView === "notes" ? "Notes" : "Map"}
          </h1>
        )}
      </div>

      {/* Right: search + mode picker + view switcher + theme toggle + avatar */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div
          className="hidden items-center gap-2 sm:flex"
          style={{
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "0 12px",
          }}
          onFocusCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px var(--accent-muted)";
          }}
          onBlurCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            id="app-search"
            type="search"
            placeholder={screenView === "notes" ? "Search notes…" : "Search events…"}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-36 bg-transparent text-sm outline-none lg:w-48"
            style={{ color: "var(--foreground)", letterSpacing: "-0.004em" }}
            aria-label={screenView === "notes" ? "Search notes" : "Search events"}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="pressable"
              style={{ color: "var(--text-muted)", lineHeight: 1 }}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {screenView === "calendar" && (
          <ViewModePicker
            calendarMode={calendarMode}
            onCalendarModeChange={onCalendarModeChange}
          />
        )}

        <ScreenSwitcher screenView={screenView} onScreenViewChange={onScreenViewChange} />

        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

        <ProfileMenu
          userInitials={userInitials}
          accent={accent}
          onSelectAccent={onSelectAccent}
        />
      </div>
    </header>
  );
}
