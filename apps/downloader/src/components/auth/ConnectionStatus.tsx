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
      className={`rounded-[var(--radius-lg)] border px-3 py-2.5 ${
        isOffline || error
          ? "border-red-400/25 bg-[#3a2020]/60"
          : "border-[var(--line)] bg-[var(--bg-card)]"
      }`}
    >
      <p className="text-[0.62rem] font-semibold tracking-[0.06em] text-[var(--text-subtle)] uppercase">
        {DOWNLOADER_NAME}
      </p>
      <p
        className={`mt-1.5 flex items-center gap-1.5 text-[0.75rem] font-semibold ${
          isOffline ? "text-[#ffb3ba]" : isConnecting ? "text-[var(--text-muted)]" : "text-white"
        }`}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            isOffline
              ? "bg-[#ff99a4]"
              : isConnecting
                ? "animate-soft-pulse bg-[var(--text-subtle)]"
                : "bg-[var(--success)]"
          }`}
          aria-hidden
        />
        {isOffline
          ? t("connectionNoConnection")
          : isConnecting
            ? t("connectionConnecting")
            : t("connectionConnected")}
      </p>
      <p className="mt-1.5 truncate text-[0.75rem] font-medium text-white">{device.deviceName}</p>
      <p className="text-[0.68rem] text-[var(--text-subtle)]">{device.platformLabel}</p>
      {error && <p className="mt-1.5 text-[0.68rem] leading-relaxed text-[#ffb3ba]">{error}</p>}
    </div>
  );
}
