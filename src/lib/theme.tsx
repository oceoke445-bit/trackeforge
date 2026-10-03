"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type ThemeName = "blue" | "gray";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "traxon-theme";
const listeners = new Set<() => void>();

function readTheme(): ThemeName {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "gray" || stored === "blue") return stored;
  } catch {
    /* ignore */
  }
  return "blue";
}

function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getServerSnapshot(): ThemeName {
  return "blue";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);

  useEffect(() => {
    const saved = readTheme();
    const current = document.documentElement.getAttribute("data-theme");
    if (current !== saved) applyTheme(saved);
    const frame = window.requestAnimationFrame(() => {
      document.documentElement.classList.add("theme-ready");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    listeners.forEach((listener) => listener());
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
