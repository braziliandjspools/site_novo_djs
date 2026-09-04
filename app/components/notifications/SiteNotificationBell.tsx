"use client";

import { useCallback, useEffect, useId, useState } from "react";
import {
  Bell,
  CreditCard,
  ExternalLink,
  Megaphone,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { SiteNotificationDto } from "../../lib/site-notices";

const LOCAL_DISMISS_KEY = "bp_site_notif_dismissed";
const LOCAL_READ_KEY = "bp_site_notif_read";

function readLocalSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeLocalSet(key: string, value: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify([...value]));
}

function severityClass(severity: SiteNotificationDto["severity"]) {
  switch (severity) {
    case "error":
      return "border-red-500/20 bg-red-500/10 text-red-300";
    case "warning":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "success":
      return "border-[#1db954]/20 bg-[#1db954]/10 text-[#1db954]";
    default:
      return "border-white/[0.06] bg-white/[0.03] text-zinc-300";
  }
}

function kindIcon(kind: SiteNotificationDto["kind"]) {
  if (kind === "payment") return <CreditCard className="h-3.5 w-3.5 flex-shrink-0" />;
  if (kind === "admin") return <Megaphone className="h-3.5 w-3.5 flex-shrink-0" />;
  return <Bell className="h-3.5 w-3.5 flex-shrink-0" />;
}

type SiteNotificationBellProps = {
  className?: string;
  /** Variante visual mais compacta (header marketing). */
  compact?: boolean;
};

export function SiteNotificationBell({ className = "", compact = false }: SiteNotificationBellProps) {
  const router = useRouter();
  const rootId = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SiteNotificationDto[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const applyLocalState = useCallback((list: SiteNotificationDto[]) => {
    const dismissed = readLocalSet(LOCAL_DISMISS_KEY);
    const readIds = readLocalSet(LOCAL_READ_KEY);
    return list
      .filter((item) => !dismissed.has(item.dedupeKey ?? item.id))
      .map((item) => ({
        ...item,
        read: item.read || readIds.has(item.dedupeKey ?? item.id),
      }));
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store", credentials: "same-origin" });
      const data = (await res.json()) as {
        authenticated?: boolean;
        notifications?: SiteNotificationDto[];
      };
      setAuthenticated(Boolean(data.authenticated));
      setItems(applyLocalState(data.notifications ?? []));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [applyLocalState]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      const root = document.getElementById(`site-notification-bell-${rootId}`);
      if (root && !root.contains(target)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open, rootId]);

  const unread = items.filter((item) => !item.read).length;
  const hasAlert = unread > 0;
  const hasError = items.some((item) => !item.read && item.severity === "error");

  async function postAction(action: "read" | "read_all" | "dismiss", id?: string) {
    if (!authenticated) return;
    try {
      await fetch("/api/notifications/actions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          id,
          ids: action === "read_all" ? items.map((item) => item.id) : undefined,
        }),
      });
    } catch {
      /* local state already updated */
    }
  }

  function markLocalRead(ids: string[]) {
    const readIds = readLocalSet(LOCAL_READ_KEY);
    for (const id of ids) readIds.add(id);
    writeLocalSet(LOCAL_READ_KEY, readIds);
  }

  function markLocalDismiss(key: string) {
    const dismissed = readLocalSet(LOCAL_DISMISS_KEY);
    dismissed.add(key);
    writeLocalSet(LOCAL_DISMISS_KEY, dismissed);
  }

  function handleOpenToggle() {
    setOpen((current) => {
      const next = !current;
      if (!current) {
        const keys = items.map((item) => item.dedupeKey ?? item.id);
        markLocalRead(keys);
        setItems((prev) => prev.map((item) => ({ ...item, read: true })));
        void postAction("read_all");
      }
      return next;
    });
  }

  function handleDismiss(item: SiteNotificationDto) {
    const key = item.dedupeKey ?? item.id;
    markLocalDismiss(key);
    setItems((prev) => prev.filter((entry) => (entry.dedupeKey ?? entry.id) !== key));
    void postAction("dismiss", item.id);
  }

  function handleAction(item: SiteNotificationDto) {
    handleDismiss(item);
    setOpen(false);
    const action = item.action;
    if (!action) return;
    if (action.type === "portal") {
      router.push("/portal");
      return;
    }
    if (action.type === "plans") {
      router.push("/plans");
      return;
    }
    if (action.type === "url") {
      window.open(action.href, "_blank", "noopener,noreferrer");
    }
  }

  const buttonSize = compact ? "h-9 w-9" : "h-10 w-10";

  return (
    <div id={`site-notification-bell-${rootId}`} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleOpenToggle}
        className={`relative inline-flex ${buttonSize} items-center justify-center rounded-xl border transition-colors ${
          hasAlert
            ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
        }`}
        aria-label={hasAlert ? `${unread} notificações` : "Notificações"}
        title={hasAlert ? `${unread} nova(s)` : "Notificações"}
      >
        <Bell className="h-4 w-4" />
        {hasAlert && (
          <span
            className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
              hasError ? "bg-red-400" : "bg-amber-400"
            }`}
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[60] mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/[0.08] bg-[#161616] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Notificações
            </p>
            {items.length > 0 && (
              <button
                type="button"
                className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
                onClick={() => {
                  for (const item of items) markLocalDismiss(item.dedupeKey ?? item.id);
                  setItems([]);
                }}
              >
                Limpar
              </button>
            )}
          </div>

          {loading && items.length === 0 ? (
            <p className="mt-3 rounded-xl bg-white/[0.03] px-3 py-3 text-sm text-zinc-400">
              Carregando…
            </p>
          ) : items.length === 0 ? (
            <p className="mt-3 rounded-xl bg-white/[0.03] px-3 py-3 text-sm text-zinc-400">
              Nenhuma notificação no momento.
            </p>
          ) : (
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.id} className={`rounded-xl border px-3 py-3 text-sm ${severityClass(item.severity)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-semibold text-white">
                        {kindIcon(item.kind)}
                        <span className="truncate">{item.title}</span>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed opacity-90">{item.body}</p>
                      {item.action && (
                        <button
                          type="button"
                          className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-semibold text-white hover:bg-white/10"
                          onClick={() => handleAction(item)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {item.action.label}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                      aria-label="Dispensar"
                      onClick={() => handleDismiss(item)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="h-8 flex-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              onClick={() => {
                setOpen(false);
                router.push("/portal");
              }}
            >
              Portal
            </button>
            <button
              type="button"
              className="h-8 flex-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              onClick={() => {
                setOpen(false);
                router.push("/plans");
              }}
            >
              Planos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
