import { ExternalLink, MonitorDown } from "lucide-react";
import { Button } from "../ui/Button";
import { openPlatform } from "../../lib/open-site";
import { useLocale } from "../../i18n/LocaleContext";

type EmptyQueueStateProps = {
  offline?: boolean;
};

export function EmptyQueueState({ offline = false }: EmptyQueueStateProps) {
  const { t } = useLocale();

  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#1a1a1a] px-6 py-14 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1db954]/12 text-[#1db954]">
        <MonitorDown className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <h2 className="text-xl font-bold text-white">
        {offline ? t("homeStatConnectionOffline") : t("jobsEmptyQueue")}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
        {offline ? t("homeOfflineWarning") : t("jobsEmptyHint")}
      </p>
      {!offline && (
        <Button className="mt-8" onClick={() => void openPlatform()}>
          <ExternalLink className="h-4 w-4" />
          {t("commonOpenPlatform")}
        </Button>
      )}
    </div>
  );
}
