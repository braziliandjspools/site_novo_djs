"use client";

import Link from "next/link";
import { Crown, LogIn, Lock, MessageCircle, Sparkles } from "lucide-react";
import { checkoutUrl } from "../lib/site";
import { useMusicasSession } from "./components/MusicasSessionContext";

const SPOTIFY_GREEN = "#1ed760";

export function MusicasGuestBanner() {
  const { openLogin } = useMusicasSession();

  return (
    <section className="relative mb-8 overflow-hidden rounded-lg bg-gradient-to-br from-[#1a3264] via-[#121212] to-[#0a0a0a] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#1ed760]/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#1ed760]">
            <Sparkles className="h-4 w-4" />
            Plataforma VIP
          </p>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Milhares de faixas. Um clique para baixar.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
            Explore o catálogo, veja os títulos e assine o plano VIP para ouvir, baixar e receber atualizações
            semanais organizadas por mês, semana e estilo.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
          <a
            href={checkoutUrl("VIP")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-black transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: SPOTIFY_GREEN }}
          >
            <Crown className="h-4 w-4" />
            Assinar plano VIP
          </a>
          <button
            type="button"
            onClick={openLogin}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-500 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:border-white hover:bg-white/5"
          >
            <LogIn className="h-4 w-4" />
            Já tenho conta
          </button>
        </div>
      </div>
    </section>
  );
}

export function VipUpgradeBanner() {
  const { authenticated } = useMusicasSession();

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-lg border border-zinc-800 bg-[#181818] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800">
          <Lock className="h-5 w-5 text-zinc-300" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">
            {authenticated ? "Reprodução bloqueada" : "Assine para ouvir e baixar"}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {authenticated
              ? "Você pode navegar e ver os nomes das faixas. Para ouvir e baixar, assine o plano VIP."
              : "Crie sua conta ou assine o VIP para liberar player e downloads ilimitados."}
          </p>
        </div>
      </div>
      <a
        href={checkoutUrl("VIP")}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-black hover:brightness-110"
        style={{ backgroundColor: SPOTIFY_GREEN }}
      >
        <Crown className="h-4 w-4" />
        Assinar VIP
        <MessageCircle className="h-4 w-4" />
      </a>
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
        <h1 className="mt-6 text-2xl font-bold text-white">Plano VIP necessário</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          O acervo de músicas é exclusivo para assinantes do plano VIP.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={checkoutUrl("VIP")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-black"
            style={{ backgroundColor: SPOTIFY_GREEN }}
          >
            Assinar VIP
          </a>
          <Link
            href="/musicas/home"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-600 px-5 py-3 text-sm font-bold text-white hover:border-white"
          >
            Explorar catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
