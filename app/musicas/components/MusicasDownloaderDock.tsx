"use client";

import Link from "next/link";
import { MonitorDown } from "lucide-react";
import { useMusicasSession } from "./MusicasSessionContext";
import { DownloaderDevicePanel } from "./DownloaderDevicePanel";

/**
 * Dock fixo do BRS Downloader — visível em todas as páginas /musicas.
 * Fora do header, para não disputar espaço com a navegação.
 */
export function MusicasDownloaderDock() {
  const { authenticated, hasVip } = useMusicasSession();

  if (authenticated && hasVip) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto max-w-md">
          <DownloaderDevicePanel className="mx-0 mb-0 shadow-2xl shadow-black/50 ring-1 ring-[#1ed760]/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4">
      <div className="pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-xl border border-zinc-700/80 bg-[#121212]/95 px-3 py-3 shadow-2xl shadow-black/50 backdrop-blur-md sm:px-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1ed760]/15 text-[#1ed760]">
          <MonitorDown className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white">BRS Downloader</p>
          <p className="mt-0.5 truncate text-[11px] text-zinc-500">
            {authenticated
              ? "Assine o VIP para enviar packs ao app no PC"
              : "Baixe packs no PC Windows · incluso no VIP"}
          </p>
        </div>
        <Link
          href={authenticated ? "/plans" : "/musicas/entrar"}
          className="flex-shrink-0 rounded-full bg-[#1ed760] px-3 py-2 text-[11px] font-bold text-black transition-transform hover:scale-[1.03]"
        >
          {authenticated ? "Assinar" : "Entrar"}
        </Link>
      </div>
    </div>
  );
}
