"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Disc3,
  Headphones,
  Music2,
  Mic2,
  MonitorDown,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import {
  displayFolderName,
} from "../../lib/vip-music-slugs";
import { formatStyleNameForDisplay } from "../../lib/style-display";
import {
  getContinueListening,
  getFavoriteTracks,
  getRecentFolders,
  subscribeFavoriteTracks,
  type ContinueListening,
  type FavoriteTrack,
  type RecentFolder,
} from "../lib/music-library-storage";
import { useMusicasLibraryHome } from "../hooks/useMusicasLibraryHome";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { FavoriteTracksShelf } from "./FavoriteTracksShelf";
import { DjPoolDiscovery } from "./DjPoolDiscovery";
import { LibraryFolderList, type LibraryFolderItem } from "./LibraryFolderGrid";
import { MusicLibraryQuickLinks } from "./MusicLibraryQuickLinks";
import { MusicLibraryTrackShelf } from "./MusicLibraryTrackShelf";
import { MusicLibraryShelf, MusicLibraryTile, libraryTileTone } from "./MusicLibraryTiles";
import { MusicasListSkeleton, MusicasPageSkeleton } from "./MusicasSkeletons";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";
import { MusicasProductionsSection } from "./MusicasProductionsSection";

type ArtistListItem = {
  slug: string;
  name: string;
  href: string;
  shortBio?: string | null;
  genres?: string[];
  imageUrl?: string | null;
};

