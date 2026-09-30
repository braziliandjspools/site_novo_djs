import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  History,
  ListOrdered,
  RefreshCw,
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
  accent: string;
  iconBg: string;
  borderHover: string;
}[] = [
  {
    route: "downloads",
    labelKey: "navDownloads",
    descriptionKey: "homeQuickDownloadsDesc",
    icon: Download,
    accent: "text-sky-300",
    iconBg: "bg-sky-500/15 text-sky-300",
    borderHover: "hover:border-sky-400/40 hover:bg-sky-500/5",
  },
  {
    route: "queue",
    labelKey: "navQueue",
    descriptionKey: "homeQuickQueueDesc",
    icon: ListOrdered,
    accent: "text-teal-300",
    iconBg: "bg-teal-500/15 text-teal-300",
    borderHover: "hover:border-teal-400/40 hover:bg-teal-500/5",
  },
  {
    route: "completed",
    labelKey: "navCompleted",
    descriptionKey: "homeQuickCompletedDesc",
    icon: CheckCircle2,
    accent: "text-[#ff2ea6]",
    iconBg: "bg-[#ff2ea6]/15 text-[#ff2ea6]",
    borderHover: "hover:border-[#ff2ea6]/40 hover:bg-[#ff2ea6]/5",
  },
  {
    route: "history",
    labelKey: "navHistory",
    descriptionKey: "homeQuickHistoryDesc",
    icon: History,
    accent: "text-amber-300",
    iconBg: "bg-amber-500/15 text-amber-300",
    borderHover: "hover:border-amber-400/40 hover:bg-amber-500/5",
  },
  {
    route: "settings",
    labelKey: "navSettings",
    descriptionKey: "homeQuickSettingsDesc",
    icon: Settings,
    accent: "text-rose-300",
    iconBg: "bg-rose-500/15 text-rose-300",
    borderHover: "hover:border-rose-400/40 hover:bg-rose-500/5",
  },
];

export function HomePage({ onNavigate }: HomePageProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const { jobs, connectionState, activeJobIds, pendingCount, syncNow, workerError, jobMetrics } = useDownloadManager();
  const counts = countByStatus(jobs, activeJobIds);
  const isOffline = connectionState === "offline";
  const speed = activeJobIds.reduce((sum, id) => sum + (jobMetrics[id]?.speedBytesPerSec ?? 0), 0);
  const [syncing, setSyncing] = useState(false);
  const lastOfflineToast = useRef(false);
  const lastWorkerError = useRef<string | null>(null);

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
          tone="sky"
          onClick={() => onNavigate("downloads")}
        />
        <StatCard
          label={t("homeStatsQueue")}
          value={counts.queue || pendingCount}
          hint={t("homeStatQueueHint")}
          tone="teal"
          onClick={() => onNavigate("queue")}
        />
        <StatCard
          label={t("homeStatsCompleted")}
          value={counts.completed}
          hint={t("homeStatCompletedHint")}
          tone="green"
          onClick={() => onNavigate("completed")}
        />
        <StatCard
          label={t("homeStatConnection")}
          value={isOffline ? t("commonOffline") : connectionState === "connecting" ? t("connectionConnecting") : t("commonOnline")}
          hint={isOffline ? t("homeStatConnectionOffline") : connectionState === "connecting" ? t("connectionConnecting") : t("homeStatConnectionOnline")}
          tone={connectionState !== "online" ? "amber" : "emerald"}
          onClick={handleSync}
        />
      </div>

      <HomeActivity />

      <section>
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#ff2ea6]">{t("navMenu")}</p>
            <h2 className="text-xl font-bold text-white">{t("homeQuickAccess")}</h2>
          </div>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ route, labelKey, descriptionKey, icon: Icon, accent, iconBg, borderHover }) => {
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
                className={`studio-shortcut group flex min-h-[148px] flex-col rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-5 text-left transition-colors ${borderHover}`}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {badge > 0 && (
                    <span className="rounded-md bg-[#ff2ea6] px-2.5 py-1 text-xs font-bold text-black">
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="text-[1.05rem] font-bold text-white">{t(labelKey)}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-400">{t(descriptionKey)}</p>
                <span
                  className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium ${accent}`}
                >
                  {t("commonOpen")}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </section>


    </div>
  );
}

const STAT_TONES = {
  sky: {
    card: "border-sky-500/25 bg-gradient-to-br from-sky-500/15 to-[var(--bg-card)]",
    label: "text-sky-300/80",
    value: "text-sky-200",
  },
  teal: {
    card: "border-teal-500/25 bg-gradient-to-br from-teal-500/15 to-[var(--bg-card)]",
    label: "text-teal-300/80",
    value: "text-teal-200",
  },
  green: {
    card: "border-[#ff2ea6]/25 bg-gradient-to-br from-[#ff2ea6]/15 to-[var(--bg-card)]",
    label: "text-[#ff2ea6]/80",
    value: "text-[#ff2ea6]",
  },
  emerald: {
    card: "border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 to-[var(--bg-card)]",
    label: "text-emerald-300/80",
    value: "text-emerald-300",
  },
  amber: {
    card: "border-amber-500/25 bg-gradient-to-br from-amber-500/15 to-[var(--bg-card)]",
    label: "text-amber-300/80",
    value: "text-amber-300",
  },
} as const;

function StatCard({
  label,
  value,
  hint,
  tone,
  onClick,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: keyof typeof STAT_TONES;
  onClick: () => void;
}) {
  const colors = STAT_TONES[tone];
  return (
    <button type="button" onClick={onClick} className={`studio-stat rounded-2xl border px-5 py-5 text-left ${colors.card}`}>
      <p className={`text-[0.7rem] font-extrabold uppercase tracking-[0.12em] ${colors.label}`}>{label}</p>
      <p className={`mt-2 text-3xl font-black tracking-tight ${colors.value}`}>{value}</p>
      <p className="mt-1.5 text-sm text-zinc-500">{hint}</p>
    </button>
  );
}
