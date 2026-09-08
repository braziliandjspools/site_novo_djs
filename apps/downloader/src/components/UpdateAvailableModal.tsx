"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "./ui/Button";
import { useLocale } from "../i18n/LocaleContext";
import { APP_VERSION } from "../lib/api/config";
import { dismissUpdateModal, subscribeUpdateModal } from "../lib/update-modal";
import { openUpdateDownload, type LatestUpdateResponse } from "../lib/updater";

type LatestInfo = NonNullable<LatestUpdateResponse["latest"]>;

/** Popup centralizado quando há nova versão (login / verificar atualizações). */
export function UpdateAvailableModal() {
  const { t } = useLocale();
  const [latest, setLatest] = useState<LatestInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeUpdateModal(setLatest), []);

  if (!latest) return null;

  async function handleInstall() {
    if (!latest || busy) return;
    setBusy(true);
    setError(null);
    try {
      await openUpdateDownload(latest.downloadUrl);
      dismissUpdateModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("notificationsUpdateDownloadFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#181818] shadow-2xl shadow-black/50">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1db954]/60 to-transparent" />

        <button
          type="button"
          onClick={() => dismissUpdateModal()}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
          aria-label={t("commonClose")}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-6 pt-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1db954]/15 text-[#1db954] ring-1 ring-[#1db954]/30">
            <RefreshCw className="h-7 w-7" />
          </div>

          <h2 id="update-modal-title" className="mt-5 text-center text-xl font-bold text-white">
            {t("updaterNewVersion", { version: latest.version })}
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            {t("updaterModalInstalled", { version: APP_VERSION })}
          </p>

          {latest.notes?.trim() ? (
            <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                {t("updaterNotes")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{latest.notes.trim()}</p>
            </div>
          ) : (
            <p className="mt-4 text-center text-sm text-zinc-500">{t("updaterDefaultBody")}</p>
          )}

          {error ? (
            <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => void handleInstall()}
              className="w-full sm:w-auto"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? t("settingsDownloadingUpdate") : t("notificationsDownloadUpdate")}
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => dismissUpdateModal()}
              className="w-full sm:w-auto"
            >
              {t("updaterModalLater")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
