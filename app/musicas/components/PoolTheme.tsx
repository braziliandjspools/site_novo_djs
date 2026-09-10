"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

export type PoolThemeMode = "dark" | "light";

const STORAGE_KEY = "brs-pool-theme";

type PoolThemeContextValue = {
  theme: PoolThemeMode;
  setTheme: (theme: PoolThemeMode) => void;
  toggleTheme: () => void;
};

const PoolThemeContext = createContext<PoolThemeContextValue | null>(null);

function readStoredTheme(): PoolThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function PoolThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<PoolThemeMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setReady(true);
  }, []);

  const setTheme = useCallback((next: PoolThemeMode) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [setTheme, theme, toggleTheme]);

  return (
    <PoolThemeContext.Provider value={value}>
      <div
        className={`pool-theme ${ready ? "pool-theme-ready" : ""}`}
        data-pool-theme={theme}
      >
        {children}
      </div>
    </PoolThemeContext.Provider>
  );
}

export function usePoolTheme() {
  const ctx = useContext(PoolThemeContext);
  if (!ctx) {
    throw new Error("usePoolTheme must be used within PoolThemeProvider");
  }
  return ctx;
}

export function PoolThemeToggle() {
  const { theme, setTheme } = usePoolTheme();
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-[color:var(--pool-border)] bg-[var(--pool-surface-2)] p-0.5"
      role="group"
      aria-label="Tema da página"
    >
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
          theme === "dark"
            ? "bg-[#1ed760] text-black"
            : "text-[color:var(--pool-text-muted)] hover:text-[color:var(--pool-text)]"
        }`}
        aria-pressed={theme === "dark"}
      >
        <Moon className="h-3.5 w-3.5" />
        Escuro
      </button>
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
          theme === "light"
            ? "bg-[#1ed760] text-black"
            : "text-[color:var(--pool-text-muted)] hover:text-[color:var(--pool-text)]"
        }`}
        aria-pressed={theme === "light"}
      >
        <Sun className="h-3.5 w-3.5" />
        Branco
      </button>
    </div>
  );
}
