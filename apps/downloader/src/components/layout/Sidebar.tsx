import {
  CheckCircle2,
  CreditCard,
  Download,
  History,
  Home,
  ListOrdered,
  LogOut,
  Settings,
} from "lucide-react";

import { BrsLogo } from "../Branding/BrsLogo";
import { ConnectionStatus } from "../auth/ConnectionStatus";
import { DOWNLOADER_NAME } from "../../lib/site";
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
}[] = [
  { id: "home", labelKey: "navHome", icon: Home },
  { id: "downloads", labelKey: "navDownloads", icon: Download, countKey: "downloads" },
  { id: "queue", labelKey: "navQueue", icon: ListOrdered, countKey: "queue" },
  { id: "completed", labelKey: "navCompleted", icon: CheckCircle2, countKey: "completed" },
  { id: "history", labelKey: "navHistory", icon: History },
  { id: "portal", labelKey: "navPortal", icon: CreditCard },
  { id: "settings", labelKey: "navSettings", icon: Settings },
];

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
    <aside className="flex h-full w-[240px] flex-shrink-0 flex-col border-r border-white/[0.05] bg-[var(--bg-sidebar)]">
      <div className="br-stripe-thin" />
      <div className="px-4 py-4">
        <BrsLogo className="h-9 w-auto max-w-[190px] object-contain object-left" />
        <p className="text-eyebrow mt-2 text-zinc-500">{DOWNLOADER_NAME}</p>
      </div>

      <div className="px-3">
        <ConnectionStatus device={device} connectionState={connectionState} error={syncError} />
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-2.5">
        <p className="text-eyebrow px-2.5 pb-1.5 text-zinc-600">{t("navMenu")}</p>
        {NAV_ITEMS.map(({ id, labelKey, icon: Icon, countKey }) => {
          const active = activeRoute === id;
          const badge = countKey && counts ? counts[countKey] : 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[0.9rem] font-bold leading-snug tracking-[-0.01em] transition-all duration-200 ${
                active
                  ? "bg-[#1ed760]/12 text-white shadow-[inset_0_0_0_1px_rgba(30,215,96,0.16)]"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#1ed760]" />
              )}
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition-colors ${
                  active ? "text-[#1ed760]" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              <span className="flex-1">{t(labelKey)}</span>
              {badge > 0 && (
                <span className="rounded-full bg-[#1ed760] px-2 py-0.5 text-[0.68rem] font-extrabold leading-none text-black">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mx-2.5 mb-3 rounded-2xl border border-white/[0.06] bg-[var(--bg-card)] px-3.5 py-3.5">
        <p className="truncate text-[0.88rem] font-extrabold text-[#1ed760]">
          {t("navHello", { name: firstName })}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-[0.78rem] font-bold text-zinc-500 transition-colors hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("navLogout")}
        </button>
      </div>
    </aside>
  );
}
