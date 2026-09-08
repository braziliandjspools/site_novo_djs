"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MusicasSessionProvider } from "./components/MusicasSessionContext";
import { MusicasToastProvider } from "./components/MusicasToast";
import { DownloaderSyncProvider } from "./components/DownloaderSyncContext";
import { MusicasTopNav } from "./MusicasSidebar";
import { MusicasGuestBanner } from "./VipUpgradeGate";
import { VipMusicPlayerProvider } from "./components/VipMusicPlayerContext";
import { MusicasDownloaderDock } from "./components/MusicasDownloaderDock";

type MusicasAuthLayoutProps = {
  children: React.ReactNode;
};

export function MusicasAuthLayout({ children }: MusicasAuthLayoutProps) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasVip, setHasVip] = useState(false);
  const [userName, setUserName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const didBootRef = useRef(false);

  const goToLogin = useCallback(() => {
    const returnTo = pathname || "/musicas/home";
    window.location.assign(`/musicas/entrar?return=${encodeURIComponent(returnTo)}`);
  }, [pathname]);

  const checkAccess = useCallback(async (options?: { showLoader?: boolean }) => {
    if (options?.showLoader !== false) setLoading(true);
    try {
      const res = await fetch("/api/musicas/session", { cache: "no-store" });
      const data = (await res.json()) as {
        authenticated?: boolean;
        hasVip?: boolean;
        user?: { name: string } | null;
      };
      setAuthenticated(Boolean(data.authenticated));
      setHasVip(Boolean(data.hasVip));
      setUserName(data.user?.name ?? "");
    } catch {
      setAuthenticated(false);
      setHasVip(false);
      setUserName("");
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
    window.location.assign("/musicas/home");
  }

  const sessionValue = useMemo(
    () => ({
      authenticated,
      hasVip,
      userName,
      openLogin: goToLogin,
      onLogout: () => void handleLogout(),
    }),
    [authenticated, goToLogin, hasVip, userName],
  );

  if (pathname === "/musicas/entrar") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
      </div>
    );
  }

  return (
    <MusicasSessionProvider value={sessionValue}>
      <DownloaderSyncProvider>
        <MusicasToastProvider>
          <VipMusicPlayerProvider canPlayFull={hasVip}>
            <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-clip bg-[#121212] text-zinc-100">
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
                <div className="mx-auto w-full max-w-[1600px] px-3 pb-36 pt-4 sm:px-5 sm:pb-40 sm:pt-6 lg:px-8">
                  {!authenticated && !hasVip && <MusicasGuestBanner />}
                  {children}
                </div>
              </main>

              <MusicasDownloaderDock />
            </div>
          </VipMusicPlayerProvider>
        </MusicasToastProvider>
      </DownloaderSyncProvider>
    </MusicasSessionProvider>
  );
}
