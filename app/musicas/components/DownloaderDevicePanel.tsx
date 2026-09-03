"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MonitorDown, Trash2 } from "lucide-react";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasToast } from "./MusicasToast";

export function DownloaderDevicePanel({ className = "mx-3 mb-4" }: { className?: string }) {
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  if (!sync) return null;

  const { loading, devices, totalQueueCount, selectedTarget, setSelectedTarget, clearQueue } = sync;
  const onlineDevices = devices.filter((device) => device.isOnline);

  function armClearConfirm() {
    setConfirmClear(true);
    showToast("Clique de novo em Zerar fila para confirmar.", "error");
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => setConfirmClear(false), 5000);
  }

  async function handleClearQueue() {
    if (totalQueueCount <= 0 || clearing) return;

    if (!confirmClear) {
      armClearConfirm();
      return;
    }

    setConfirmClear(false);
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }

    setClearing(true);
    try {
      const cleared = await clearQueue();
      showToast(
        cleared === 0
          ? "Fila já estava vazia."
          : cleared === 1
            ? "1 item removido da fila. Pode reenviar o que quiser."
            : `${cleared} itens removidos da fila. Pode reenviar o que quiser.`,
        "success",
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível zerar a fila.", "error");
    } finally {
      setClearing(false);
    }
  }

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

      {totalQueueCount > 0 && (
        <button
          type="button"
          onClick={() => void handleClearQueue()}
          disabled={clearing}
          className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
            confirmClear
              ? "border-red-500/60 bg-red-500/15 text-red-300"
              : "border-zinc-700 bg-black/40 text-zinc-300 hover:border-red-500/40 hover:text-red-300"
          }`}
        >
          {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {confirmClear ? "Confirmar zerar fila" : "Zerar fila"}
        </button>
      )}
    </div>
  );
}
