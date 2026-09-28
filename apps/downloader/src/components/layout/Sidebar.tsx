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
    <aside className="flex h-full w-[232px] flex-shrink-0 flex-col border-r border-white/[0.06] bg-[var(--bg-sidebar)]">
      <div className="px-5 pb-3 pt-5">
        <BrsLogo className="h-8 w-auto max-w-[168px] object-contain object-left" />
        <p className="mt-2 text-[0.7rem] font-medium tracking-[0.16em] text-zinc-500 uppercase">
          {DOWNLOADER_NAME}
        </p>
      </div>

      <div className="px-4">
        <ConnectionStatus device={device} connectionState={connectionState} error={syncError} />
      </div>

      <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV_ITEMS.map(({ id, labelKey, icon: Icon, countKey }) => {
          const active = activeRoute === id;
          const badge = countKey && counts ? counts[countKey] : 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[0.92rem] font-medium tracking-[-0.01em] transition-colors ${
                active
                  ? "bg-[var(--accent-dim)] text-white ring-1 ring-[var(--accent)]/20 shadow-[inset_3px_0_0_var(--accent)]"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] flex-shrink-0 ${
                  active ? "text-[var(--accent)]" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              <span className="flex-1">{t(labelKey)}</span>
              {badge > 0 && (
                <span className="min-w-5 rounded-md bg-[var(--accent)] px-1.5 py-0.5 text-center text-[0.68rem] font-bold leading-none text-black">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-black">
          {(firstName[0] ?? "B").toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.88rem] font-semibold text-white">
            {t("navHello", { name: firstName })}
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-0.5 inline-flex cursor-pointer items-center gap-1 text-[0.75rem] font-medium text-zinc-500 transition-colors hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("navLogout")}
          </button>
        </div>
      </div>
    </aside>
  );
}
