import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "./components/layout/AppShell";
import type { AppRoute } from "./components/layout/Sidebar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DownloadManagerProvider, useDownloadManager } from "./context/DownloadManagerContext";
import { hasDownloadDirConfigured, isDesktopRuntime } from "./lib/native/download";
import { downloadManager } from "./lib/download/download-manager";
import { loadActiveRoute, persistActiveRoute } from "./lib/active-route";
import { ChooseDownloadFolderPage } from "./pages/ChooseDownloadFolderPage";
import { CompletedPage } from "./pages/CompletedPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { JobsSectionPage } from "./pages/JobsSectionPage";
import { LoginPage } from "./pages/LoginPage";
import { PortalPage } from "./pages/PortalPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useWindowsIntegration } from "./hooks/useWindowsIntegration";
import { DesktopRequiredNotice } from "./components/DesktopRequiredNotice";
import { LanguageOnboardingPage } from "./pages/LanguageOnboardingPage";
import { LocaleProvider, useLocale, type MessageKey } from "./i18n/LocaleContext";
import type { DownloadJob } from "./lib/api/jobs";

const PAGE_META: Record<AppRoute, { title: MessageKey; subtitle: MessageKey }> = {
  home: {
    title: "pagesHomeTitle",
    subtitle: "pagesHomeSubtitle",
  },
  downloads: {
    title: "pagesDownloadsTitle",
    subtitle: "pagesDownloadsSubtitle",
  },
  queue: {
    title: "pagesQueueTitle",
    subtitle: "pagesQueueSubtitle",
  },
  completed: {
    title: "pagesCompletedTitle",
    subtitle: "pagesCompletedSubtitle",
  },
  history: {
    title: "pagesHistoryTitle",
    subtitle: "pagesHistorySubtitle",
  },
  portal: {
    title: "pagesPortalTitle",
    subtitle: "pagesPortalSubtitle",
  },
  settings: {
    title: "pagesSettingsTitle",
    subtitle: "pagesSettingsSubtitle",
  },
};

function isQueueJobForDevice(job: DownloadJob, deviceId: string) {
  if (job.status === "PENDING") {
    return !job.targetDeviceId || job.targetDeviceId === deviceId;
  }
  if (job.status === "FAILED") {
    return !job.deviceId || job.deviceId === deviceId;
  }
  return job.deviceId === deviceId;
}

function countJobs(jobs: DownloadJob[], activeJobIds: number[], deviceId: string) {
  return {
    downloads: jobs.filter(
      (job) =>
        job.deviceId === deviceId &&
        (job.status === "DOWNLOADING" || job.status === "PAUSED" || activeJobIds.includes(job.id)),
    ).length,
    queue: jobs.filter(
      (job) =>
        isQueueJobForDevice(job, deviceId) &&
        (job.status === "PENDING" || job.status === "RECEIVED" || job.status === "FAILED"),
    ).length,
    completed: jobs.filter((job) => job.status === "COMPLETED" && job.deviceId === deviceId).length,
  };
}

function AuthenticatedApp() {
  const { user, device, logout } = useAuth();
  const { t } = useLocale();
  const { connectionState, jobs, activeJobIds, workerError } = useDownloadManager();
  const [route, setRoute] = useState<AppRoute>(() => loadActiveRoute("home"));
  const [folderConfigured, setFolderConfigured] = useState<boolean | null>(null);
  const counts = useMemo(
    () => countJobs(jobs, activeJobIds, device?.deviceId ?? ""),
    [activeJobIds, device?.deviceId, jobs],
  );

  useWindowsIntegration(Boolean(user && device && folderConfigured));

  useEffect(() => {
    persistActiveRoute(route);
  }, [route]);

  useEffect(() => {
    if (!isDesktopRuntime()) {
      setFolderConfigured(true);
      return;
    }
    void hasDownloadDirConfigured().then(setFolderConfigured);
  }, []);

  useEffect(() => {
    if (folderConfigured) {
      downloadManager.notifyFolderReady();
    }
  }, [folderConfigured]);

  if (!user || !device) return null;

  if (!isDesktopRuntime()) {
    return <DesktopRequiredNotice />;
  }

  if (folderConfigured === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1db954]" />
      </div>
    );
  }

  if (!folderConfigured) {
    return <ChooseDownloadFolderPage onConfigured={() => {
      setFolderConfigured(true);
      downloadManager.notifyFolderReady();
    }} />;
  }

  const meta = PAGE_META[route];

  return (
    <AppShell
      activeRoute={route}
      onNavigate={setRoute}
      title={t(meta.title)}
      subtitle={t(meta.subtitle)}
      userName={user.name}
      device={device}
      connectionState={connectionState}
      syncError={workerError}
      billing={user.billing}
      counts={counts}
      onLogout={() => void logout()}
    >
      {route === "home" && <HomePage userName={user.name} onNavigate={setRoute} />}
      {route === "downloads" && <JobsSectionPage section="downloads" />}
      {route === "queue" && <JobsSectionPage section="queue" />}
      {route === "completed" && <CompletedPage />}
      {route === "history" && <HistoryPage />}
      {route === "portal" && <PortalPage />}
      {route === "settings" && <SettingsPage />}
    </AppShell>
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background)]">
      <Loader2 className="h-8 w-8 animate-spin text-[#1db954]" />
    </div>
  );
}

function AppContent() {
  const { status } = useAuth();
  const { ready: localeReady, localeConfigured } = useLocale();

  if (!isDesktopRuntime()) {
    return <DesktopRequiredNotice />;
  }

  // As preferências ainda estão sendo lidas: sem elas não dá para saber se o
  // usuário já escolheu o idioma, e piscar a tela errada é pior que esperar.
  if (!localeReady) {
    return <LoadingScreen />;
  }

  if (!localeConfigured) {
    return <LanguageOnboardingPage />;
  }

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status !== "authenticated") {
    return <LoginPage />;
  }

  return (
    <DownloadManagerProvider>
      <AuthenticatedApp />
    </DownloadManagerProvider>
  );
}

function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LocaleProvider>
  );
}

export default App;
