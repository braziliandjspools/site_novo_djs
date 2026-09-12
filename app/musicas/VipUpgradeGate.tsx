"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Lock, LogIn, Sparkles } from "lucide-react";
import { checkoutUrl } from "../lib/site";
import { useMusicasSession } from "./components/MusicasSessionContext";

const SPOTIFY_GREEN = "#1ed760";

function loginHref(pathname: string, mode?: "login" | "register") {
  const params = new URLSearchParams({ return: pathname || "/musicas/home" });
  if (mode === "register") params.set("modo", "cadastro");
  return `/musicas/entrar?${params.toString()}`;
}

export function MusicasGuestBanner() {
  const pathname = usePathname();

  return (
    <section className="relative z-10 mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a3264] via-[#121212] to-[#0a0a0a] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#1ed760]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-[#FFDF00]/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-eyebrow mb-2 flex items-center gap-2 text-[#1ed760]">
            <Sparkles className="h-4 w-4" />
            Acervo VIP
          </p>
          <h2 className="text-page-title text-white">
            Explore o acervo. Ouça com VIP.
          </h2>
          <p className="text-secondary mt-3">
            Navegue pastas e faixas à vontade. Com o plano VIP você libera o player completo, downloads e o BRS
            Downloader no Windows.
          </p>
        </div>
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
          <Link
            href={checkoutUrl("VIP")}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold tracking-[-0.01em] text-black transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: SPOTIFY_GREEN }}
          >
            <Crown className="h-4 w-4" />
            Ver planos
          </Link>
          <Link
            href={loginHref(pathname, "login")}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-500 px-8 py-3.5 text-sm font-semibold tracking-[-0.01em] text-white transition-colors hover:border-white hover:bg-white/5"
          >
            <LogIn className="h-4 w-4" />
            Já tenho conta
          </Link>
          <Link
            href={loginHref(pathname, "register")}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-700 px-8 py-3 text-sm font-semibold tracking-[-0.01em] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </section>
  );
}

export function VipUpgradeBanner() {
  const { authenticated } = useMusicasSession();
  const pathname = usePathname();

  return (
    <div className="relative z-10 mb-6 overflow-hidden rounded-2xl border border-[#1ed760]/20 bg-gradient-to-r from-[#1ed760]/10 via-[#181818] to-[#181818] px-4 py-4 sm:px-5">
      <div className="pointer-events-none absolute -right-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-[#1ed760]/15 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#1ed760]/15 text-[#1ed760] ring-1 ring-[#1ed760]/25">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">
              {authenticated ? "VIP destrava o play completo" : "Explore agora · Ouça com VIP"}
            </p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-400">
              {authenticated
                ? "Você já pode navegar pastas e listas. Assine o VIP para ouvir, baixar e usar o Downloader."
                : "Pastas e faixas liberadas para visitar. O plano VIP abre reprodução, download e o app Windows."}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          {!authenticated && (
            <Link
              href={loginHref(pathname, "login")}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-600 px-5 py-2.5 text-sm font-bold text-white hover:border-white"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </Link>
          )}
          <Link
            href={checkoutUrl("VIP")}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-black hover:brightness-110"
            style={{ backgroundColor: SPOTIFY_GREEN }}
          >
            <Crown className="h-4 w-4" />
            Ver planos
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Tooltip no play bloqueado (hover / focus). */
export function VipLockedPlayHint({
  children,
  className = "",
  side = "right",
}: {
  children: ReactNode;
  className?: string;
  side?: "right" | "top";
}) {
  const { authenticated } = useMusicasSession();
  const pathname = usePathname();
  const plansHref = checkoutUrl("VIP");
  const enterHref = loginHref(pathname, "login");

  const positionClass =
    side === "top"
      ? "bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2"
      : "left-[calc(100%+10px)] top-1/2 -translate-y-1/2";

  return (
    <div className={`group/locked relative inline-flex ${className}`}>
      {children}
      <div
        role="tooltip"
        className={`pointer-events-none absolute z-50 w-[min(16.5rem,70vw)] origin-center scale-95 rounded-2xl border border-[#1ed760]/25 bg-[#121212]/95 p-3 opacity-0 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-md transition-all duration-200 ease-out group-hover/locked:pointer-events-auto group-hover/locked:scale-100 group-hover/locked:opacity-100 group-focus-within/locked:pointer-events-auto group-focus-within/locked:scale-100 group-focus-within/locked:opacity-100 ${positionClass}`}
      >
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#1ed760]/15 text-[#1ed760]">
            <Lock className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold leading-snug text-white">Play exclusivo VIP</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
              {authenticated
                ? "Assine para ouvir esta faixa na hora — e levar packs pro Downloader."
                : "Entre ou assine o VIP para soltar o play nesta faixa."}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Link
                href={plansHref}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-black"
                style={{ backgroundColor: SPOTIFY_GREEN }}
              >
                <Crown className="h-3 w-3" />
                Planos
              </Link>
              {!authenticated && (
                <Link
                  href={enterHref}
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-200 hover:border-white/40"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VipUpgradeGate() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12">
      <div className="w-full max-w-lg rounded-xl bg-[#181818] p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
          <Crown className="h-8 w-8 text-[#1ed760]" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Libere o acervo completo</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Explore pastas e faixas agora. Assine o VIP para ouvir e baixar sem limite.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={checkoutUrl("VIP")}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-black"
            style={{ backgroundColor: SPOTIFY_GREEN }}
          >
            Ver planos
          </Link>
          <Link
            href="/musicas/entrar?return=%2Fmusicas%2Fhome"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-600 px-5 py-3 text-sm font-bold text-white hover:border-white"
          >
            Entrar / Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
