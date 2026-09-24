"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Disc3,
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
import { LibraryFolderList, type LibraryFolderItem } from "./LibraryFolderGrid";
import { MusicLibraryQuickLinks } from "./MusicLibraryQuickLinks";
import { MusicLibraryTrackShelf } from "./MusicLibraryTrackShelf";
import { MusicLibraryShelf, MusicLibraryTile, libraryTileTone } from "./MusicLibraryTiles";
import { MusicasListSkeleton, MusicasPageSkeleton } from "./MusicasSkeletons";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";

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
    <div className="w-full space-y-8">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12241c] via-[#101412] to-[#0a0c0b] px-4 py-6 ring-1 ring-white/10 sm:px-6 sm:py-8">
        <div
          className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-[#1ed760]/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-0 h-56 w-56 rounded-full bg-[#00b4d8]/12 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1ed760]/90">
            Brazilian Remix Service
          </p>
          <h1 className="mt-2 font-display text-[30px] font-extrabold tracking-tight text-white sm:text-5xl">
            {authenticated ? `Olá, ${firstName}` : "Músicas VIP"}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-white/55 sm:text-[15px]">
            {authenticated
              ? "Sua central da biblioteca — packs, artistas, coleções e downloads em um fluxo só."
              : "Explore o acervo, ouça no navegador e entre para liberar downloads e o Downloader."}
          </p>
          <form onSubmit={handleSearchSubmit} className="relative mt-5 max-w-md" role="search">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar música, artista ou estilo…"
              aria-label="Buscar no acervo"
              className="h-11 w-full rounded-full border border-white/10 bg-black/35 pl-10 pr-4 text-[13px] font-medium text-white placeholder:text-white/35 outline-none ring-0 transition focus:border-[#1ed760]/50 focus:bg-black/50"
            />
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            {home?.stats.trackCount ? (
              <span className="rounded-lg bg-black/35 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white/70 ring-1 ring-white/10">
                {home.stats.trackCount.toLocaleString("pt-BR")} faixas
              </span>
            ) : null}
            {home?.stats.packCount ? (
              <span className="rounded-lg bg-black/35 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white/70 ring-1 ring-white/10">
                {home.stats.packCount} packs
              </span>
            ) : null}
            <span
              className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold ring-1 ${
                hasVip
                  ? "bg-[#1ed760]/15 text-[#1ed760] ring-[#1ed760]/25"
                  : "bg-black/35 text-white/55 ring-white/10"
              }`}
            >
              {hasVip ? "Premium ativo" : authenticated ? "Só navegação" : "Visitante"}
            </span>
            {showDownloaderCard ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold ring-1 ${
                  downloaderOnlineCount > 0
                    ? "bg-[#00b4d8]/15 text-[#5fd4ea] ring-[#00b4d8]/25"
                    : "bg-black/35 text-white/55 ring-white/10"
                }`}
              >
                <MonitorDown className="h-3.5 w-3.5" aria-hidden />
                {downloaderOnlineCount > 0
                  ? `Downloader online (${downloaderOnlineCount})`
                  : "Downloader offline"}
                {downloaderSync && downloaderSync.totalQueueCount > 0
                  ? ` · ${downloaderSync.totalQueueCount} na fila`
                  : ""}
              </span>
            ) : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/musicas/atualizacoes"
              prefetch={false}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black transition hover:bg-[#1fdf67]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Abrir atualizações
            </Link>
            <Link
              href="/musicas/artistas"
              prefetch={false}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <Mic2 className="h-4 w-4" aria-hidden />
              Artistas
            </Link>
          </div>
        </div>
      </header>

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
          className="flex flex-col gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1ed760]/20 via-[#14919b]/10 to-transparent px-4 py-4 ring-1 ring-[#1ed760]/25 transition hover:ring-[#1ed760]/40 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1ed760]">Em alta</p>
            <p className="mt-1 text-[16px] font-bold text-white sm:text-[18px]">{home.newsBanner.title}</p>
            <p className="mt-1 text-[13px] text-white/55">{home.newsBanner.subtitle}</p>
          </div>
          <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#1ed760] px-4 text-[12px] font-bold text-black">
            Ouvir agora
          </span>
        </Link>
      ) : null}

      <MusicLibraryQuickLinks />

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
                {continueItem.artist || continueItem.styleName}
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

      <FavoriteTracksShelf tracks={favorites} />

      <MusicLibraryTrackShelf
        title="Últimas adicionadas"
        tracks={latestTracks}
        actionHref="/musicas/atualizacoes"
        actionLabel="Biblioteca"
      />

      <MusicLibraryTrackShelf title="Em alta na semana" tracks={topWeek} showRank />

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
              className="text-[12px] font-semibold text-[#1ed760] hover:underline"
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
