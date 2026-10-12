"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { CalendarMode } from "@/lib/calendar";

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  hidePastConflicts: "wecalendar.pref.hidePastConflicts",
  weekStartsOnMonday: "wecalendar.pref.weekStartsOnMonday",
  defaultView: "wecalendar.pref.defaultView",
  showDeclinedEvents: "wecalendar.pref.showDeclinedEvents",
  showWorkspaceInSidebar: "wecalendar.pref.showWorkspaceInSidebar",
  confirmDeleteOthers: "wecalendar.pref.confirmDeleteOthers",
  creatorColorAccent: "wecalendar.pref.creatorColorAccent",
} as const;

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  hidePastConflicts: true,
  weekStartsOnMonday: false,
  defaultView: "month" as CalendarMode,
  showDeclinedEvents: false,
  showWorkspaceInSidebar: false,
  confirmDeleteOthers: true,
  creatorColorAccent: false,
};

// ─── Loader helpers ───────────────────────────────────────────────────────────

function loadBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  return v === "true";
}

function loadStr<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(key) as T | null;
  if (v && (allowed as readonly string[]).includes(v)) return v;
  return fallback;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface CalendarPrefs {
  /** Don't surface conflict alerts / highlights for events fully in the past. */
  hidePastConflicts: boolean;
  /** When true, week columns begin on Monday instead of Sunday. */
  weekStartsOnMonday: boolean;
  /** The calendar view opened by default when the app loads. */
  defaultView: CalendarMode;
  /** Show events that the user has declined (rendered dimmed). */
  showDeclinedEvents: boolean;
  /** Keep shared-calendar controls visible in the main sidebar. */
  showWorkspaceInSidebar: boolean;
  /** Require an extra confirmation step before deleting another user's event. */
  confirmDeleteOthers: boolean;
  /** Colour the left block of event chips with the creator's favourite colour instead of tags. */
  creatorColorAccent: boolean;
}

// Same-tab change notification (the native "storage" event only fires cross-tab).
const PREF_EVENT = "wecalendar:pref-change";

function subscribePrefs(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(PREF_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREF_EVENT, callback);
  };
}

/** Hydration-safe read of the creator-colour accent setting, for event chips. */
export function useCreatorColorAccent(): boolean {
  return useSyncExternalStore(
    subscribePrefs,
    () => loadBool(KEYS.creatorColorAccent, DEFAULTS.creatorColorAccent),
    () => DEFAULTS.creatorColorAccent,
  );
}

export function useCalendarPrefs() {
  const [hidePastConflicts, _setHidePastConflicts] = useState<boolean>(() =>
    loadBool(KEYS.hidePastConflicts, DEFAULTS.hidePastConflicts),
  );
  const [weekStartsOnMonday, _setWeekStartsOnMonday] = useState<boolean>(() =>
    loadBool(KEYS.weekStartsOnMonday, DEFAULTS.weekStartsOnMonday),
  );
  const [defaultView, _setDefaultView] = useState<CalendarMode>(() =>
    loadStr(KEYS.defaultView, DEFAULTS.defaultView, ["day", "week", "month", "year"]),
  );
  const [showDeclinedEvents, _setShowDeclinedEvents] = useState<boolean>(() =>
    loadBool(KEYS.showDeclinedEvents, DEFAULTS.showDeclinedEvents),
  );
  const [confirmDeleteOthers, _setConfirmDeleteOthers] = useState<boolean>(() =>
    loadBool(KEYS.confirmDeleteOthers, DEFAULTS.confirmDeleteOthers),
  );
  const [showWorkspaceInSidebar, _setShowWorkspaceInSidebar] = useState<boolean>(() =>
    loadBool(KEYS.showWorkspaceInSidebar, DEFAULTS.showWorkspaceInSidebar),
  );
  const [creatorColorAccent, _setCreatorColorAccent] = useState<boolean>(() =>
    loadBool(KEYS.creatorColorAccent, DEFAULTS.creatorColorAccent),
  );

  const setCreatorColorAccent = useCallback((v: boolean) => {
    _setCreatorColorAccent(v);
    try {
      localStorage.setItem(KEYS.creatorColorAccent, String(v));
      window.dispatchEvent(new Event(PREF_EVENT));
    } catch { /* ignore */ }
  }, []);

  const setHidePastConflicts = useCallback((v: boolean) => {
    _setHidePastConflicts(v);
    try { localStorage.setItem(KEYS.hidePastConflicts, String(v)); } catch { /* ignore */ }
  }, []);

  const setWeekStartsOnMonday = useCallback((v: boolean) => {
    _setWeekStartsOnMonday(v);
    try { localStorage.setItem(KEYS.weekStartsOnMonday, String(v)); } catch { /* ignore */ }
  }, []);

  const setDefaultView = useCallback((v: CalendarMode) => {
    _setDefaultView(v);
    try { localStorage.setItem(KEYS.defaultView, v); } catch { /* ignore */ }
  }, []);

  const setShowDeclinedEvents = useCallback((v: boolean) => {
    _setShowDeclinedEvents(v);
    try { localStorage.setItem(KEYS.showDeclinedEvents, String(v)); } catch { /* ignore */ }
  }, []);

  const setConfirmDeleteOthers = useCallback((v: boolean) => {
    _setConfirmDeleteOthers(v);
    try { localStorage.setItem(KEYS.confirmDeleteOthers, String(v)); } catch { /* ignore */ }
  }, []);

  const setShowWorkspaceInSidebar = useCallback((v: boolean) => {
    _setShowWorkspaceInSidebar(v);
    try { localStorage.setItem(KEYS.showWorkspaceInSidebar, String(v)); } catch { /* ignore */ }
  }, []);

  return {
    prefs: { hidePastConflicts, weekStartsOnMonday, defaultView, showDeclinedEvents, showWorkspaceInSidebar, confirmDeleteOthers, creatorColorAccent },
    setHidePastConflicts,
    setWeekStartsOnMonday,
    setDefaultView,
    setShowDeclinedEvents,
    setShowWorkspaceInSidebar,
    setConfirmDeleteOthers,
    setCreatorColorAccent,
  };
}
