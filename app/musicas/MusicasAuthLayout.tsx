"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MusicasSessionProvider } from "./components/MusicasSessionContext";
import { MusicasToastProvider } from "./components/MusicasToast";
import { DownloaderSyncProvider } from "./components/DownloaderSyncContext";
import { MusicasTopNav } from "./MusicasSidebar";
import { MusicasMobileNav } from "./components/MusicasMobileNav";
import { MusicasGuestBanner } from "./VipUpgradeGate";
import { VipMusicPlayerProvider } from "./components/VipMusicPlayerContext";
import { MusicasAuthShellSkeleton, MusicasCenterLoading } from "./components/MusicasSkeletons";
import { DownloaderConfirmProvider } from "./components/DownloaderBulkConfirm";

type MusicasAuthLayoutProps = {
  children: React.ReactNode;
};

export function MusicasAuthLayout({ children }: MusicasAuthLayoutProps) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasVip, setHasVip] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const didBootRef = useRef(false);

  const goToLogin = useCallback(() => {
    const returnTo = pathname || "/musicas";
    window.location.assign(`/musicas/entrar?return=${encodeURIComponent(returnTo)}`);
  }, [pathname]);

  const checkAccess = useCallback(async (options?: { showLoader?: boolean }) => {
    if (options?.showLoader !== false) setLoading(true);
    try {
      const res = await fetch("/api/musicas/session", { cache: "no-store" });
      const data = (await res.json()) as {
        authenticated?: boolean;
        hasVip?: boolean;
        user?: { name: string; email?: string | null } | null;
      };
      setAuthenticated(Boolean(data.authenticated));
      setHasVip(Boolean(data.hasVip));
      setUserName(data.user?.name ?? "");
      setUserEmail(data.user?.email ?? "");
    } catch {
      setAuthenticated(false);
      setHasVip(false);
      setUserName("");
      setUserEmail("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pathname === "/musicas/entrar") return;
    const showLoader = !didBootRef.current;
    void (async () => {
      await checkAccess({ showLoader });
      didBootRef.current = true;
    })();
  }, [checkAccess, pathname]);

  async function handleLogout() {
    await fetch("/api/portal/logout", { method: "POST" });
    window.location.assign("/musicas");
  }

  const sessionValue = useMemo(
    () => ({
      authenticated,
      hasVip,
      userName,
      userEmail,
      openLogin: goToLogin,
      onLogout: () => void handleLogout(),
    }),
    [authenticated, goToLogin, hasVip, userEmail, userName],
  );

  if (pathname === "/musicas/entrar") {
    return <>{children}</>;
  }

  if (loading) {
    if (pathname.startsWith("/musicas/atualizacoes")) {
      return (
        <div className="flex min-h-screen items-center bg-[#141414]">
          <MusicasCenterLoading label="Carregando atualizações…" />
        </div>
      );
    }
    return <MusicasAuthShellSkeleton />;
  }

  return (
    <MusicasSessionProvider value={sessionValue}>
      <DownloaderSyncProvider>
        <DownloaderConfirmProvider>
          <MusicasToastProvider>
            <VipMusicPlayerProvider canPlayFull={hasVip}>
              <div className="musicas-theme flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-clip bg-[#141414] text-white">
                <MusicasTopNav
                  authenticated={authenticated}
                  userName={userName}
                  hasVip={hasVip}
                  onLogout={() => void handleLogout()}
                  onLogin={goToLogin}
                  mobileOpen={mobileOpen}
                  onMobileOpenChange={setMobileOpen}
                />

                <main className="min-w-0 flex-1 overflow-x-clip">
                  <div className="mx-auto w-full max-w-[1600px] px-3 pb-28 pt-4 sm:px-5 sm:pb-28 sm:pt-6 md:pb-10 lg:px-8">
                    {!authenticated && !hasVip && <MusicasGuestBanner />}
                    {children}
                  </div>
                </main>
                <MusicasMobileNav />
              </div>
            </VipMusicPlayerProvider>
          </MusicasToastProvider>
        </DownloaderConfirmProvider>
      </DownloaderSyncProvider>
    </MusicasSessionProvider>
  );
}
