import { ExternalLink, Loader2 } from "lucide-react";
import { useServerJobs } from "../hooks/useServerJobs";
import { Button } from "../components/ui/Button";
import { JobRow } from "../components/downloads/JobRow";
import { openPlatform } from "../lib/open-site";
import { EmptyQueueState } from "../components/downloads/EmptyQueueState";
import { useLocale } from "../i18n/LocaleContext";

export function CompletedPage() {
  const { t } = useLocale();
  const { jobs, loading, error } = useServerJobs({ status: "COMPLETED", limit: 500, pollMs: 5000 });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1db954]">
            {t("completedTitle")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {jobs.length === 0
              ? t("completedNoneRecent")
              : t("completedSummary", { count: jobs.length })}
          </p>
        </div>
        <Button variant="secondary" className="text-xs sm:text-sm" onClick={() => void openPlatform()}>
          <ExternalLink className="h-4 w-4" />
          {t("commonOpenPlatform")}
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1db954]" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyQueueState offline={false} />
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} isActive={false} />
          ))}
        </div>
      )}
    </div>
  );
}
