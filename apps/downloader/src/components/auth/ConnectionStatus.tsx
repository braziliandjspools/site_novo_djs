import { DOWNLOADER_NAME } from "../../lib/site";
import type { ConnectionState } from "../../lib/download/types";
import type { DeviceInfo } from "../../context/AuthContext";

type ConnectionStatusProps = {
  device: DeviceInfo;
  connectionState: ConnectionState;
  error?: string | null;
};

export function ConnectionStatus({ device, connectionState, error }: ConnectionStatusProps) {
  const isOffline = connectionState === "offline";
  const isConnecting = connectionState === "connecting";

  return (
    <div
      className={`rounded-2xl border px-3.5 py-3.5 ${
        isOffline || error
          ? "border-red-500/20 bg-red-500/[0.06]"
          : "border-[#1db954]/20 bg-[#1db954]/[0.06]"
      }`}
    >
      <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
        {DOWNLOADER_NAME}
      </p>
      <p
        className={`mt-2 flex items-center gap-2 text-sm font-semibold ${
          isOffline ? "text-red-400" : isConnecting ? "text-zinc-400" : "text-[#1db954]"
        }`}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isOffline
              ? "bg-red-400"
              : isConnecting
                ? "bg-zinc-500"
                : "bg-[#1db954] shadow-[0_0_0_3px_rgba(29,185,84,0.18)]"
          }`}
          aria-hidden
        />
        {isOffline ? "Sem conexão" : isConnecting ? "Conectando…" : "Conectado"}
      </p>
      <p className="mt-2 truncate text-sm font-bold tracking-wide text-white">{device.deviceName}</p>
      <p className="text-xs text-zinc-500">{device.platformLabel}</p>
      {error && <p className="mt-2 text-[11px] leading-relaxed text-red-400">{error}</p>}
    </div>
  );
}
