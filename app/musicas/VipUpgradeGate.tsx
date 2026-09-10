"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, LogIn, Sparkles } from "lucide-react";
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
    <section className="relative z-10 mb-8 overflow-hidden rounded-lg bg-gradient-to-br from-[#1a3264] via-[#121212] to-[#0a0a0a] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#1ed760]/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-eyebrow mb-2 flex items-center gap-2 text-[#1ed760]">
            <Sparkles className="h-4 w-4" />
            Acervo VIP
          </p>
          <h2 className="text-page-title text-white">
            Explore pastas e faixas. Assine para ouvir e baixar.
          </h2>
          <p className="text-secondary mt-3">
            Visitantes e contas sem VIP podem navegar o acervo. O plano VIP libera a reprodução completa, download e o
            Downloader Windows.
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
    <div className="relative z-10 mb-6 flex flex-col gap-4 rounded-lg border border-zinc-800 bg-[#181818] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1ed760]/15 text-[#1ed760]">
          <Crown className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">
            {authenticated ? "Assine o VIP para ouvir e baixar" : "Navegue o acervo · Assine para ouvir"}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {authenticated
              ? "Você pode ver pastas e faixas. Assine o VIP em /plans para reproduzir e baixar."
              : "Qualquer visitante pode explorar pastas e listas. O VIP libera a reprodução e os downloads."}
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
          Você pode explorar pastas e faixas. Assine o VIP para ouvir e baixar sem limite.
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
