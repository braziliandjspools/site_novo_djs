import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  History,
  ListOrdered,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";
import { BrsLogo } from "../components/Branding/BrsLogo";
import { Button } from "../components/ui/Button";
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
    accent: "text-violet-300",
    iconBg: "bg-violet-500/15 text-violet-300",
    borderHover: "hover:border-violet-400/40 hover:bg-violet-500/5",
  },
  {
    route: "completed",
    labelKey: "navCompleted",
    descriptionKey: "homeQuickCompletedDesc",
    icon: CheckCircle2,
    accent: "text-[#1db954]",
    iconBg: "bg-[#1db954]/15 text-[#1db954]",
    borderHover: "hover:border-[#1db954]/40 hover:bg-[#1db954]/5",
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
  const { jobs, connectionState, activeJobIds, pendingCount, syncNow, workerError } = useDownloadManager();
  const firstName = userName.split(" ")[0] ?? userName;
  const counts = countByStatus(jobs, activeJobIds);
  const isOffline = connectionState === "offline";
  const recentJobs = jobs.slice(0, 5);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  useEffect(() => {
    if (!syncing) return;
    const doneTimer = window.setTimeout(() => {
      setSyncing(false);
      setSyncDone(true);
    }, 1600);
    return () => window.clearTimeout(doneTimer);
  }, [syncing]);

  useEffect(() => {
    if (!syncDone) return;
    const hideTimer = window.setTimeout(() => setSyncDone(false), 2800);
    return () => window.clearTimeout(hideTimer);
  }, [syncDone]);

  function handleSync() {
    if (isOffline || syncing) return;
    setSyncDone(false);
    setSyncing(true);
    syncNow();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1a1a]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(29,185,84,0.12),transparent_55%)]" />
        <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <BrsLogo className="mb-5 h-12 w-auto max-w-[280px] object-contain object-left sm:h-14" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1db954]">
              {t("homeWelcomeEyebrow")}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1db954] sm:text-4xl">
              {t("homeWelcome", { name: firstName })}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
              {t("homeIntro", { site: SITE_NAME })}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            <Button onClick={() => void openPlatform()}>
              <ExternalLink className="h-4 w-4" />
              {t("commonOpenPlatform")}
            </Button>
            <Button variant="secondary" disabled={syncing || isOffline} onClick={handleSync}>
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? t("homeSyncing") : t("homeSync")}
            </Button>
          </div>
        </div>
      </section>

      {(syncing || syncDone) && (
        <div
          className={`flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 transition-all ${
            syncing
              ? "border-[#1db954]/35 bg-gradient-to-r from-[#1db954]/20 via-[#1db954]/10 to-sky-500/10"
              : "border-sky-400/30 bg-gradient-to-r from-sky-500/15 to-[#1db954]/10"
          }`}
          role="status"
          aria-live="polite"
        >
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
              syncing ? "bg-[#1db954]/20 text-[#1db954]" : "bg-sky-500/20 text-sky-300"
            }`}
          >
            {syncing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">
              {syncing ? t("homeSyncingTitle") : t("homeSyncedTitle")}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {syncing ? t("homeSyncingBody", { site: SITE_NAME }) : t("homeSyncedBody")}
            </p>
          </div>
        </div>
      )}

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
          tone="violet"
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

      {(isOffline || workerError) && (
        <div
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
            isOffline
              ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
              : "border-red-500/20 bg-red-500/10 text-red-300"
          }`}
        >
          {isOffline ? <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <Wifi className="mt-0.5 h-4 w-4 flex-shrink-0" />}
          <p>{isOffline ? t("homeOfflineWarning") : workerError}</p>
        </div>
      )}

      <ImportPackPanel />

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1db954]">{t("navMenu")}</p>
            <h2 className="text-lg font-bold text-white">{t("homeQuickAccess")}</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                className={`group flex min-h-[128px] flex-col rounded-2xl border border-white/[0.06] bg-[#1f1f1f] p-4 text-left transition-colors ${borderHover}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {badge > 0 && (
                    <span className="rounded-md bg-[#1db954] px-2 py-0.5 text-[10px] font-bold text-black">
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-white">{t(labelKey)}</h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-500">{t(descriptionKey)}</p>
                <span
                  className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100 ${accent}`}
                >
                  {t("commonOpen")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1a1a]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {t("homeRecentActivity")}
            </p>
            <h2 className="text-base font-bold text-white">{t("homeRecentTitle")}</h2>
          </div>
          {jobs.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate("queue")}
              className="text-xs font-semibold text-[#1db954] hover:underline"
            >
              {t("homeViewFullQueue")}
            </button>
          )}
        </div>
        {recentJobs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-zinc-500">{t("homeNoItems")}</p>
            <Button className="mt-4" onClick={() => void openPlatform()}>
              <ExternalLink className="h-4 w-4" />
              {t("commonOpenPlatform")}
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {recentJobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{job.fileName}</p>
                  <p className="truncate text-xs text-zinc-500">{job.relativePath ?? job.provider}</p>
                </div>
                <span className="flex-shrink-0 rounded-md bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
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
    card: "border-sky-500/25 bg-gradient-to-br from-sky-500/20 to-[#1f1f1f]",
    label: "text-sky-300/80",
    value: "text-sky-200",
  },
  violet: {
    card: "border-violet-500/25 bg-gradient-to-br from-violet-500/20 to-[#1f1f1f]",
    label: "text-violet-300/80",
    value: "text-violet-200",
  },
  green: {
    card: "border-[#1db954]/25 bg-gradient-to-br from-[#1db954]/20 to-[#1f1f1f]",
    label: "text-[#1db954]/80",
    value: "text-[#1db954]",
  },
  emerald: {
    card: "border-emerald-500/25 bg-gradient-to-br from-emerald-500/20 to-[#1f1f1f]",
    label: "text-emerald-300/80",
    value: "text-emerald-300",
  },
  amber: {
    card: "border-amber-500/25 bg-gradient-to-br from-amber-500/20 to-[#1f1f1f]",
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
      <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${colors.label}`}>{label}</p>
      <p className={`mt-2 text-2xl font-black ${colors.value}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
