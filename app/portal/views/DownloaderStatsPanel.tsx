"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HardDrive,
  Loader2,
  Monitor,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { formatBytes } from "../../lib/format-bytes";
import { PortalCard } from "../PortalShell";
import { formatDateBr } from "../portal-types";

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

type RecentJob = {
  id: number;
  fileName: string;
  status: string;
  progress: number;
  completedAt: string | null;
  createdAt: string;
  error: string | null;
};

type DownloaderStatsPayload = {
  generatedAt: string;
  onlineWindowSeconds: number;
  devices: {
    total: number;
    online: number;
    items: DeviceRow[];
  };
  jobs: {
    pending: number;
    downloading: number;
    paused: number;
    failed: number;
    completed: number;
    cancelled: number;
    inQueue: number;
    completedBytes: string;
  };
  recent: RecentJob[];
  error?: string;
};

function statusLabel(status: string): string {
  switch (status) {
    case "PENDING":
    case "RECEIVED":
      return "Na fila";
    case "DOWNLOADING":
      return "Baixando";
    case "PAUSED":
      return "Pausado";
    case "COMPLETED":
      return "Concluído";
    case "FAILED":
      return "Falhou";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}

function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-[#0a0a0a] px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-black tabular-nums tracking-tight ${
          accent ? "text-[#00ff9d]" : "text-white"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function DownloaderStatsPanel() {
  const [data, setData] = useState<DownloaderStatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/portal/downloader/stats", { cache: "no-store" });
    const json = (await res.json()) as DownloaderStatsPayload;
    if (!res.ok) {
      throw new Error(json.error ?? "Não foi possível carregar as estatísticas.");
    }
    setData(json);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar estatísticas.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar.");
    } finally {
      setRefreshing(false);
    }
  }

  const completedBytesLabel = (() => {
    const n = Number(data?.jobs.completedBytes ?? 0);
    if (!Number.isFinite(n) || n <= 0) return "0 B";
    return formatBytes(n);
  })();

  return (
    <PortalCard
      title="Estatísticas do Downloader"
      action={
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Atualizar
        </button>
      }
    >
      <div className="mb-4 flex items-start gap-3">
        <HardDrive className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00ff9d]" />
        <p className="text-sm text-zinc-400">
          Uso do BRS Downloader na sua conta: PCs conectados, fila e downloads
          concluídos.
        </p>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 py-6 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando estatísticas…
        </div>
      ) : error && !data ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : data ? (
        <>
          {error && (
            <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="PCs online"
              value={data.devices.online}
              hint={`Online se visto nos últimos ${data.onlineWindowSeconds}s`}
              accent={data.devices.online > 0}
            />
            <StatTile
              label="PCs registrados"
              value={data.devices.total}
              hint="Computadores que já abriram o app"
            />
            <StatTile
              label="Na fila"
              value={data.jobs.inQueue}
              hint={`${data.jobs.downloading} baixando · ${data.jobs.paused} pausados`}
            />
            <StatTile
              label="Concluídos"
              value={data.jobs.completed.toLocaleString("pt-BR")}
              hint={`${completedBytesLabel} · ${data.jobs.failed} falhas`}
            />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Seus computadores
            </p>
            {data.devices.items.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nenhum PC registrado ainda. Abra o BRS Downloader com o login desta
                conta.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.devices.items.map((device) => (
                  <li
                    key={device.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-[#0a0a0a] px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <Monitor className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {device.deviceName}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {device.platform} · v{device.appVersion}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[11px]">
                      {device.isOnline ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#00ff9d]">
                          <Wifi className="h-3.5 w-3.5" />
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-zinc-500">
                          <WifiOff className="h-3.5 w-3.5" />
                          Offline
                        </span>
                      )}
                      <p className="mt-0.5 text-zinc-600">
                        {device.lastSeenAt
                          ? `Visto ${formatDateBr(device.lastSeenAt)}`
                          : "Nunca sincronizou"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {data.recent.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                Atividade recente
              </p>
              <ul className="space-y-1.5">
                {data.recent.map((job) => (
                  <li
                    key={job.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800/80 px-3 py-2 text-sm"
                  >
                    <p className="min-w-0 flex-1 truncate text-zinc-300">{job.fileName}</p>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        job.status === "COMPLETED"
                          ? "text-[#00ff9d]"
                          : job.status === "FAILED"
                            ? "text-red-400"
                            : job.status === "DOWNLOADING"
                              ? "text-[#FFDF00]"
                              : "text-zinc-500"
                      }`}
                    >
                      {statusLabel(job.status)}
                      {job.status === "DOWNLOADING" ? ` ${job.progress}%` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : null}
    </PortalCard>
  );
}
