import { Monitor, Terminal } from "lucide-react";
import { Button } from "./ui/Button";
import { isDesktopRuntime } from "../lib/native/download";
import { useLocale } from "../i18n/LocaleContext";

type DesktopRequiredNoticeProps = {
  variant?: "full" | "banner";
};

const DEV_SERVER_URL = "http://localhost:1420";

export function DesktopRequiredNotice({ variant = "full" }: DesktopRequiredNoticeProps) {
  const { t } = useLocale();

  if (isDesktopRuntime()) return null;

  if (variant === "banner") {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        {t("desktopBanner")}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
        <Monitor className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <h1 className="max-w-lg text-2xl font-bold text-white">{t("desktopRequiredTitle")}</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
        {t("desktopBrowserExplain", { url: DEV_SERVER_URL })}
      </p>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-500">{t("desktopCloseTabHint")}</p>
      <div className="mt-8 w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-left">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          <Terminal className="h-3.5 w-3.5" />
          {t("desktopTerminalLabel")}
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-black px-4 py-3 text-sm text-[#1db954]">
          cd D:\Downloads\brazilian-packs-landing{"\n"}npm run downloader:dev
        </pre>
      </div>
      <Button
        variant="secondary"
        className="mt-6"
        onClick={() => {
          window.location.reload();
        }}
      >
        {t("desktopOpenDesktop")}
      </Button>
    </div>
  );
}

export function useIsDesktopApp() {
  return isDesktopRuntime();
}
