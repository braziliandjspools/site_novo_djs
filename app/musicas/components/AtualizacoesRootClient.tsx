"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Disc3, FolderOpen, Music2, Sparkles } from "lucide-react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import type { VipMusicHomeSnapshot } from "../../lib/vip-music-home";
import { resolveFolderCoverUrl } from "../../lib/local-folder-covers";
import {
  displayFolderName,
  folderHref,
  parseMonthStatus,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import {
  clearMusicasCache,
  fetchMusicasJson,
  peekMusicasCache,
  prefetchMusicasJson,
} from "../lib/musicas-fetch-cache";
import {
  getContinueListening,
  getRecentFolders,
  type ContinueListening,
  type RecentFolder,
} from "../lib/music-library-storage";
import { monthsReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";
import { autoSyncDriveOnEnter, readLastAutoSync } from "../lib/auto-drive-sync";
import { AtualizacoesSearch, AtualizacoesSearchResults } from "../atualizacoes/AtualizacoesSearch";
import { AtualizacoesSyncNotice } from "./AtualizacoesSyncNotice";
import { MusicasListSkeleton } from "./MusicasSkeletons";
import { MusicLibraryQuickLinks } from "./MusicLibraryQuickLinks";
import { MusicLibraryShelf, MusicLibraryTile } from "./MusicLibraryTiles";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";

type TreeResponse = { folders?: Array<VipMusicFolder | VipMusicCatalogItem>; error?: string };

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

function AcervoCard({
  folder,
  isNew,
  index,
}: {
  folder: VipMusicFolder | VipMusicCatalogItem;
  isNew: boolean;
  index: number;
}) {
  const catalog = folder as VipMusicCatalogItem;
  const slug = slugifyFolderName(folder.name);
  const href = folderHref([slug]);
  const title = displayFolderName(folder.name);
  // Prioriza capa do Drive (folder.*); fallback para capa local estática.
  const cover =
    catalog.coverUrl?.trim() ||
    resolveFolderCoverUrl({
      folderName: folder.name,
      driveCoverUrl: null,
    });
  const folderCount = catalog.folderCount;
  const trackCount = catalog.trackCount;
  const hasFolderStats = typeof folderCount === "number" && folderCount > 0;
  const hasTrackStats = typeof trackCount === "number" && trackCount > 0;
  const { label: statusLabel, status } = parseMonthStatus(folder.name);
  const badge = isNew ? "Novo" : statusLabel || null;

  function prefetch() {
    prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(slug)}`);
  }

  return (
    <article
      className="group/acervo min-w-0"
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
    >
      <Link
        href={href}
        prefetch={false}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        aria-label={`Abrir acervo ${title}`}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#17191d] shadow-[0_16px_40px_-18px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition duration-300 group-hover/acervo:-translate-y-1 group-hover/acervo:ring-[#1ed760]/40">
          {cover ? (
            <>
              <Image
                src={cover}
                alt=""
                fill
                sizes="(max-width:420px) 50vw, (max-width:1024px) 33vw, 20vw"
                className="object-cover transition duration-500 group-hover/acervo:scale-105"
                unoptimized={cover.startsWith("/api/")}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1a2a24] via-[#141816] to-[#0c0e0d]">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1ed760]/15 text-[#1ed760] ring-1 ring-[#1ed760]/25">
                <FolderOpen className="h-7 w-7" aria-hidden />
              </span>
            </div>
          )}

          {badge ? (
            <span
              className={`absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] backdrop-blur-sm ${
                isNew || status === "completo" || status === "em-atualizacao"
                  ? "bg-[#1ed760]/90 text-black"
                  : "bg-black/55 text-white"
              }`}
            >
              {badge}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="mt-2.5 min-w-0 px-0.5">
        <Link
          href={href}
          prefetch={false}
          onMouseEnter={prefetch}
          onFocus={prefetch}
          className="outline-none"
        >
          <h2 className="line-clamp-2 text-[13px] font-bold leading-snug tracking-tight text-white transition-colors hover:text-[#1ed760] sm:text-[14px]">
            {title}
          </h2>
        </Link>

        {hasFolderStats || hasTrackStats ? (
          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] leading-snug text-white/50">
            {hasFolderStats ? (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <FolderOpen className="h-3 w-3 opacity-70" aria-hidden />
                {folderCount!.toLocaleString("pt-BR")}{" "}
                {folderCount === 1 ? "pasta" : "pastas"}
              </span>
            ) : null}
            {hasTrackStats ? (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Music2 className="h-3 w-3 opacity-70" aria-hidden />
                {trackCount!.toLocaleString("pt-BR")}{" "}
                {trackCount === 1 ? "música" : "músicas"}
              </span>
            ) : null}
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-white/35">Acervo BRS</p>
        )}
      </div>
    </article>
  );
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
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => readLastAutoSync());
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
      if (data.syncedAt && !readLastAutoSync()) {
        setUpdatedAt(data.syncedAt);
      }
    } catch {
      /* opcional */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await autoSyncDriveOnEnter();
      if (cancelled) return;
      if (result?.syncedAt) setUpdatedAt(result.syncedAt);
      await Promise.all([loadTree(Boolean(result)), loadHome(Boolean(result))]);
    })();
    setContinueItem(getContinueListening());
    setRecent(getRecentFolders());
    return () => {
      cancelled = true;
    };
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

  const updatedLabel =
    updatedAt || home?.syncedAt
      ? formatRelativeUpdate(updatedAt ?? home?.syncedAt ?? "")
      : null;

  return (
    <div className="w-full">
      <header className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a2a24] via-[#121816] to-[#0c0e0d] px-4 py-6 ring-1 ring-white/10 sm:mb-8 sm:px-7 sm:py-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#1ed760]/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-[#00b4d8]/15 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1ed760]/90">
            Brazilian Remix Service
          </p>
          <h1 className="mt-2 font-display text-[28px] font-extrabold tracking-tight text-white sm:text-5xl">
            Atualizações BRS
          </h1>
          <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-white/60 sm:text-[15px]">
            Encontre rapidamente as últimas músicas adicionadas à plataforma.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {folders.length > 0 ? (
              <span className="rounded-lg bg-black/40 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white/75 ring-1 ring-white/10">
                {folders.length} {folders.length === 1 ? "acervo" : "acervos"}
              </span>
            ) : null}
            {typeof trackCount === "number" && trackCount > 0 ? (
              <span className="rounded-lg bg-black/40 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white/75 ring-1 ring-white/10">
                {trackCount.toLocaleString("pt-BR")} faixas
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

      <section className="mb-10">
        <div className="mb-4">
          <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-white sm:text-2xl">
            Acervos
          </h2>
          <p className="mt-1 text-[13px] text-white/45">
            Capas do Drive com pastas e músicas reais de cada acervo.
          </p>
        </div>

        {loading && folders.length === 0 ? (
          <MusicasListSkeleton rows={8} />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 min-[480px]:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {folders.map((folder, index) => (
              <AcervoCard
                key={folder.id}
                folder={folder}
                isNew={newFolderIds.has(folder.id)}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

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
    </div>
  );
}
