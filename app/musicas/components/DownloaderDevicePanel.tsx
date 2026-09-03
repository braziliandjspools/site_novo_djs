"use client";

import { MonitorDown } from "lucide-react";
import { useDownloaderSync } from "./DownloaderSyncContext";

export function DownloaderDevicePanel({ className = "mx-3 mb-4" }: { className?: string }) {
  const sync = useDownloaderSync();
  if (!sync) return null;

  const { loading, devices, totalQueueCount, selectedTarget, setSelectedTarget } = sync;
  const onlineDevices = devices.filter((device) => device.isOnline);

  return (
    <div id="downloader-panel" className={`rounded-lg border border-zinc-800 bg-[#121212] p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <MonitorDown className="h-4 w-4 text-[#1ed760]" />
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white">BRS Downloader</p>
      </div>

      {loading && devices.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500">Sincronizando…</p>
      ) : onlineDevices.length === 0 ? (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-zinc-400">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-zinc-600" />
            Nenhum computador conectado
          </p>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Abra ou instale o BRS Downloader
          </p>
        </div>
      ) : onlineDevices.length === 1 ? (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-zinc-300">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#1ed760]" />
            {onlineDevices[0]!.deviceName} conectado
          </p>
          <p className="text-[11px] text-zinc-500">
            Fila neste PC: {onlineDevices[0]!.queueCount}
            {totalQueueCount !== onlineDevices[0]!.queueCount ? (
              <span className="text-zinc-600"> · total na conta: {totalQueueCount}</span>
            ) : null}
          </p>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {onlineDevices.map((device) => (
            <p key={device.deviceId} className="text-xs text-zinc-300">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#1ed760]" />
              {device.deviceName} · fila {device.queueCount}
            </p>
          ))}
          <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
            Enviar para
          </label>
          <select
            value={selectedTarget ?? "all"}
            onChange={(event) => setSelectedTarget(event.target.value as typeof selectedTarget)}
            className="w-full rounded-md border border-zinc-700 bg-black px-2 py-1.5 text-xs text-white"
          >
            <option value="all">Todos</option>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.deviceName}
                {device.isOnline ? "" : " (offline)"}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-zinc-500">Fila total: {totalQueueCount}</p>
        </div>
      )}
    </div>
  );
}
