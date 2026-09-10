import { DOWNLOADER_NAME } from "../../lib/site";
import { useLocale } from "../../i18n/LocaleContext";
import type { ConnectionState } from "../../lib/download/types";
import type { DeviceInfo } from "../../context/AuthContext";

type ConnectionStatusProps = {
  device: DeviceInfo;
  connectionState: ConnectionState;
  error?: string | null;
};

export function ConnectionStatus({ device, connectionState, error }: ConnectionStatusProps) {
  const { t } = useLocale();
  const isOffline = connectionState === "offline";
  const isConnecting = connectionState === "connecting";

  return (
    <div
      className={`rounded-2xl border px-3 py-2.5 ${
        isOffline || error
          ? "border-red-500/20 bg-red-500/[0.06]"
          : "border-[#1ed760]/20 bg-[#1ed760]/[0.06]"
      }`}
    >
      <p className="text-[0.6rem] font-extrabold tracking-[0.14em] text-zinc-500 uppercase">
        {DOWNLOADER_NAME}
      </p>
      <p
        className={`mt-1.5 flex items-center gap-1.5 text-[0.72rem] font-extrabold ${
          isOffline ? "text-red-400" : isConnecting ? "text-zinc-400" : "text-[#1ed760]"
        }`}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            isOffline
              ? "bg-red-400"
              : isConnecting
                ? "animate-soft-pulse bg-zinc-500"
                : "bg-[#1ed760] shadow-[0_0_0_3px_rgba(30,215,96,0.18)]"
          }`}
          aria-hidden
        />
        {isOffline
          ? t("connectionNoConnection")
          : isConnecting
            ? t("connectionConnecting")
            : t("connectionConnected")}
      </p>
      <p className="mt-1.5 truncate text-[0.72rem] font-bold text-white">{device.deviceName}</p>
      <p className="text-[0.65rem] text-zinc-500">{device.platformLabel}</p>
      {error && <p className="mt-1.5 text-[0.65rem] leading-relaxed text-red-400">{error}</p>}
    </div>
  );
}
