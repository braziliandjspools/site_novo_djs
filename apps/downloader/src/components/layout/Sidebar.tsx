import {
  CheckCircle2,
  CreditCard,
  Download,
  History,
  Home,
  ListOrdered,
  LogOut,
  Search,
  Settings,
} from "lucide-react";

import { BrsLogo } from "../Branding/BrsLogo";
import { ConnectionStatus } from "../auth/ConnectionStatus";
import { DOWNLOADER_NAME } from "../../lib/site";
import { isMusicSearchEnabled } from "../../lib/features";
import { useLocale, type MessageKey } from "../../i18n/LocaleContext";
import type { ConnectionState } from "../../lib/download/types";
import type { DeviceInfo } from "../../context/AuthContext";

export type AppRoute =
  | "home"
  | "downloads"
  | "queue"
  | "completed"
  | "history"
  | "portal"
  | "search"
  | "settings";

type SidebarProps = {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  device: DeviceInfo;
  connectionState: ConnectionState;
  syncError?: string | null;
  userName: string;
  profileImageUrl?: string | null;
  onLogout: () => void;
  counts?: {
    downloads: number;
    queue: number;
    completed: number;
  };
};

const NAV_ITEMS: {
  id: AppRoute;
  labelKey: MessageKey;
  icon: typeof Download;
  countKey?: keyof NonNullable<SidebarProps["counts"]>;
  featureFlag?: "musicSearch";
}[] = [
  { id: "home", labelKey: "navHome", icon: Home },
  { id: "downloads", labelKey: "navDownloads", icon: Download, countKey: "downloads" },
  { id: "queue", labelKey: "navQueue", icon: ListOrdered, countKey: "queue" },
  { id: "completed", labelKey: "navCompleted", icon: CheckCircle2, countKey: "completed" },
  { id: "history", labelKey: "navHistory", icon: History },
  { id: "search", labelKey: "navSearch", icon: Search, featureFlag: "musicSearch" },
  { id: "portal", labelKey: "navPortal", icon: CreditCard },
  { id: "settings", labelKey: "navSettings", icon: Settings },
];

function isNavVisible(item: (typeof NAV_ITEMS)[number]) {
  if (item.featureFlag === "musicSearch") return isMusicSearchEnabled;
  return true;
}

export function Sidebar({
  activeRoute,
  onNavigate,
  device,
  connectionState,
  syncError,
  userName,
  profileImageUrl,
  onLogout,
  counts,
}: SidebarProps) {
  const { t } = useLocale();
  const firstName = userName.split(" ")[0] ?? userName;

  return (
    <aside className="app-sidebar flex h-full w-[260px] flex-shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-sidebar)]">
      <div className="app-brand-block px-5 pb-5 pt-6">
        <BrsLogo className="h-8 w-auto max-w-[172px] object-contain object-left opacity-95" />
        <p className="mt-2.5 text-[0.66rem] font-semibold tracking-[0.15em] text-white/45 uppercase">
          {DOWNLOADER_NAME}
        </p>
      </div>

      <div className="app-connection-status px-3" title={device.deviceName}>
        <ConnectionStatus device={device} connectionState={connectionState} error={syncError} />
      </div>

      <nav className="app-nav mt-3 flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITEMS.filter(isNavVisible).map(({ id, labelKey, icon: Icon, countKey }) => {
          const active = activeRoute === id;
          const badge = countKey && counts ? counts[countKey] : 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
              className={`win-nav-item group flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3.5 py-3 text-left text-[0.875rem] font-medium ${
                active ? "win-nav-active" : ""
              }`}
            >
              <Icon
                className={`win-nav-icon h-4 w-4 flex-shrink-0 ${
                  active ? "text-[#1ed760]" : "text-white/45"
                }`}
              />
              <span className="flex-1 text-white">{t(labelKey)}</span>
              {badge > 0 && (
                <span className="min-w-5 rounded-full bg-[#1db954]/15 px-1.5 py-1 text-center text-[0.68rem] font-semibold leading-none text-[#1ed760]">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="app-user-card m-3 flex items-center gap-3 rounded-[var(--radius-lg)] border border-white/10 bg-[#171817] px-3 py-3 transition-colors hover:border-[#1db954]/35 hover:bg-[#1db954]/[0.06]">
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt="Foto do perfil"
            className="h-9 w-9 flex-shrink-0 rounded-full border border-white/15 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1db954]/15 text-[0.8rem] font-semibold text-[#1ed760]">
            {(firstName[0] ?? "B").toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] font-semibold text-white">
            {t("navHello", { name: firstName })}
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-0.5 inline-flex cursor-pointer items-center gap-1 text-[0.72rem] font-medium text-white/45 transition-colors hover:text-[#1ed760]"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("navLogout")}
          </button>
        </div>
      </div>
    </aside>
  );
}