export function MusicasHubClient() {
  const { authenticated, hasVip, userName } = useMusicasSession();
  const { folders, home, loadingTree, loadingHome, error, newFolderIds } = useMusicasLibraryHome();
  const downloaderSync = useDownloaderSync();
  const router = useRouter();
  const [continueItem, setContinueItem] = useState<ContinueListening | null>(null);
  const [recent, setRecent] = useState<RecentFolder[]>([]);
  const [artists, setArtists] = useState<ArtistListItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const firstName = userName.trim().split(/\s+/)[0] || "DJ";

  useEffect(() => {
    setContinueItem(getContinueListening());
    setRecent(getRecentFolders());
    setFavorites(getFavoriteTracks());
    const unsubscribe = subscribeFavoriteTracks(() => setFavorites(getFavoriteTracks()));
    void fetch("/api/musicas/artists", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as { artists?: ArtistListItem[] };
        setArtists((body.artists ?? []).slice(0, 16));
      })
      .catch(() => setArtists([]));
    return unsubscribe;
  }, []);

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/musicas/atualizacoes?q=${encodeURIComponent(q)}`);
  }

  const packItems = useMemo((): LibraryFolderItem[] => {
    return folders.slice(0, 12).map((folder, index) => {
      const catalog = folder as VipMusicCatalogItem;
      const isNewest = index === 0;
      const isNew = newFolderIds.has(folder.id);
      return {
        id: folder.id,
        name: folder.name,
        title: displayFolderName(folder.name),
        folderCount: catalog.folderCount,
        trackCount: catalog.trackCount,
        badge: isNewest ? "Mais recente" : isNew ? "Novo" : null,
        badgeTone: isNewest || isNew ? "green" : undefined,
      };
    });
  }, [folders, newFolderIds]);

  const latestTracks = home?.latestTracks?.slice(0, 12) ?? [];
  const topWeek = home?.topWeek?.slice(0, 10) ?? [];
  const bootLoading = loadingTree && loadingHome && folders.length === 0 && !home;
  const downloaderOnlineCount = downloaderSync?.devices.filter((device) => device.isOnline).length ?? 0;
  const showDownloaderCard = authenticated && hasVip && Boolean(downloaderSync);

  if (bootLoading) {
    return <MusicasPageSkeleton />;
  }

  return (
    <div className="w-full space-y-9">
      <header className="relative isolate overflow-hidden rounded-[28px] border border-[#60cdff]/20 bg-[#121212] px-5 py-8 shadow-[0_24px_85px_-45px_rgba(96,205,255,0.65)] sm:px-9 sm:py-11">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_12%,rgba(96,205,255,0.3),transparent_48%),radial-gradient(ellipse_at_8%_100%,rgba(194,24,106,0.13),transparent_55%)]" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 text-[#8ad4ff]/10 lg:block" aria-hidden>
          <Disc3 className="h-80 w-80" strokeWidth={0.7} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#60cdff]/25 bg-[#60cdff]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#86efac]">
            <Headphones className="h-3.5 w-3.5" /> Brazilian Remix Service · DJ Pool
          </span>
          <h1 className="mt-5 font-display text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            {authenticated ? `Olá, ${firstName}.` : "Bem-vindo à BRS."}
            <span className="mt-1 block bg-gradient-to-r from-[#8ad4ff] via-[#8ad4ff] to-[#60cdff] bg-clip-text text-transparent">
              Seu som. Sua pista.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            {authenticated
              ? "Tudo para preparar seu próximo set: descubra lançamentos, encontre seus artistas e organize seus downloads."
              : "Explore packs, remixes e versões para DJs. Descubra o acervo e conheça o BR Downloader."}
          </p>
          <form onSubmit={handleSearchSubmit} className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row" role="search">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar no acervo</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8ad4ff]" aria-hidden />
              <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Música, artista, remix ou estilo..."
                className="h-12 w-full rounded-xl border border-white/15 bg-black/40 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#60cdff] focus:ring-2 focus:ring-green-500/20" />
            </label>
            <button type="submit" disabled={!searchQuery.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#60cdff] px-5 text-sm font-bold text-white transition hover:bg-[#60cdff] disabled:cursor-not-allowed disabled:opacity-50">
              <Search className="h-4 w-4" /> Buscar
            </button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/musicas/atualizacoes" prefetch={false} className="inline-flex items-center gap-2 rounded-full border border-[#60cdff]/40 bg-[#60cdff]/15 px-4 py-2 text-xs font-bold text-green-100 transition hover:bg-[#60cdff]/25">
              <RefreshCw className="h-4 w-4" /> Atualizações <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/musicas/artistas" prefetch={false} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.12]">
              <Mic2 className="h-4 w-4" /> Artistas
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
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
        </div>
      </header>

      <DjPoolDiscovery />

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

      {recent.length > 0 ? (
        <MusicLibraryShelf title="Continue explorando">
          {recent.map((folder, index) => (
            <MusicLibraryTile
              key={folder.href}
              href={folder.href}
              title={folder.name}
              index={index + 2}
              size="shelf"
              icon={Sparkles}
            />
          ))}
        </MusicLibraryShelf>
      ) : null}

      <section id="favoritos" className="scroll-mt-24"><FavoriteTracksShelf tracks={favorites} /></section>

      <div className="rounded-2xl border border-[#60cdff]/15 bg-gradient-to-b from-green-500/[0.07] to-transparent p-3 sm:p-4"><MusicLibraryTrackShelf
        title="Últimas adicionadas"
        tracks={latestTracks}
        actionHref="/musicas/atualizacoes"
        actionLabel="Biblioteca"
      /></div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 sm:p-4"><MusicLibraryTrackShelf title="Em alta na semana" tracks={topWeek} showRank /></div>

      {artists.length > 0 ? (
        <MusicLibraryShelf title="Artistas em destaque" actionHref="/musicas/artistas" actionLabel="Ver todos">
          {artists.map((artist, index) => (
            <MusicLibraryTile
              key={artist.slug}
              href={artist.href}
              title={artist.name}
              subtitle={artist.genres?.[0] ?? artist.shortBio}
              index={index + 6}
              tone={libraryTileTone(index + 6)}
              imageUrl={artist.imageUrl}
              size="shelf"
              round
              icon={Mic2}
            />
          ))}
        </MusicLibraryShelf>
      ) : null}

      {loadingTree && packItems.length === 0 ? (
        <MusicasListSkeleton rows={8} />
      ) : packItems.length > 0 ? (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
            <h2 className="text-[17px] font-bold tracking-tight text-white sm:text-[19px]">
              Packs do acervo
            </h2>
            <Link
              href="/musicas/atualizacoes"
              prefetch={false}
              className="text-[12px] font-semibold text-[#60cdff] hover:underline"
            >
              Ver tudo
            </Link>
          </div>
          <LibraryFolderList
            folders={packItems}
            slugSegments={[]}
            newFolderIds={newFolderIds}
            layout="buttons"
            fillColumn
            emptyMessage="Nenhum pack encontrado."
          />
        </section>
      ) : null}
    </div>
  );
}
