import { WEBUI_VERSION } from "../../lib/app-info";
import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import type { AppRoute } from "./Sidebar";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { UpdateAvailableModal } from "../UpdateAvailableModal";
import type { ConnectionState } from "../../lib/download/types";
import type { DeviceInfo, PlanBillingInfo } from "../../context/AuthContext";
import { useAppNotifications } from "../../hooks/useAppNotifications";
import { openPlatform } from "../../lib/open-site";
import { supportWhatsAppUrl } from "../../lib/site";
import { useLocale } from "../../i18n/LocaleContext";

type AppShellProps = {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  title: string;
  subtitle?: string;
  userName: string;
  device: DeviceInfo;
  connectionState: ConnectionState;
  syncError?: string | null;
  billing?: PlanBillingInfo | null;
  counts?: {
    downloads: number;
    queue: number;
    completed: number;
  };
  onLogout: () => void;
  children: ReactNode;
};

export function AppShell({
  activeRoute,
  onNavigate,
  title,
  subtitle,
  userName,
  device,
  connectionState,
  syncError,
  billing,
  counts,
  onLogout,
  children,
}: AppShellProps) {
  useAppNotifications(billing);
  const { t } = useLocale();

  return (
    <div className="flex h-full min-h-0 bg-[var(--background)] text-[var(--foreground)]">
      <div className="br-rail flex-shrink-0" aria-hidden />
      <UpdateAvailableModal />
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        device={device}
        connectionState={connectionState}
        syncError={syncError}
        userName={userName}
        counts={counts}
        onLogout={onLogout}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="relative z-50 flex flex-shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-[var(--bg-sidebar)] px-6 py-4">
          <div className="min-w-0">
            <p className="text-eyebrow text-[var(--accent)]">BRS <span className="ml-2 rounded-md border border-white/10 px-1.5 py-0.5 text-[0.6rem] text-zinc-400">{WEBUI_VERSION}</span></p>
            <h1 className="truncate text-[1.2rem] font-semibold tracking-[-0.03em] text-white">{title}</h1>
            {subtitle && (
              <p className="mt-0.5 max-w-2xl truncate text-[0.82rem] leading-snug text-[var(--text-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          <div className="relative z-[60] flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void openPlatform(supportWhatsAppUrl())}
              title={t("settingsSupportWhatsApp")}
              aria-label={t("settingsSupportWhatsApp")}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[0.75rem] font-semibold text-white transition-colors hover:border-[#25D366]/40 hover:text-[#25D366]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <NotificationBell
              onOpenPortal={() => onNavigate("portal")}
              onOpenSettings={() => onNavigate("settings")}
            />
          </div>
        </header>

        <main className="app-mesh min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div key={activeRoute} className="animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
