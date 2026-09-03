import { useEffect, useState } from "react";
import {
  Bell,
  Download,
  ExternalLink,
  RefreshCw,
  Settings,
  X,
} from "lucide-react";
import {
  inAppNotificationFeed,
  type AppNotification,
} from "../../lib/notifications/in-app-feed";
import { openUpdateDownload } from "../../lib/updater";
import { openPlatform } from "../../lib/open-site";
import { BP_PORTAL_URL } from "../../lib/site";
import { Button } from "../ui/Button";

type NotificationBellProps = {
  onOpenPortal?: () => void;
  onOpenSettings?: () => void;
};

function severityClass(severity: AppNotification["severity"]) {
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

function kindIcon(kind: AppNotification["kind"]) {
  if (kind === "update") return <RefreshCw className="h-3.5 w-3.5 flex-shrink-0" />;
  if (kind === "download") return <Download className="h-3.5 w-3.5 flex-shrink-0" />;
  if (kind === "plan") return <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />;
  return <Bell className="h-3.5 w-3.5 flex-shrink-0" />;
}

export function NotificationBell({ onOpenPortal, onOpenSettings }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(() => inAppNotificationFeed.list());

  useEffect(() => inAppNotificationFeed.subscribe(setItems), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      const root = document.getElementById("app-notification-bell");
      if (root && !root.contains(target)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const unread = items.filter((item) => !item.read).length;
  const hasAlert = unread > 0;
  const hasError = items.some((item) => !item.read && item.severity === "error");

  async function handleAction(item: AppNotification) {
    inAppNotificationFeed.markRead(item.id);
    const action = item.action;
    if (!action) return;

    setOpen(false);
    if (action.type === "portal") {
      onOpenPortal?.();
      return;
    }
    if (action.type === "settings") {
      onOpenSettings?.();
      return;
    }
    if (action.type === "update") {
      await openUpdateDownload(action.url);
      return;
    }
    if (action.type === "url") {
      await openPlatform(action.url);
    }
  }

  return (
    <div id="app-notification-bell" className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          if (!open) inAppNotificationFeed.markAllRead();
        }}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
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
        <div className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/[0.08] bg-[#161616] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Notificações
            </p>
            {items.length > 0 && (
              <button
                type="button"
                className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
                onClick={() => inAppNotificationFeed.clear()}
              >
                Limpar
              </button>
            )}
          </div>

          {items.length === 0 ? (
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
                        <Button
                          variant="secondary"
                          className="mt-2 !h-8 !px-3 !text-[11px]"
                          onClick={() => void handleAction(item)}
                        >
                          {item.action.type === "portal" || item.action.type === "url" ? (
                            <ExternalLink className="h-3.5 w-3.5" />
                          ) : item.action.type === "settings" ? (
                            <Settings className="h-3.5 w-3.5" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          {item.action.label}
                        </Button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                      aria-label="Dispensar"
                      onClick={() => inAppNotificationFeed.dismiss(item.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="!h-8 flex-1 !text-[11px] text-zinc-400"
              onClick={() => {
                setOpen(false);
                if (onOpenPortal) onOpenPortal();
                else void openPlatform(BP_PORTAL_URL);
              }}
            >
              Portal
            </Button>
            {onOpenSettings && (
              <Button
                variant="ghost"
                className="!h-8 flex-1 !text-[11px] text-zinc-400"
                onClick={() => {
                  setOpen(false);
                  onOpenSettings();
                }}
              >
                Configurações
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
