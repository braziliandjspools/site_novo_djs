"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FolderTree,
  HardDrive,
  Loader2,
  LogOut,
  Monitor,
  Music2,
  RefreshCw,
  Users,
  Wifi,
} from "lucide-react";

type CatalogStats = {
  configured: boolean;
  folderCount: number;
  trackCount: number;
  scannedFolders: number;
  syncedAt: string;
  cached: boolean;
  error?: string;
};

type DeviceRow = {
  id: number;
  deviceId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  lastSeenAt: string | null;
  isOnline: boolean;
  createdAt: string;
};

type DownloaderUserRow = {
  userId: number;
  name: string;
  email: string;
  active: boolean;
  poolsVip: boolean;
  onlineCount: number;
  deviceCount: number;
  devices: DeviceRow[];
};

type AdminStats = {
  generatedAt: string;
  catalog: CatalogStats;
  portal: {
    totalUsers: number;
    activeUsers: number;
    vipUsers: number;
    allavsoftUsers: number;
  };
  downloaders: {
    onlineWindowSeconds: number;
    connectedPcs: number;
    registeredPcs: number;
    usersWithConnected: number;
    usersWithAnyDevice: number;
    users: DownloaderUserRow[];
  };
  jobs: {
    pending: number;
    downloading: number;
    paused: number;
    failed: number;
    completed: number;
  };
};

type AdminDashboardProps = {
  onLogout: () => void;
};

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelative(iso: string | null | undefined) {
  if (!iso) return "nunca";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 15) return "agora";
  if (diffSec < 60) return `há ${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 48) return `há ${diffH} h`;
  return formatDateTime(iso);
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Music2;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? "border-[#1ed760]/40 bg-[#1ed760]/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
          <p className={`mt-2 font-display text-3xl font-semibold tabular-nums ${accent ? "text-[#1ed760]" : "text-white"}`}>
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            accent ? "bg-[#1ed760]/20 text-[#1ed760]" : "bg-white/5 text-zinc-400"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"online" | "all">("online");

  const load = useCallback(async (opts?: { refreshCatalog?: boolean; silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const qs = opts?.refreshCatalog ? "?refresh=1" : "";
      const res = await fetch(`/api/admin/stats${qs}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = (await res.json()) as AdminStats & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Falha ao carregar relatórios.");
        return;
      }
      setStats(data);
    } catch {
      setError("Não foi possível carregar os relatórios.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load({ silent: true });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const users = (stats?.downloaders.users ?? []).filter((user) =>
    filter === "online" ? user.onlineCount > 0 : true,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Relatórios reais do acervo Drive, clientes e BRS Downloader.
            {stats ? ` · Atualizado ${formatRelative(stats.generatedAt)}` : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load({ refreshCatalog: true })}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 disabled:opacity-50"
          >
            {refreshing || loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Atualizar
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {loading && !stats ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando inventário e conexões…
        </div>
      ) : null}

      {stats ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Faixas no Drive"
              value={stats.catalog.trackCount.toLocaleString("pt-BR")}
              hint={
                stats.catalog.error
                  ? stats.catalog.error
                  : stats.catalog.cached
                    ? `Cache · ${formatRelative(stats.catalog.syncedAt)}`
                    : `Varredura · ${formatRelative(stats.catalog.syncedAt)}`
              }
              icon={Music2}
              accent
            />
            <StatCard
              label="Pastas no Drive"
              value={stats.catalog.folderCount.toLocaleString("pt-BR")}
              hint={`${stats.catalog.scannedFolders.toLocaleString("pt-BR")} nós varridos`}
              icon={FolderTree}
            />
            <StatCard
              label="PCs online"
              value={stats.downloaders.connectedPcs}
              hint={`Janela ${stats.downloaders.onlineWindowSeconds}s · ${stats.downloaders.registeredPcs} registrados`}
              icon={Wifi}
              accent={stats.downloaders.connectedPcs > 0}
            />
            <StatCard
              label="Usuários com PC online"
              value={stats.downloaders.usersWithConnected}
              hint={`${stats.downloaders.usersWithAnyDevice} já usaram o Downloader`}
              icon={Monitor}
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Clientes ativos"
              value={stats.portal.activeUsers}
              hint={`${stats.portal.totalUsers} no total`}
              icon={Users}
            />
            <StatCard label="VIP ativo" value={stats.portal.vipUsers} icon={HardDrive} />
            <StatCard label="Allavsoft" value={stats.portal.allavsoftUsers} icon={HardDrive} />
            <StatCard
              label="Fila Downloader"
              value={stats.jobs.pending + stats.jobs.downloading + stats.jobs.paused}
              hint={`${stats.jobs.downloading} baixando · ${stats.jobs.failed} falhas · ${stats.jobs.completed} ok`}
              icon={HardDrive}
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">
                  Downloaders conectados
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Heartbeat do app a cada 60s · online se visto nos últimos{" "}
                  {stats.downloaders.onlineWindowSeconds}s
                </p>
              </div>
              <div className="flex rounded-lg border border-white/10 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilter("online")}
                  className={`rounded-md px-3 py-1.5 ${
                    filter === "online" ? "bg-[#1ed760] text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Online ({stats.downloaders.usersWithConnected})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded-md px-3 py-1.5 ${
                    filter === "all" ? "bg-[#1ed760] text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Todos ({stats.downloaders.usersWithAnyDevice})
                </button>
              </div>
            </div>

            {users.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-500">
                {filter === "online"
                  ? "Nenhum PC online no momento."
                  : "Nenhum dispositivo registrado ainda."}
              </p>
            ) : (
              <div className="divide-y divide-white/5">
                {users.map((user) => (
                  <article key={user.userId} className="px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{user.name}</p>
                        <p className="truncate text-xs text-zinc-500">{user.email}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {!user.active ? (
                            <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-300">
                              Inativo
                            </span>
                          ) : null}
                          {user.poolsVip ? (
                            <span className="rounded bg-[#1ed760]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#1ed760]">
                              VIP
                            </span>
                          ) : (
                            <span className="rounded bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                              Sem VIP
                            </span>
                          )}
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                            {user.onlineCount} online · {user.deviceCount} PC
                            {user.deviceCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ul className="mt-3 space-y-2">
                      {user.devices.map((device) => (
                        <li
                          key={device.id}
                          className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
                            device.isOnline
                              ? "border-[#1ed760]/30 bg-[#1ed760]/5"
                              : "border-white/8 bg-black/20"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">
                              <span
                                className={`mr-2 inline-block h-2 w-2 rounded-full ${
                                  device.isOnline ? "bg-[#1ed760]" : "bg-zinc-600"
                                }`}
                              />
                              {device.deviceName || device.deviceId}
                            </p>
                            <p className="mt-0.5 truncate text-zinc-500">
                              {device.platform} · v{device.appVersion || "?"} · {device.deviceId}
                            </p>
                          </div>
                          <p className={`tabular-nums ${device.isOnline ? "text-[#1ed760]" : "text-zinc-500"}`}>
                            {device.isOnline ? "Online" : "Offline"} · {formatRelative(device.lastSeenAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
