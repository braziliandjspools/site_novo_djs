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
        <header className="relative z-50 flex flex-shrink-0 items-center justify-between gap-3 border-b border-white/[0.05] bg-[#0e1014]/92 px-5 py-3.5 backdrop-blur-xl">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1ed760]/40 to-transparent"
            aria-hidden
          />
          <div className="min-w-0">
            <h1 className="truncate text-[1.05rem] font-extrabold tracking-[-0.02em] text-white sm:text-[1.15rem]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 max-w-2xl truncate text-[0.82rem] leading-snug text-[var(--text-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          <div className="relative z-[60] flex flex-shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void openPlatform(supportWhatsAppUrl())}
              title={t("settingsSupportWhatsApp")}
              aria-label={t("settingsSupportWhatsApp")}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#25D366]/30 bg-[#25D366]/12 px-2.5 text-[0.7rem] font-bold text-[#25D366] transition-colors hover:bg-[#25D366]/22"
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

        <main className="app-mesh min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
