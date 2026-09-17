"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastState = {
  message: string;
  variant: ToastVariant;
  durationMs: number;
} | null;

type SiteToastContextValue = {
  showToast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
};

const SiteToastContext = createContext<SiteToastContextValue | null>(null);

function toastClass(variant: ToastVariant) {
  switch (variant) {
    case "error":
      return "bg-red-500/95 text-white";
    case "info":
      return "bg-[#1a1a1a] text-white border border-white/15";
    case "success":
    default:
      return "bg-[#1ed760] text-black";
  }
}

export function SiteToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success", durationMs = 4500) => {
      setToast({ message, variant, durationMs });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <SiteToastContext.Provider value={value}>
      {children}
      {toast ? (
        <p
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 z-[80] max-w-[min(94vw,32rem)] -translate-x-1/2 rounded-lg px-4 py-2.5 text-center text-xs font-semibold leading-relaxed shadow-lg ${toastClass(toast.variant)}`}
        >
          {toast.message}
        </p>
      ) : null}
    </SiteToastContext.Provider>
  );
}

export function useSiteToast() {
  const context = useContext(SiteToastContext);
  if (!context) {
    throw new Error("useSiteToast must be used within SiteToastProvider");
  }
  return context;
}
