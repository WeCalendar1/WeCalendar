"use client";

import { useCallback, useSyncExternalStore } from "react";
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

const DEFAULTS: CalendarPrefs = Object.freeze({
  hidePastConflicts: true,
  weekStartsOnMonday: false,
  defaultView: "month" as CalendarMode,
  showDeclinedEvents: false,
  showWorkspaceInSidebar: false,
  confirmDeleteOthers: true,
  creatorColorAccent: false,
});

const ALLOWED_VIEWS = ["day", "week", "month", "year"] as const;

// ─── Loader helpers ───────────────────────────────────────────────────────────

function loadBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    if (v === "true") return true;
    if (v === "false") return false;
    return fallback;
  } catch {
    return fallback;
  }
}

function loadStr<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key) as T | null;
    if (v && (allowed as readonly string[]).includes(v)) return v;
    return fallback;
  } catch {
    return fallback;
  }
}

// ─── Hook & External Store ────────────────────────────────────────────────────

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
export const PREF_EVENT = "wecalendar:pref-change";

let cachedKey: string | null = null;
let cachedSnapshot: CalendarPrefs = DEFAULTS;

export function getServerPrefsSnapshot(): CalendarPrefs {
  return DEFAULTS;
}

export function getPrefsSnapshot(): CalendarPrefs {
  if (typeof window === "undefined") return DEFAULTS;

  const next: CalendarPrefs = {
    hidePastConflicts: loadBool(KEYS.hidePastConflicts, DEFAULTS.hidePastConflicts),
    weekStartsOnMonday: loadBool(KEYS.weekStartsOnMonday, DEFAULTS.weekStartsOnMonday),
    defaultView: loadStr(KEYS.defaultView, DEFAULTS.defaultView, ALLOWED_VIEWS),
    showDeclinedEvents: loadBool(KEYS.showDeclinedEvents, DEFAULTS.showDeclinedEvents),
    showWorkspaceInSidebar: loadBool(KEYS.showWorkspaceInSidebar, DEFAULTS.showWorkspaceInSidebar),
    confirmDeleteOthers: loadBool(KEYS.confirmDeleteOthers, DEFAULTS.confirmDeleteOthers),
    creatorColorAccent: loadBool(KEYS.creatorColorAccent, DEFAULTS.creatorColorAccent),
  };

  const key = JSON.stringify(next);
  if (key === cachedKey) return cachedSnapshot;
  cachedKey = key;
  cachedSnapshot = next;
  return next;
}

export function setCalendarPref<K extends keyof CalendarPrefs>(
  key: K,
  value: CalendarPrefs[K],
): void {
  try {
    localStorage.setItem(KEYS[key], String(value));
    window.dispatchEvent(new Event(PREF_EVENT));
  } catch {
    /* ignore */
  }
}

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
  const prefs = useSyncExternalStore(
    subscribePrefs,
    getPrefsSnapshot,
    getServerPrefsSnapshot,
  );

  const setHidePastConflicts = useCallback(
    (v: boolean) => setCalendarPref("hidePastConflicts", v),
    [],
  );
  const setWeekStartsOnMonday = useCallback(
    (v: boolean) => setCalendarPref("weekStartsOnMonday", v),
    [],
  );
  const setDefaultView = useCallback(
    (v: CalendarMode) => setCalendarPref("defaultView", v),
    [],
  );
  const setShowDeclinedEvents = useCallback(
    (v: boolean) => setCalendarPref("showDeclinedEvents", v),
    [],
  );
  const setShowWorkspaceInSidebar = useCallback(
    (v: boolean) => setCalendarPref("showWorkspaceInSidebar", v),
    [],
  );
  const setConfirmDeleteOthers = useCallback(
    (v: boolean) => setCalendarPref("confirmDeleteOthers", v),
    [],
  );
  const setCreatorColorAccent = useCallback(
    (v: boolean) => setCalendarPref("creatorColorAccent", v),
    [],
  );

  return {
    prefs,
    setHidePastConflicts,
    setWeekStartsOnMonday,
    setDefaultView,
    setShowDeclinedEvents,
    setShowWorkspaceInSidebar,
    setConfirmDeleteOthers,
    setCreatorColorAccent,
  };
}
