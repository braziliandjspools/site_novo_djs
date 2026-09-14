"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ToastVariant = "success" | "error";

type ToastState = {
  message: string;
  variant: ToastVariant;
  durationMs: number;
} | null;

type MusicasToastContextValue = {
  showToast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
};

const MusicasToastContext = createContext<MusicasToastContextValue | null>(null);

export function MusicasToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success", durationMs = 4000) => {
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
    <MusicasToastContext.Provider value={value}>
      {children}
      {toast && (
        <p
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 z-50 max-w-[min(94vw,32rem)] -translate-x-1/2 rounded-lg px-4 py-2.5 text-center text-xs font-semibold leading-relaxed shadow-lg ${
            toast.variant === "success" ? "bg-[#1ed760] text-black" : "bg-red-500/95 text-white"
          }`}
        >
          {toast.message}
        </p>
      )}
    </MusicasToastContext.Provider>
  );
}

export function useMusicasToast() {
  const context = useContext(MusicasToastContext);
  if (!context) {
    throw new Error("useMusicasToast must be used within MusicasToastProvider");
  }
  return context;
}
