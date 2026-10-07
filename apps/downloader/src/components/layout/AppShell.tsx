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
  profileImageUrl?: string | null;
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
  profileImageUrl,
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
    <div className="app-frame flex h-full min-h-0 bg-[var(--background)] text-[var(--foreground)]">
      <UpdateAvailableModal />
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        device={device}
        connectionState={connectionState}
        syncError={syncError}
        userName={userName}
        profileImageUrl={profileImageUrl}
        counts={counts}
        onLogout={onLogout}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="app-topbar relative z-50 flex flex-shrink-0 items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--bg-sidebar)] px-6 py-4">
          <div className="min-w-0">
            <h1 className="app-topbar-title truncate font-display text-[1.08rem] font-semibold tracking-tight text-white">{title}</h1>
            {subtitle && (
              <p className="mt-0.5 max-w-2xl truncate text-[0.78rem] leading-snug text-[var(--text-subtle)]">
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
              className="win-control inline-flex h-8 items-center gap-1.5 px-2.5 text-[0.72rem] font-medium"
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

        <main className="app-main app-mesh min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div key={activeRoute} className="animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
