import { Download, LogOut, Settings } from "lucide-react";

import { ConnectionStatus } from "../auth/ConnectionStatus";

import { APP_NAME } from "../../lib/site";

import type { ConnectionState } from "../../lib/download/types";
import type { DeviceInfo } from "../../context/AuthContext";

export type AppRoute = "downloads" | "settings";

type SidebarProps = {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  device: DeviceInfo;
  connectionState: ConnectionState;
  userName: string;
  onLogout: () => void;
};



const NAV_ITEMS: { id: AppRoute; label: string; icon: typeof Download }[] = [

  { id: "downloads", label: "Downloads", icon: Download },

  { id: "settings", label: "Configurações", icon: Settings },

];



export function Sidebar({ activeRoute, onNavigate, device, connectionState, userName, onLogout }: SidebarProps) {

  const firstName = userName.split(" ")[0] ?? userName;



  return (

    <aside className="flex h-full w-[240px] flex-shrink-0 flex-col border-r border-zinc-800 bg-black">

      <div className="br-stripe-thin" />

      <div className="px-5 py-6">

        <p className="text-2xl font-black tracking-tight text-white">

          Brazilian<span className="text-[#1ed760]">Packs</span>

        </p>

        <p className="mt-1 text-xs text-zinc-500">Downloader</p>

      </div>



      <div className="px-3">

        <ConnectionStatus device={device} connectionState={connectionState} />

      </div>



      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3">

        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Menu</p>

        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {

          const active = activeRoute === id;

          return (

            <button

              key={id}

              type="button"

              onClick={() => onNavigate(id)}

              className={`flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition-colors ${

                active

                  ? "bg-[#282828] text-white"

                  : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-white"

              }`}

            >

              <Icon className="h-5 w-5" />

              {label}

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

        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">{APP_NAME}</p>

      </div>

    </aside>

  );

}


