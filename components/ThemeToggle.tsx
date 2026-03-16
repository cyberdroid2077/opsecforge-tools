"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "opsecforge-theme";
const THEME_EVENT = "opsecforge-theme-change";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function getThemeSnapshot(): Theme {
  if (typeof document === "undefined") {
    return "dark";
  }

  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleThemeChange = () => {
    onStoreChange();
  };

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY && (event.newValue === "light" || event.newValue === "dark")) {
      applyTheme(event.newValue);
      onStoreChange();
    }
  };

  const handleSystemThemeChange = () => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme !== "light" && savedTheme !== "dark") {
      const nextTheme = getSystemTheme();
      applyTheme(nextTheme);
      onStoreChange();
    }
  };

  window.addEventListener(THEME_EVENT, handleThemeChange);
  window.addEventListener("storage", handleStorageChange);
  mediaQuery.addEventListener("change", handleSystemThemeChange);

  return () => {
    window.removeEventListener(THEME_EVENT, handleThemeChange);
    window.removeEventListener("storage", handleStorageChange);
    mediaQuery.removeEventListener("change", handleSystemThemeChange);
  };
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => "dark");

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={theme === "dark"}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300 transition-all hover:border-emerald-500/40 hover:text-emerald-400"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      <span>{theme}</span>
    </button>
  );
}
