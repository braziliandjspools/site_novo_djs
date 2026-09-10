import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, string> = {
  success: "border-[#1ed760]/35 bg-[#12161c]/95 text-[#d7ffe6]",
  error: "border-red-500/35 bg-[#1a1012]/95 text-red-100",
  info: "border-sky-500/35 bg-[#10151c]/95 text-sky-100",
  warning: "border-amber-500/35 bg-[#1a160e]/95 text-amber-100",
};

const TONE_ICON = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
  warning: TriangleAlert,
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const text = message.trim();
      if (!text) return;
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current.slice(-4), { id, message: text, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = TONE_ICON[toast.tone];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto animate-fade-up flex items-start gap-3 rounded-xl border px-3.5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md ${TONE_STYLES[toast.tone]}`}
              role="status"
              aria-live="polite"
            >
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-90" />
              <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
