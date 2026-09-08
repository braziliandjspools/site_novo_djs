"use client";

import Link from "next/link";
import { MonitorDown } from "lucide-react";
import { useMusicasSession } from "./MusicasSessionContext";
import { DownloaderDevicePanel } from "./DownloaderDevicePanel";

/** Painel do BRS Downloader para embutir nos heroes das páginas /musicas. */
export function MusicasHeroDownloader({ className = "" }: { className?: string }) {
  const { authenticated, hasVip } = useMusicasSession();

  if (authenticated && hasVip) {
    return (
      <DownloaderDevicePanel
        className={`mx-0 mb-0 w-full max-w-sm border-white/10 bg-black/40 backdrop-blur-sm ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex w-full max-w-sm items-start gap-3 rounded-lg border border-white/10 bg-black/40 p-3 backdrop-blur-sm ${className}`}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[#1ed760]/15 text-[#1ed760]">
        <MonitorDown className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-white">BRS Downloader</p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
          {authenticated
            ? "Assine o VIP para enviar packs ao app no PC."
            : "Baixe packs no Windows — incluso no plano VIP."}
        </p>
        <Link
          href={authenticated ? "/plans" : "/musicas/entrar"}
          className="mt-2 inline-flex rounded-full bg-[#1ed760] px-3 py-1.5 text-[11px] font-bold text-black transition-transform hover:scale-[1.03]"
        >
          {authenticated ? "Assinar VIP" : "Entrar"}
        </Link>
      </div>
    </div>
  );
}
