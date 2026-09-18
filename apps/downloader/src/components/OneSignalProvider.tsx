import { useEffect, useState, type ReactNode } from "react";
import { Bell } from "lucide-react";
import {
  initDownloaderOneSignal,
  isDownloaderOneSignalConfigured,
  markOneSignalVerifySeen,
  shouldShowOneSignalVerify,
} from "../lib/onesignal";
import { useLocale } from "../i18n/LocaleContext";

type Props = { children: ReactNode };

export function OneSignalProvider({ children }: Props) {
  const { t } = useLocale();
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await initDownloaderOneSignal();
      if (cancelled || !ok) return;
      if (shouldShowOneSignalVerify()) setShowVerify(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss() {
    markOneSignalVerifySeen();
    setShowVerify(false);
  }

  return (
    <>
      {children}
      {showVerify && isDownloaderOneSignalConfigured() ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12161c] p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[#1ed760]/15 p-2 text-[#1ed760]">
                <Bell className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white">{t("onesignalReadyTitle")}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {t("onesignalReadyBody")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="mt-5 w-full rounded-full bg-[#1ed760] px-4 py-2.5 text-sm font-bold text-black"
            >
              {t("onesignalGotIt")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
