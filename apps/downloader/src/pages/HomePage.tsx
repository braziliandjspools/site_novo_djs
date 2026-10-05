import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  History,
  ListOrdered,
  RefreshCw,
  Search,
  Settings,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { useDownloadManager } from "../context/DownloadManagerContext";
import { openPlatform } from "../lib/open-site";
import { SITE_NAME } from "../lib/site";
import type { AppRoute } from "../components/layout/Sidebar";
import type { DownloadJob } from "../lib/api/jobs";
import { HomeActivity } from "../components/downloads/HomeActivity";
import { formatSpeed } from "../lib/download/progress-tracker";
import { ImportPackPanel } from "../components/ImportPackPanel";
import { useLocale, type MessageKey } from "../i18n/LocaleContext";
import { isMusicSearchEnabled } from "../lib/features";

type HomePageProps = {
  userName: string;
  onNavigate: (route: AppRoute) => void;
};

function countByStatus(jobs: DownloadJob[], activeJobIds: number[]) {
  const downloading = jobs.filter(
    (job) => job.status === "DOWNLOADING" || job.status === "PAUSED" || activeJobIds.includes(job.id),
  ).length;
  const queue = jobs.filter(
    (job) => job.status === "PENDING" || job.status === "RECEIVED" || job.status === "FAILED",
  ).length;
  const completed = jobs.filter((job) => job.status === "COMPLETED").length;
  return { downloading, queue, completed, total: jobs.length };
}

const QUICK_LINKS: {
  route: AppRoute;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  icon: typeof Download;
}[] = [
  {
    route: "downloads",
    labelKey: "navDownloads",
    descriptionKey: "homeQuickDownloadsDesc",
    icon: Download,
  },
  {
    route: "queue",
    labelKey: "navQueue",
    descriptionKey: "homeQuickQueueDesc",
    icon: ListOrdered,
  },
  {
    route: "completed",
    labelKey: "navCompleted",
    descriptionKey: "homeQuickCompletedDesc",
    icon: CheckCircle2,
  },
  {
    route: "history",
    labelKey: "navHistory",
    descriptionKey: "homeQuickHistoryDesc",
    icon: History,
  },
  {
    route: "search",
    labelKey: "navSearch",
    descriptionKey: "pagesSearchSubtitle",
    icon: Search,
  },
  {
    route: "settings",
    labelKey: "navSettings",
    descriptionKey: "homeQuickSettingsDesc",
    icon: Settings,
  },
];

