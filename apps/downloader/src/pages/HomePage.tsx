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
    accent: "text-[#1ed760]",
    iconBg: "bg-[#1ed760]/15 text-[#1ed760]",
    borderHover: "hover:border-[#1ed760]/40 hover:bg-[#1ed760]/5",
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

export function HomePage({ userName, onNavigate }: HomePageProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const { jobs, connectionState, activeJobIds, pendingCount, syncNow, workerError } = useDownloadManager();
  const firstName = userName.split(" ")[0] ?? userName;
  const counts = countByStatus(jobs, activeJobIds);
  const isOffline = connectionState === "offline";
  const recentJobs = jobs.slice(0, 5);
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
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <img
          src="/images/home-hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/72 to-black/45" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" aria-hidden />
        <div className="br-stripe-thin absolute inset-x-0 top-0 z-10" />

        <div className="relative z-10 flex min-h-[220px] flex-col justify-end gap-5 p-6 sm:min-h-[260px] sm:flex-row sm:items-end sm:justify-between sm:p-8 lg:min-h-[280px]">
          <div className="max-w-2xl min-w-0">
            <p className="text-eyebrow text-[#1ed760] drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]">
              {t("homeWelcomeEyebrow")}
            </p>
            <h1 className="text-page-title mt-2 text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)]">
              {t("homeWelcome", { name: firstName })}
            </h1>
            <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-zinc-200/90 drop-shadow-[0_1px_10px_rgba(0,0,0,0.7)]">
              {t("homeIntro", { site: SITE_NAME })}
            </p>
          </div>
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("homeStatDownloading")}
          value={counts.downloading}
          hint={t("homeStatDownloadingHint", { count: activeJobIds.length })}
          tone="sky"
        />
        <StatCard
          label={t("homeStatsQueue")}
          value={counts.queue || pendingCount}
          hint={t("homeStatQueueHint")}
          tone="teal"
        />
        <StatCard
          label={t("homeStatsCompleted")}
          value={counts.completed}
          hint={t("homeStatCompletedHint")}
          tone="green"
        />
        <StatCard
          label={t("homeStatConnection")}
          value={isOffline ? t("commonOffline") : t("commonOnline")}
          hint={isOffline ? t("homeStatConnectionOffline") : t("homeStatConnectionOnline")}
          tone={isOffline ? "amber" : "emerald"}
        />
      </div>

      <ImportPackPanel />

      <section>
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#1db954]">{t("navMenu")}</p>
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
                className={`group flex min-h-[148px] flex-col rounded-2xl border border-white/[0.06] bg-[#1f1f1f] p-5 text-left transition-colors ${borderHover}`}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {badge > 0 && (
                    <span className="rounded-md bg-[#1db954] px-2.5 py-1 text-xs font-bold text-black">
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="text-[1.05rem] font-bold text-white">{t(labelKey)}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-400">{t(descriptionKey)}</p>
                <span
                  className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100 ${accent}`}
                >
                  {t("commonOpen")}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1a1a]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t("homeRecentActivity")}
            </p>
            <h2 className="text-lg font-bold text-white">{t("homeRecentTitle")}</h2>
          </div>
          {jobs.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate("queue")}
              className="text-sm font-semibold text-[#1db954] hover:underline"
            >
              {t("homeViewFullQueue")}
            </button>
          )}
        </div>
        {recentJobs.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-base text-zinc-500">{t("homeNoItems")}</p>
            <Button className="mt-4" onClick={() => void openPlatform()}>
              <ExternalLink className="h-4 w-4" />
              {t("commonOpenPlatform")}
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {recentJobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-4 px-5 py-4 text-base sm:px-6">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{job.fileName}</p>
                  <p className="truncate text-sm text-zinc-500">{job.relativePath ?? job.provider}</p>
                </div>
                <span className="flex-shrink-0 rounded-md bg-white/5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-300">
                  {job.status}
                </span>
              </li>
            ))}
          </ul>
        )}
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
    card: "border-[#1ed760]/25 bg-gradient-to-br from-[#1ed760]/15 to-[var(--bg-card)]",
    label: "text-[#1ed760]/80",
    value: "text-[#1ed760]",
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
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: keyof typeof STAT_TONES;
}) {
  const colors = STAT_TONES[tone];
  return (
    <div className={`rounded-2xl border px-4 py-4 ${colors.card}`}>
      <p className={`text-[0.7rem] font-extrabold uppercase tracking-[0.12em] ${colors.label}`}>{label}</p>
      <p className={`mt-2 text-2xl font-black tracking-tight ${colors.value}`}>{value}</p>
      <p className="mt-1.5 text-sm text-zinc-500">{hint}</p>
    </div>
  );
}
