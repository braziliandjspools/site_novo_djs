"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Disc3, Mic2, MonitorDown, Music2, RefreshCw } from "lucide-react";
import { formatStyleNameForDisplay } from "../../lib/style-display";
import {
  getContinueListening,
  getFavoriteTracks,
  subscribeFavoriteTracks,
  type ContinueListening,
  type FavoriteTrack,
} from "../lib/music-library-storage";
import { MUSICAS_HUB_BANNER_SRC } from "../lib/musicas-hero-art";
import { useMusicasLibraryHome } from "../hooks/useMusicasLibraryHome";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { FavoriteTracksShelf } from "./FavoriteTracksShelf";
import { MusicLibraryQuickLinks } from "./MusicLibraryQuickLinks";
import { MusicLibraryShelf } from "./MusicLibraryTiles";
import { MusicasPageSkeleton } from "./MusicasSkeletons";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";
import { MusicasProductionsSection } from "./MusicasProductionsSection";
import { OctoberHalloweenPromo } from "./OctoberHalloweenPromo";

export function MusicasHubClient() {
  const { authenticated, hasVip } = useMusicasSession();
  const { folders, home, loadingTree, loadingHome, error } = useMusicasLibraryHome();
  const downloaderSync = useDownloaderSync();
  const [continueItem, setContinueItem] = useState<ContinueListening | null>(null);
  const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);

  useEffect(() => {
    setContinueItem(getContinueListening());
    setFavorites(getFavoriteTracks());
    const unsubscribe = subscribeFavoriteTracks(() => setFavorites(getFavoriteTracks()));
    return unsubscribe;
  }, []);

  const bootLoading = loadingTree && loadingHome && folders.length === 0 && !home;
  const downloaderOnlineCount = downloaderSync?.devices.filter((device) => device.isOnline).length ?? 0;
  const showDownloaderCard = authenticated && hasVip && Boolean(downloaderSync);

  if (bootLoading) {
    return <MusicasPageSkeleton />;
  }

  return (
    <div className="w-full space-y-9">
      <header>
        <h1 className="sr-only">Músicas</h1>
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414]">
          <Image
            src={MUSICAS_HUB_BANNER_SRC}
            alt="Brazilian Remix Service"
            width={1600}
            height={420}
            priority
            unoptimized
            className="h-auto w-full object-cover object-center"
          />
        </div>
        <div className="mx-auto mt-6 max-w-3xl">
          <nav aria-label="Seções do acervo" className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/musicas/atualizacoes/2026/outubro-2026"
              prefetch={false}
              className="inline-flex h-11 min-w-[168px] items-center justify-center gap-2 rounded-full bg-[#60cdff] px-6 text-sm font-extrabold text-black shadow-[0_10px_28px_rgba(96,205,255,0.28)] transition hover:bg-[#8ad4ff]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Atualizações
            </Link>
            <Link
              href="/musicas/artistas"
              prefetch={false}
              className="inline-flex h-11 min-w-[168px] items-center justify-center gap-2 rounded-full border border-[#60cdff]/70 bg-[#60cdff]/10 px-6 text-sm font-extrabold text-[#60cdff] transition hover:border-[#60cdff] hover:bg-[#60cdff]/18 hover:text-[#8ad4ff]"
            >
              <Mic2 className="h-4 w-4" aria-hidden />
              Artistas
            </Link>
          </nav>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
            {home?.stats.trackCount ? <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/80"><Music2 className="h-3.5 w-3.5 text-[#8ad4ff]" />{home.stats.trackCount.toLocaleString("pt-BR")} faixas</span> : null}
            {home?.stats.packCount ? <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/80"><Disc3 className="h-3.5 w-3.5 text-[#8ad4ff]" />{home.stats.packCount} packs</span> : null}
            <span className={`rounded-xl border px-3 py-2 text-xs font-semibold ${hasVip ? "border-[#60cdff]/30 bg-[#60cdff]/10 text-[#86efac]" : "border-white/10 bg-white/[0.05] text-zinc-400"}`}>
              {hasVip ? "Premium ativo" : authenticated ? "Só navegação" : "Visitante"}
            </span>
            {showDownloaderCard ? (
              <span id="downloader-status" className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${downloaderOnlineCount > 0 ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/[0.05] text-zinc-400"}`}>
                <MonitorDown className="h-3.5 w-3.5" />
                {downloaderOnlineCount > 0 ? `Downloader online (${downloaderOnlineCount})` : "Downloader offline"}
                {downloaderSync && downloaderSync.totalQueueCount > 0 ? ` · ${downloaderSync.totalQueueCount} na fila` : ""}
              </span>
            ) : null}
        </div>
      </header>

      <OctoberHalloweenPromo updatesHref="/musicas/atualizacoes/2026/outubro-2026" />

      <MusicasProductionsSection />

      {authenticated && !hasVip ? <VipUpgradeBanner /> : null}
      {!authenticated ? <VipUpgradeBanner /> : null}

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {home?.newsBanner ? (
        <Link
          href={home.newsBanner.href}
          prefetch={false}
          className="flex flex-col gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#60cdff]/20 via-[#14919b]/10 to-transparent px-4 py-4 ring-1 ring-[#60cdff]/25 transition hover:ring-[#60cdff]/40 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#60cdff]">Em alta</p>
            <p className="mt-1 text-[16px] font-bold text-white sm:text-[18px]">{home.newsBanner.title}</p>
            <p className="mt-1 text-[13px] text-white/55">{home.newsBanner.subtitle}</p>
          </div>
          <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#60cdff] px-4 text-[12px] font-bold text-white">
            Ouvir agora
          </span>
        </Link>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-[#101210] p-3 sm:p-4"><MusicLibraryQuickLinks /></div>

      {continueItem ? (
        <MusicLibraryShelf title="Continuar ouvindo">
          <Link
            href={continueItem.href}
            prefetch={false}
            className="group flex w-[min(100%,320px)] flex-shrink-0 items-center gap-3 rounded-xl bg-white/[0.06] p-2.5 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
          >
            <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#9b2226] text-white shadow-lg">
              <Disc3 className="h-6 w-6" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold text-white">{continueItem.title}</span>
              <span className="mt-0.5 block truncate text-[12px] text-white/50">
                {continueItem.artist || formatStyleNameForDisplay(continueItem.styleName)}
              </span>
            </span>
          </Link>
        </MusicLibraryShelf>
      ) : null}


      <section id="favoritos" className="scroll-mt-24"><FavoriteTracksShelf tracks={favorites} /></section>


    </div>
  );
}
