import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "./components/layout/AppShell";
import type { AppRoute } from "./components/layout/Sidebar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DownloadManagerProvider, useDownloadManager } from "./context/DownloadManagerContext";
import { hasDownloadDirConfigured, isDesktopRuntime } from "./lib/native/download";
import { ChooseDownloadFolderPage } from "./pages/ChooseDownloadFolderPage";
import { CompletedPage } from "./pages/CompletedPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { JobsSectionPage } from "./pages/JobsSectionPage";
import { LoginPage } from "./pages/LoginPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useWindowsIntegration } from "./hooks/useWindowsIntegration";
import type { DownloadJob } from "./lib/api/jobs";

const PAGE_META: Record<AppRoute, { title: string; subtitle: string }> = {
  home: {
    title: "Início",
    subtitle: "Visão geral da sua fila, conexão e atalhos rápidos.",
  },
  downloads: {
    title: "Downloads",
    subtitle: "Acompanhe os arquivos sendo baixados agora.",
  },
  queue: {
    title: "Fila",
    subtitle: "Itens aguardando ou prontos para iniciar no seu PC.",
  },
  completed: {
    title: "Concluídos",
    subtitle: "Downloads finalizados sincronizados com o site.",
  },
  history: {
    title: "Histórico",
    subtitle: "Revise conclusões, falhas e reenvie quando necessário.",
  },
  settings: {
    title: "Configurações",
    subtitle: "Conta, destino dos arquivos e preferências do aplicativo.",
  },
};

function countJobs(jobs: DownloadJob[], activeJobIds: number[]) {
  return {
    downloads: jobs.filter(
      (job) => job.status === "DOWNLOADING" || job.status === "PAUSED" || activeJobIds.includes(job.id),
    ).length,
    queue: jobs.filter(
      (job) => job.status === "PENDING" || job.status === "RECEIVED" || job.status === "FAILED",
    ).length,
    completed: jobs.filter((job) => job.status === "COMPLETED").length,
  };
}

function AuthenticatedApp() {
  const { user, device, logout } = useAuth();
  const { connectionState, jobs, activeJobIds } = useDownloadManager();
  const [route, setRoute] = useState<AppRoute>("home");
  const [folderConfigured, setFolderConfigured] = useState<boolean | null>(null);
  const counts = useMemo(() => countJobs(jobs, activeJobIds), [activeJobIds, jobs]);

  useWindowsIntegration(Boolean(user && device && folderConfigured));

  useEffect(() => {
    if (!isDesktopRuntime()) {
      setFolderConfigured(true);
      return;
    }
    void hasDownloadDirConfigured().then(setFolderConfigured);
  }, []);

  if (!user || !device) return null;

  if (folderConfigured === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
      </div>
    );
  }

  if (!folderConfigured) {
    return <ChooseDownloadFolderPage onConfigured={() => setFolderConfigured(true)} />;
  }

  const meta = PAGE_META[route];

  return (
    <AppShell
      activeRoute={route}
      onNavigate={setRoute}
      title={meta.title}
      subtitle={meta.subtitle}
      userName={user.name}
      device={device}
      connectionState={connectionState}
      counts={counts}
      onLogout={() => void logout()}
    >
      {route === "home" && <HomePage userName={user.name} onNavigate={setRoute} />}
      {route === "downloads" && <JobsSectionPage section="downloads" />}
      {route === "queue" && <JobsSectionPage section="queue" />}
      {route === "completed" && <CompletedPage />}
      {route === "history" && <HistoryPage />}
      {route === "settings" && <SettingsPage />}
    </AppShell>
  );
}

function AppContent() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
      </div>
    );
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
