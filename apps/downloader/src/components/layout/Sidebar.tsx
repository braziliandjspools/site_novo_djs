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
  onLogout,
  counts,
}: SidebarProps) {
  const { t } = useLocale();
  const firstName = userName.split(" ")[0] ?? userName;

  return (
    <aside className="flex h-full w-[248px] flex-shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-sidebar)]">
      <div className="px-4 pb-3 pt-4">
        <BrsLogo className="h-7 w-auto max-w-[160px] object-contain object-left opacity-95" />
        <p className="mt-2 text-[0.68rem] font-medium tracking-[0.12em] text-white/45 uppercase">
          {DOWNLOADER_NAME}
        </p>
      </div>

      <div className="px-3">
        <ConnectionStatus device={device} connectionState={connectionState} error={syncError} />
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-2.5">
        {NAV_ITEMS.filter(isNavVisible).map(({ id, labelKey, icon: Icon, countKey }) => {
          const active = activeRoute === id;
          const badge = countKey && counts ? counts[countKey] : 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
              className={`win-nav-item group flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-[0.875rem] font-medium ${
                active ? "win-nav-active" : ""
              }`}
            >
              <Icon
                className={`win-nav-icon h-4 w-4 flex-shrink-0 ${
                  active ? "text-[#8ad4ff]" : "text-white/40"
                }`}
              />
              <span className="flex-1 text-white">{t(labelKey)}</span>
              {badge > 0 && (
                <span className="min-w-5 rounded-[4px] bg-[#60cdff]/15 px-1.5 py-0.5 text-center text-[0.68rem] font-semibold leading-none text-[#8ad4ff]">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="m-2.5 flex items-center gap-3 rounded-[var(--radius-lg)] border border-white/10 bg-[#0a0a0a] px-3 py-2.5 transition-colors hover:border-[#60cdff]/35 hover:bg-[#60cdff]/[0.06]">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[0.8rem] font-semibold text-white">
          {(firstName[0] ?? "B").toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] font-semibold text-white">
            {t("navHello", { name: firstName })}
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-0.5 inline-flex cursor-pointer items-center gap-1 text-[0.72rem] font-medium text-white/45 transition-colors hover:text-[#8ad4ff]"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("navLogout")}
          </button>
        </div>
      </div>
    </aside>
  );
}
