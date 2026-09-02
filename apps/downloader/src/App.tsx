import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "./components/layout/AppShell";
import type { AppRoute } from "./components/layout/Sidebar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DownloadManagerProvider, useDownloadManager } from "./context/DownloadManagerContext";
import { DownloadsPage } from "./pages/DownloadsPage";
import { LoginPage } from "./pages/LoginPage";
import { SettingsPage } from "./pages/SettingsPage";

const PAGE_META: Record<AppRoute, { title: string; subtitle: string }> = {
  downloads: {
    title: "Downloads",
    subtitle: "Acompanhe a fila enviada pela plataforma VIP.",
  },
  settings: {
    title: "Configurações",
    subtitle: "Conta, destino dos arquivos e preferências do aplicativo.",
  },
};

function AuthenticatedApp() {
  const { user, device, logout } = useAuth();
  const { connectionState } = useDownloadManager();
  const [route, setRoute] = useState<AppRoute>("downloads");

  if (!user || !device) return null;

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
      onLogout={() => void logout()}
    >
      {route === "downloads" ? <DownloadsPage /> : <SettingsPage />}
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
