import type { ConnectionState } from "../../lib/download/types";
import type { DeviceInfo } from "../../context/AuthContext";

type ConnectionStatusProps = {
  device: DeviceInfo;
  connectionState: ConnectionState;
};

export function ConnectionStatus({ device, connectionState }: ConnectionStatusProps) {
  const isOffline = connectionState === "offline";
  const isConnecting = connectionState === "connecting";

  return (
    <div
      className={`rounded-lg border px-3 py-3 ${
        isOffline
          ? "border-red-500/20 bg-red-500/5"
          : "border-[#1ed760]/20 bg-[#1ed760]/5"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
        Brazilian Packs Downloader
      </p>
      <p
        className={`mt-2 flex items-center gap-2 text-sm font-semibold ${
          isOffline ? "text-red-400" : isConnecting ? "text-zinc-400" : "text-[#1ed760]"
        }`}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isOffline ? "bg-red-400" : isConnecting ? "bg-zinc-500" : "bg-[#1ed760]"
          }`}
          aria-hidden
        />
        {isOffline ? "Sem conexão" : isConnecting ? "Conectando…" : "Conectado"}
      </p>
      <p className="mt-2 truncate text-sm font-bold uppercase tracking-wide text-white">
        {device.deviceName}
      </p>
      <p className="text-xs text-zinc-500">{device.platformLabel}</p>
    </div>
  );
}
