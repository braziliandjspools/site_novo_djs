import { AlertTriangle, Ban } from "lucide-react";
import { supportWhatsAppUrl } from "../../lib/site";
import { openPlatform } from "../../lib/open-site";
import type { DownloadAbuseStatus } from "../../lib/api/abuse";

type AbuseBannerProps = {
  abuse: DownloadAbuseStatus;
};

export function AbuseBanner({ abuse }: AbuseBannerProps) {
  if (!abuse.banned && !abuse.alerted) return null;

  const banned = abuse.banned;
  const message =
    abuse.message ||
    (banned
      ? "Downloads bloqueados por uso abusivo."
      : "Padrão de download suspeito detectado.");

  return (
    <div
      role="alert"
      className={`mx-5 mt-3 flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        banned
          ? "border-red-500/40 bg-red-500/10 text-red-100"
          : "border-amber-500/40 bg-amber-500/10 text-amber-50"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        {banned ? (
          <Ban className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight">
            {banned ? "Downloads travados" : "Alerta de uso"}
            {abuse.onTestPlan ? " · Plano Teste" : ""}
          </p>
          <p className="mt-0.5 text-[0.82rem] leading-snug opacity-90">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void openPlatform(supportWhatsAppUrl())}
        className="shrink-0 rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-semibold hover:bg-black/35"
      >
        Falar no WhatsApp
      </button>
    </div>
  );
}
