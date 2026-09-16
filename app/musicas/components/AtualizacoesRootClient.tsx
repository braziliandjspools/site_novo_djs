"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Disc3,
  Flame,
  Sparkles,
} from "lucide-react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import type { VipMusicHomeSnapshot } from "../../lib/vip-music-home";
import {
  displayFolderName,
  folderHref,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import { clearMusicasCache, fetchMusicasJson, peekMusicasCache } from "../lib/musicas-fetch-cache";
import {
  getContinueListening,
  getRecentFolders,
  type ContinueListening,
  type RecentFolder,
} from "../lib/music-library-storage";
import { monthsReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";
import { AtualizacoesSearch, AtualizacoesSearchResults } from "../atualizacoes/AtualizacoesSearch";
import { AtualizacoesDriveSyncButton } from "./AtualizacoesDriveSyncButton";
import { AtualizacoesSyncNotice } from "./AtualizacoesSyncNotice";
import { MusicasFolderGridSkeleton } from "./MusicasSkeletons";
import { MusicasMonthLinks } from "./MusicasMonthLinks";
import { MusicLibraryQuickLinks } from "./MusicLibraryQuickLinks";
import { MusicLibraryTrackShelf } from "./MusicLibraryTrackShelf";
import { MusicLibraryShelf, MusicLibraryTile, libraryTileTone } from "./MusicLibraryTiles";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";

type TreeResponse = { folders?: Array<VipMusicFolder | VipMusicCatalogItem>; error?: string };

const LAST_SYNC_KEY = "brs-atualizacoes-last-sync";

function readLastSync(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

function writeLastSync(iso: string) {
  try {
    sessionStorage.setItem(LAST_SYNC_KEY, iso);
  } catch {
    /* ignore */
  }
}

function formatRelativeUpdate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return null;
  const mins = Math.max(1, Math.round(diffMs / 60_000));
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const diffDays = Math.round(diffMs / 86_400_000);
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  return `em ${date.toLocaleDateString("pt-BR")}`;
}

export function AtualizacoesRootClient() {
  const { hasVip } = useMusicasSession();
  const cachedTree = peekMusicasCache<TreeResponse>("/api/musicas/tree");
  const cachedHome = peekMusicasCache<VipMusicHomeSnapshot>("/api/musicas/home");
  const [folders, setFolders] = useState<Array<VipMusicFolder | VipMusicCatalogItem>>(
    cachedTree?.folders ?? [],
  );
  const [home, setHome] = useState<VipMusicHomeSnapshot | null>(cachedHome ?? null);
  const [loading, setLoading] = useState(!cachedTree?.folders?.length);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => readLastSync());
  const [continueItem, setContinueItem] = useState<ContinueListening | null>(null);
  const [recent, setRecent] = useState<RecentFolder[]>([]);

  const loadTree = useCallback(async (forceRefresh = false) => {
    if (forceRefresh || !peekMusicasCache("/api/musicas/tree")) setLoading(true);
    setError(null);
    try {
      if (forceRefresh) clearMusicasCache("/api/musicas/");
      const data = await fetchMusicasJson<TreeResponse>(
        forceRefresh ? "/api/musicas/tree?refresh=1" : "/api/musicas/tree",
        { forceRefresh },
      );
      setFolders(data.folders ?? []);
      if (data.error) setError(data.error);
    } catch {
      setError("Não foi possível carregar as pastas do Drive.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHome = useCallback(async (forceRefresh = false) => {
    try {
      const data = await fetchMusicasJson<VipMusicHomeSnapshot>(
        forceRefresh ? "/api/musicas/home?refresh=1" : "/api/musicas/home",
        { forceRefresh },
      );
      setHome(data);
      if (data.syncedAt && !readLastSync()) {
        setUpdatedAt(data.syncedAt);
      }
    } catch {
      /* opcional */
    }
  }, []);

  useEffect(() => {
    void loadTree();
    void loadHome();
    setContinueItem(getContinueListening());
    setRecent(getRecentFolders());
  }, [loadHome, loadTree]);

  const folderIds = folders.map((folder) => folder.id);
  const newFolderIds = useNewFolderHighlights(monthsReadKey(), folderIds);

  const trackCount = useMemo(() => {
    const fromTree = folders.reduce((sum, folder) => {
      const count = (folder as VipMusicCatalogItem).trackCount;
      return sum + (typeof count === "number" && count > 0 ? count : 0);
    }, 0);
    if (fromTree > 0) return fromTree;
    if (home?.stats.trackCount && home.stats.trackCount > 0) return home.stats.trackCount;
    return null;
  }, [folders, home]);

  const novosFolders = useMemo(() => {
    return folders
      .filter((folder) => newFolderIds.has(folder.id))
      .slice(0, 12)
      .map((folder, index) => {
        const catalog = folder as VipMusicCatalogItem;
        const slug = slugifyFolderName(folder.name);
        return {
          id: folder.id,
          href: folderHref([slug]),
          title: displayFolderName(folder.name),
          resolveSlug: slug,
          trackCount: catalog.trackCount,
          folderCount: catalog.folderCount,
          index,
        };
      });
  }, [folders, newFolderIds]);

  const latestTracks = home?.latestTracks?.slice(0, 12) ?? [];
  const topWeek = home?.topWeek?.slice(0, 12) ?? [];

  const updatedLabel =
    updatedAt || home?.syncedAt
      ? formatRelativeUpdate(updatedAt ?? home?.syncedAt ?? "")
      : null;

  return (
    <div className="w-full">
      <header className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2a24] via-[#121816] to-[#0c0e0d] px-4 py-5 ring-1 ring-white/10 sm:mb-7 sm:px-6 sm:py-6">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#1ed760]/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-[#00b4d8]/10 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1ed760]/90">
            Brazilian Remix Service
          </p>
          <h1 className="mt-1.5 font-display text-[28px] font-extrabold tracking-tight text-white sm:text-4xl">
            Atualizações para DJs
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/55 sm:text-sm">
            Novos packs, pools, edits, remixes e coleções organizados para DJs.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {folders.length > 0 ? (
              <span className="rounded-lg bg-black/35 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white/70 ring-1 ring-white/10">
                {folders.length} {folders.length === 1 ? "pack" : "packs"}
              </span>
            ) : null}
            {typeof trackCount === "number" && trackCount > 0 ? (
              <span className="rounded-lg bg-black/35 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white/70 ring-1 ring-white/10">
                {trackCount.toLocaleString("pt-BR")} faixas
              </span>
            ) : null}
            {home?.stats.genreCount ? (
              <span className="rounded-lg bg-black/35 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white/70 ring-1 ring-white/10">
                {home.stats.genreCount} estilos
              </span>
            ) : null}
            <span
              className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold ring-1 ${
                hasVip
                  ? "bg-[#1ed760]/15 text-[#1ed760] ring-[#1ed760]/25"
                  : "bg-black/35 text-white/55 ring-white/10"
              }`}
            >
              {hasVip ? "Premium ativo" : "Só navegação"}
            </span>
            {updatedLabel ? (
              <span className="text-[11px] text-white/35">Atualizado {updatedLabel}</span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <AtualizacoesDriveSyncButton
              className="w-full sm:w-auto"
              onSynced={async (result) => {
                if (result?.syncedAt) {
                  writeLastSync(result.syncedAt);
                  setUpdatedAt(result.syncedAt);
                }
                await Promise.all([loadTree(true), loadHome(true)]);
              }}
            />
            {home?.newsBanner?.href ? (
              <Link
                href={home.newsBanner.href}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#1ed760]/30 bg-[#1ed760]/10 px-5 text-sm font-bold text-[#1ed760] transition hover:bg-[#1ed760]/20 sm:w-auto"
              >
                <Flame className="h-4 w-4" aria-hidden />
                Ver novidades
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <AtualizacoesSearch />
      <AtualizacoesSearchResults />
      <AtualizacoesSyncNotice />

      {!hasVip && <VipUpgradeBanner />}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {home?.newsBanner ? (
        <Link
          href={home.newsBanner.href}
          prefetch={false}
          className="mb-8 flex flex-col gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff6b35]/25 via-[#e85d04]/15 to-transparent px-4 py-4 ring-1 ring-[#ff6b35]/25 transition hover:ring-[#ff6b35]/40 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffb703]">Novidades</p>
            <p className="mt-1 text-[16px] font-bold text-white sm:text-[18px]">{home.newsBanner.title}</p>
            <p className="mt-1 text-[13px] text-white/55">{home.newsBanner.subtitle}</p>
          </div>
          <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-white/10 px-4 text-[12px] font-bold text-white">
            Abrir →
          </span>
        </Link>
      ) : null}

      <div className="space-y-9">
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
                <span className="block truncate text-[14px] font-bold text-white">
                  {continueItem.title}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-white/50">
                  {continueItem.artist || continueItem.styleName}
                </span>
              </span>
            </Link>
          </MusicLibraryShelf>
        ) : null}

        {recent.length > 0 ? (
          <MusicLibraryShelf title="Visitadas recentemente">
            {recent.map((folder, index) => (
              <MusicLibraryTile
                key={folder.href}
                href={folder.href}
                title={folder.name}
                index={index + 3}
                size="shelf"
                icon={Sparkles}
              />
            ))}
          </MusicLibraryShelf>
        ) : null}

        {novosFolders.length > 0 ? (
          <MusicLibraryShelf title="Chegando agora" actionHref="#atualizacoes-pastas">
            {novosFolders.map((folder) => (
              <MusicLibraryTile
                key={folder.id}
                href={folder.href}
                title={folder.title}
                badge="Novo"
                index={folder.index + 2}
                tone={libraryTileTone(folder.index + 2)}
                resolveSlug={folder.resolveSlug}
                trackCount={folder.trackCount}
                folderCount={folder.folderCount}
                size="shelf"
              />
            ))}
          </MusicLibraryShelf>
        ) : null}

        <MusicLibraryTrackShelf
          title="Últimas adicionadas"
          tracks={latestTracks}
          actionHref={home?.newsBanner?.href}
          actionLabel="Ver mais"
        />

        <MusicLibraryTrackShelf title="Em alta na semana" tracks={topWeek} />

        {loading && folders.length === 0 ? (
          <MusicasFolderGridSkeleton cards={12} />
        ) : (
          <MusicasMonthLinks folders={folders} newFolderIds={newFolderIds} variant="hero" />
        )}
      </div>
    </div>
  );
}
