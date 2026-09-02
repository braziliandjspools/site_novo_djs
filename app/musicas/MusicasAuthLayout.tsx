"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { MusicasLoginModal } from "./components/MusicasLoginModal";
import { MusicasSessionProvider } from "./components/MusicasSessionContext";
import { MusicasToastProvider } from "./components/MusicasToast";
import { MusicasMobileMenuButton, MusicasSidebar } from "./MusicasSidebar";
import { MusicasUserMenu } from "./components/MusicasUserMenu";
import { MusicasGuestBanner } from "./VipUpgradeGate";
import { checkoutUrl } from "../lib/site";

type MusicasAuthLayoutProps = {
  children: React.ReactNode;
};

export function MusicasAuthLayout({ children }: MusicasAuthLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasVip, setHasVip] = useState(false);
  const [userName, setUserName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

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
      openLogin: () => setLoginOpen(true),
      onLogout: () => void handleLogout(),
    }),
    [authenticated, hasVip, userName],
  );

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
      <MusicasToastProvider>
      <div className="flex min-h-screen bg-black text-zinc-100">
        <MusicasSidebar
          authenticated={authenticated}
          userName={userName}
          hasVip={hasVip}
          onLogout={() => void handleLogout()}
          onLogin={() => setLoginOpen(true)}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-black/80 px-4 py-3 backdrop-blur-md sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <MusicasMobileMenuButton onClick={() => setMobileOpen(true)} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white sm:text-base">
                  {authenticated ? (
                    <>
                      Olá, <span className="text-[#1ed760]">{firstName}</span>
                    </>
                  ) : (
                    "Brazilian Packs Music"
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {hasVip
                    ? "Premium · Ouvir e baixar liberado"
                    : authenticated
                      ? "Gratuito · Assine o VIP para ouvir"
                      : "Explore o catálogo · Assine para liberar tudo"}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
              {!authenticated && (
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
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
                  className="inline-flex items-center justify-center rounded-full bg-[#1ed760] px-4 py-2 text-xs font-bold text-black transition-transform hover:scale-[1.03] sm:px-5 sm:text-sm"
                >
                  Assinar VIP
                </a>
              )}
              {authenticated && (
                <MusicasUserMenu userName={userName} hasVip={hasVip} onLogout={() => void handleLogout()} />
              )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto rounded-tl-none bg-gradient-to-b from-[#1f1f1f] to-[#121212] px-4 py-5 sm:rounded-tl-2xl sm:px-6 sm:py-6 lg:px-8">
            {!authenticated && !hasVip && <MusicasGuestBanner />}
            {children}
          </main>
        </div>
      </div>

      {loginOpen && <MusicasLoginModal onClose={() => setLoginOpen(false)} onSuccess={() => void checkAccess()} />}
      </MusicasToastProvider>
    </MusicasSessionProvider>
  );
}
