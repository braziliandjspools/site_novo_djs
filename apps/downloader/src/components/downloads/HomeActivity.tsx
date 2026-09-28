import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { useDownloadManager } from "../../context/DownloadManagerContext";
import { useLocale } from "../../i18n/LocaleContext";
import { filterFinderJobs, type DownloadFinderFilter } from "../../lib/download/job-finder";
import { DownloadFinderToolbar } from "./DownloadFinderToolbar";
import { JobRow } from "./JobRow";

export function HomeActivity() {
  const { t } = useLocale();
  const { jobs, activeJobIds, jobMetrics, pauseJob, resumeJob, retryJob } = useDownloadManager();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DownloadFinderFilter>("all");
  const [expanded, setExpanded] = useState(false);
  const result = useMemo(() => filterFinderJobs(jobs, { query, filter }), [jobs, query, filter]);
  const ordered = useMemo(() => [...result.visible].sort((a, b) => {
    const active = Number(activeJobIds.includes(b.id)) - Number(activeJobIds.includes(a.id));
    return active || (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0);
  }), [result.visible, activeJobIds]);
  const visible = ordered.slice(0, expanded ? 30 : 4);
  return (
    <section className="studio-activity rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-eyebrow text-[var(--accent)]">{t("homeRecentActivity")}</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{t("homeRecentTitle")}</h2>
        </div>
        <Activity className="h-5 w-5 text-[var(--accent)]" aria-hidden />
      </div>
      <DownloadFinderToolbar query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} counts={result.counts} />
      <div className="mt-4 space-y-2">
        {visible.map(job => (
          <JobRow key={job.id} job={job} isActive={activeJobIds.includes(job.id)} metrics={jobMetrics[job.id]}
            onPause={() => pauseJob(job.id)} onResume={() => resumeJob(job.id)} onRetry={() => retryJob(job.id)} />
        ))}
        {!visible.length && <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-400">{t("homeNoItems")}</p>}
      </div>
      {ordered.length > 4 && (
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}
          className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--accent)] hover:bg-white/5">
          {t(expanded ? "homeActivityLess" : "homeActivityMore")} ({visible.length}/{ordered.length})
        </button>
      )}
    </section>
  );
}
