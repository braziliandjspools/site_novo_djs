"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MusicasUserMenu } from "../musicas/components/MusicasUserMenu";

type SessionPayload = {
  authenticated?: boolean;
  hasVip?: boolean;
  user?: { name?: string } | null;
};

/** Acesso do usuário no header marketing — igual /musicas e /portal. */
export function MarketingAuthControls({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasVip, setHasVip] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/musicas/session", { cache: "no-store" });
        const data = (await res.json()) as SessionPayload;
        if (cancelled) return;
        setAuthenticated(Boolean(data.authenticated));
        setHasVip(Boolean(data.hasVip));
        setUserName(data.user?.name?.trim() || "Usuário");
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
          setHasVip(false);
          setUserName("");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/portal/logout", { method: "POST" });
    setAuthenticated(false);
    setHasVip(false);
    setUserName("");
    router.refresh();
    router.push("/");
  }, [router]);

  const loginHref = `/musicas/entrar?return=${encodeURIComponent(pathname || "/")}`;

  if (!ready) {
    return (
      <span
        className={`inline-flex ${compact ? "h-9 w-9" : "h-9 w-24"} animate-pulse rounded-full bg-white/10`}
        aria-hidden
      />
    );
  }

  if (!authenticated) {
    return (
      <Link
        href={loginHref}
        className="inline-flex flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
      >
        Entrar
      </Link>
    );
  }

  return <MusicasUserMenu userName={userName} hasVip={hasVip} onLogout={() => void handleLogout()} />;
}
