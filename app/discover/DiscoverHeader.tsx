"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, LogIn, Search, UserRound } from "lucide-react";
import { BrsLogo } from "../components/BrsLogo";

type SessionUser = { name?: string | null; email?: string | null };

export function DiscoverHeader({
  initialQuery = "",
  downloadUrl,
}: {
  initialQuery?: string;
  downloadUrl: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    void fetch("/api/musicas/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { authenticated?: boolean; user?: SessionUser | null }) => {
        setUser(body.authenticated ? body.user ?? {} : null);
      })
      .catch(() => setUser(null))
      .finally(() => setAuthReady(true));
  }, []);

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] || null;

  return (
    <header className="sticky top-0 z-50 h-[64px] border-b border-white/[0.08] bg-[#101010]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1120px] items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <BrsLogo href="/" className="h-8 w-auto max-w-[145px] shrink-0" sizes="145px" priority />

        <form
          method="get"
          action="/discover"
          className="relative hidden min-w-0 flex-1 items-center sm:flex"
          onSubmit={(event) => {
            event.preventDefault();
            const q = query.trim();
            router.push(q ? `/discover?q=${encodeURIComponent(q)}` : "/discover");
          }}
        >
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#8f8f8f]" />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar músicas ou produtores"
            aria-label="Buscar músicas ou produtores"
            className="w-full max-w-[560px] rounded-xl border border-white/[0.1] bg-[#171717] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-[#9a9a9a] focus:border-[#60cdff]/55 focus:ring-1 focus:ring-[#60cdff]/25"
          />
        </form>

        <a
          href={downloadUrl}
          className="hidden items-center gap-2 rounded-xl border border-white/[0.1] bg-[#1a1a1a] px-3 py-2 text-sm font-semibold text-white transition hover:border-[#60cdff]/40 hover:bg-[#60cdff]/10 hover:text-[#60cdff] md:inline-flex"
        >
          <ArrowDownToLine className="h-4 w-4" />
          Downloader
        </a>

        {authReady && user ? (
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 rounded-xl border border-[#60cdff]/35 bg-[#60cdff]/10 px-3 py-2 text-sm font-semibold text-[#60cdff] transition hover:bg-[#60cdff]/20"
          >
            <UserRound className="h-4 w-4" />
            <span className="hidden max-w-[120px] truncate sm:inline">{firstName || "Conta"}</span>
          </Link>
        ) : (
          <Link
            href="/musicas/entrar?return=%2Fdiscover"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#1a1a1a] px-3 py-2 text-sm font-semibold text-white transition hover:border-[#60cdff]/40 hover:bg-[#60cdff]/10 hover:text-[#60cdff]"
          >
            <UserRound className="h-4 w-4" />
            <span className="hidden sm:inline">Entrar</span>
            <LogIn className="h-4 w-4 sm:hidden" />
          </Link>
        )}
      </div>
    </header>
  );
}
