"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const THEME_KEY = "wecalendar.theme";
const ACCENT_KEY = "wecalendar.accent";

export const DEFAULT_ACCENT = "#007AFF"; // Apple system blue

/** Returns the system preferred theme */
function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Reads saved theme or falls back to system preference */
function loadTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return getSystemTheme();
}

/** Reads saved accent or returns default */
function loadAccent(): string {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  return localStorage.getItem(ACCENT_KEY) ?? DEFAULT_ACCENT;
}

/** Apply theme class + CSS accent variables to <html> */
export function applyTheme(mode: ThemeMode, accent: string) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.style.setProperty("--theme-primary", accent);

  // Derive hover/muted from accent using color-mix
  // These are approximated as inline styles so no CSS parser needed
  root.style.setProperty("--theme-primary-hover", accent);
  root.style.setProperty("--theme-primary-muted", `color-mix(in srgb, ${accent} 15%, transparent)`);
  root.style.setProperty("--theme-primary-text", accent);
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(loadTheme);
  const [accent, setAccent] = useState(loadAccent);

  // Keep the document in sync with React state (boot script already set initial DOM).
  useEffect(() => {
    applyTheme(mode, accent);
  }, [mode, accent]);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === "light" ? "dark" : "light";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next, accent);
      return next;
    });
  }, [accent]);

  const setAccentColor = useCallback(
    (color: string) => {
      setAccent(color);
      localStorage.setItem(ACCENT_KEY, color);
      applyTheme(mode, color);
    },
    [mode],
  );

  return { mode, accent, toggleMode, setAccentColor };
}
