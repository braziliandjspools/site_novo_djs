"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MusicasSessionProvider } from "./components/MusicasSessionContext";
import { MusicasToastProvider } from "./components/MusicasToast";
import { DownloaderSyncProvider } from "./components/DownloaderSyncContext";
import { MusicasMobileMenuButton, MusicasSidebar } from "./MusicasSidebar";
import { MusicasUserMenu } from "./components/MusicasUserMenu";
import { MusicasGuestBanner } from "./VipUpgradeGate";
import { checkoutUrl } from "../lib/site";

type MusicasAuthLayoutProps = {
  children: React.ReactNode;
};

export function MusicasAuthLayout({ children }: MusicasAuthLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasVip, setHasVip] = useState(false);
  const [userName, setUserName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const goToLogin = useCallback(() => {
    const returnTo = encodeURIComponent(pathname || "/musicas/home");
    router.push(`/musicas/entrar?return=${returnTo}`);
  }, [pathname, router]);

  const checkAccess = useCallback(async () => {
    setLoading(true);
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
    void checkAccess();
  }, [checkAccess]);

  async function handleLogout() {
    await fetch("/api/portal/logout", { method: "POST" });
    setAuthenticated(false);
    setHasVip(false);
    setUserName("");
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

  const firstName = authenticated ? userName.split(" ")[0] : "Visitante";

  return (
    <MusicasSessionProvider value={sessionValue}>
      <DownloaderSyncProvider>
      <MusicasToastProvider>
      <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-clip bg-black text-zinc-100">
        <MusicasSidebar
          authenticated={authenticated}
          userName={userName}
          hasVip={hasVip}
          onLogout={() => void handleLogout()}
          onLogin={goToLogin}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-black/80 px-3 py-3 backdrop-blur-md sm:gap-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <MusicasMobileMenuButton onClick={() => setMobileOpen(true)} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white sm:text-base">
                  {authenticated ? (
                    <>
                      Olá, <span className="text-[#1ed760]">{firstName}</span>
                    </>
                  ) : (
                    "BRS Music"
                  )}
                </p>
                <p className="truncate text-[10px] text-zinc-500 sm:text-xs">
                  {hasVip
                    ? "Premium · Ouvir e baixar liberado"
                    : authenticated
                      ? "Gratuito · Assine o VIP para ouvir"
                      : "Explore o catálogo · Assine para liberar tudo"}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-3">
              {!authenticated && (
                <button
                  type="button"
                  onClick={goToLogin}
                  className="hidden rounded-full px-4 py-2 text-sm font-bold text-zinc-300 transition-colors hover:text-white sm:inline-flex"
                >
                  Entrar
                </button>
              )}
              {!hasVip && (
                <a
                  href={checkoutUrl("VIP")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-[#1ed760] px-3 py-2 text-[11px] font-bold text-black transition-transform hover:scale-[1.03] sm:px-5 sm:text-sm"
                >
                  Assinar VIP
                </a>
              )}
              {authenticated && (
                <MusicasUserMenu userName={userName} hasVip={hasVip} onLogout={() => void handleLogout()} />
              )}
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-x-clip overflow-y-auto rounded-tl-none bg-gradient-to-b from-[#1f1f1f] to-[#121212] px-3 py-4 sm:rounded-tl-2xl sm:px-6 sm:py-6 lg:px-8">
            {!authenticated && !hasVip && <MusicasGuestBanner />}
            {children}
          </main>
        </div>
      </div>
      </MusicasToastProvider>
      </DownloaderSyncProvider>
    </MusicasSessionProvider>
  );
}
