import {
  CheckCircle2,
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
import type { ConnectionState } from "../../lib/download/types";
import type { DeviceInfo } from "../../context/AuthContext";

export type AppRoute = "home" | "downloads" | "queue" | "completed" | "history" | "settings";

type SidebarProps = {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  device: DeviceInfo;
  connectionState: ConnectionState;
  userName: string;
  onLogout: () => void;
  counts?: {
    downloads: number;
    queue: number;
    completed: number;
  };
};

const NAV_ITEMS: { id: AppRoute; label: string; icon: typeof Download; countKey?: keyof NonNullable<SidebarProps["counts"]> }[] = [
  { id: "home", label: "Início", icon: Home },
  { id: "downloads", label: "Downloads", icon: Download, countKey: "downloads" },
  { id: "queue", label: "Fila", icon: ListOrdered, countKey: "queue" },
  { id: "completed", label: "Concluídos", icon: CheckCircle2, countKey: "completed" },
  { id: "history", label: "Histórico", icon: History },
  { id: "settings", label: "Configurações", icon: Settings },
];

export function Sidebar({
  activeRoute,
  onNavigate,
  device,
  connectionState,
  userName,
  onLogout,
  counts,
}: SidebarProps) {
  const firstName = userName.split(" ")[0] ?? userName;

  return (
    <aside className="flex h-full w-[240px] flex-shrink-0 flex-col border-r border-zinc-800 bg-black">
      <div className="br-stripe-thin" />
      <div className="px-5 py-6">
        <BrsLogo className="h-10 w-auto max-w-[220px] object-contain object-left" />
        <p className="mt-2 text-xs text-zinc-500">{DOWNLOADER_NAME}</p>
      </div>

      <div className="px-3">
        <ConnectionStatus device={device} connectionState={connectionState} />
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3">
        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Menu</p>
        {NAV_ITEMS.map(({ id, label, icon: Icon, countKey }) => {
          const active = activeRoute === id;
          const badge = countKey && counts ? counts[countKey] : 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                active ? "bg-[#282828] text-white" : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="rounded-full bg-[#1ed760] px-2 py-0.5 text-[10px] font-black leading-none text-black">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 px-5 py-4">
        <p className="truncate text-sm font-bold text-white">
          Olá, <span className="text-[#1ed760]">{firstName}</span>
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 transition-colors hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">{DOWNLOADER_NAME}</p>
      </div>
    </aside>
  );
}