export function HomePage({ userName, onNavigate }: HomePageProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const { jobs, connectionState, activeJobIds, pendingCount, syncNow, workerError, jobMetrics } = useDownloadManager();
  const counts = countByStatus(jobs, activeJobIds);
  const isOffline = connectionState === "offline";
  const speed = activeJobIds.reduce((sum, id) => sum + (jobMetrics[id]?.speedBytesPerSec ?? 0), 0);
  const [syncing, setSyncing] = useState(false);
  const lastOfflineToast = useRef(false);
  const lastWorkerError = useRef<string | null>(null);
  const firstName = (userName.split(" ")[0] ?? userName).trim() || "DJ";

  useEffect(() => {
    if (!syncing) return;
    const doneTimer = window.setTimeout(() => {
      setSyncing(false);
      showToast(t("homeSyncedBody"), "success");
    }, 1600);
    return () => window.clearTimeout(doneTimer);
  }, [showToast, syncing, t]);

  useEffect(() => {
    if (isOffline && !lastOfflineToast.current) {
      showToast(t("homeOfflineWarning"), "warning");
      lastOfflineToast.current = true;
    }
    if (!isOffline) lastOfflineToast.current = false;
  }, [isOffline, showToast, t]);

  useEffect(() => {
    if (!workerError) {
      lastWorkerError.current = null;
      return;
    }
    if (lastWorkerError.current === workerError) return;
    lastWorkerError.current = workerError;
    showToast(workerError, "error");
  }, [showToast, workerError]);

  function handleSync() {
    if (syncing) return;
    setSyncing(true);
    showToast(t("homeSyncingBody", { site: SITE_NAME }), "info");
    syncNow();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <section className="studio-hero relative overflow-hidden rounded-3xl border border-white/10">
        <img
          src="/images/home-hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/72 to-black/45" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" aria-hidden />
        <div className="br-stripe-thin absolute inset-x-0 top-0 z-10" />

        <div className="relative z-10 flex min-h-[280px] flex-col justify-end gap-4 p-5 sm:p-6">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/70">
              {t("homeWelcomeEyebrow")}
            </p>
            <h2 className="mt-1 font-display text-[1.75rem] font-semibold uppercase tracking-[-0.02em] text-white sm:text-[2.1rem]">
              {t("homeWelcome", { name: firstName })}
            </h2>
          </div>
          <ImportPackPanel embedded />
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            <Button onClick={() => void openPlatform()}>
              <ExternalLink className="h-4 w-4" />
              {t("commonOpenPlatform")}
            </Button>
            <Button variant="secondary" disabled={syncing} onClick={handleSync}>
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? t("homeSyncing") : t("homeSync")}
            </Button>
          </div>
        </div>
      </section>

      <div className="studio-live flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 px-5 py-3">
        <span className="flex items-center gap-3 text-sm text-zinc-300">
          <span className={activeJobIds.length ? "studio-signal is-active" : "studio-signal"} aria-hidden><i /><i /><i /><i /><i /></span>
          {t("homeStatDownloadingHint", { count: activeJobIds.length })}
        </span>
        <span className="font-mono text-sm tabular-nums text-[var(--accent)]">{formatSpeed(speed)}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("homeStatDownloading")}
          value={counts.downloading}
          hint={t("homeStatDownloadingHint", { count: activeJobIds.length })}
          onClick={() => onNavigate("downloads")}
        />
        <StatCard
          label={t("homeStatsQueue")}
          value={counts.queue || pendingCount}
          hint={t("homeStatQueueHint")}
          onClick={() => onNavigate("queue")}
        />
        <StatCard
          label={t("homeStatsCompleted")}
          value={counts.completed}
          hint={t("homeStatCompletedHint")}
          onClick={() => onNavigate("completed")}
        />
        <StatCard
          label={t("homeStatConnection")}
          value={isOffline ? t("commonOffline") : connectionState === "connecting" ? t("connectionConnecting") : t("commonOnline")}
          hint={isOffline ? t("homeStatConnectionOffline") : connectionState === "connecting" ? t("connectionConnecting") : t("homeStatConnectionOnline")}
          onClick={handleSync}
        />
      </div>

      <HomeActivity />

      <section>
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-eyebrow text-[var(--text-subtle)]">{t("navMenu")}</p>
            <h2 className="text-lg font-semibold text-white">{t("homeQuickAccess")}</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.filter((item) => item.route !== "search" || isMusicSearchEnabled).map(({ route, labelKey, descriptionKey, icon: Icon }) => {
            const badge =
              route === "downloads"
                ? counts.downloading
                : route === "queue"
                  ? counts.queue
                  : route === "completed"
                    ? counts.completed
                    : 0;

            return (
              <button
                key={route}
                type="button"
                onClick={() => onNavigate(route)}
                className="studio-shortcut group flex min-h-[132px] flex-col rounded-[var(--radius-lg)] border border-white/10 bg-[#0a0a0a] p-4 text-left transition-colors hover:border-[#60cdff]/35 hover:bg-[#60cdff]/[0.06]"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-control)] text-white">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  {badge > 0 && (
                    <span className="rounded-[4px] bg-white/10 px-2 py-0.5 text-[0.68rem] font-semibold text-white">
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="text-[0.95rem] font-semibold text-white">{t(labelKey)}</h3>
                <p className="mt-1 flex-1 text-[0.78rem] leading-relaxed text-[var(--text-subtle)]">{t(descriptionKey)}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-[var(--text-muted)] group-hover:text-white">
                  {t("commonOpen")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>


    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string | number;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="studio-stat rounded-[var(--radius-lg)] border border-white/10 bg-[#0a0a0a] px-4 py-4 text-left transition-colors hover:border-[#60cdff]/35 hover:bg-[#60cdff]/[0.06]"
    >
      <p className="text-eyebrow text-[var(--text-subtle)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1.5 text-[0.78rem] text-[var(--text-subtle)]">{hint}</p>
    </button>
  );
}
