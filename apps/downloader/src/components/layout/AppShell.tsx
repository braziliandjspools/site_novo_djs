import type { ReactNode } from "react";

import type { AppRoute } from "./Sidebar";

import { Sidebar } from "./Sidebar";

import type { ConnectionState } from "../../lib/download/types";
import type { DeviceInfo } from "../../context/AuthContext";

type AppShellProps = {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  title: string;
  subtitle?: string;
  userName: string;
  device: DeviceInfo;
  connectionState: ConnectionState;
  syncError?: string | null;
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
  counts,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-full min-h-0 bg-black text-zinc-100">
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
        <header className="flex-shrink-0 border-b border-zinc-800/80 bg-black/80 px-6 py-4 backdrop-blur-md">
          <h1 className="text-base font-bold text-white sm:text-lg">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-[#1f1f1f] to-[#121212] px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
