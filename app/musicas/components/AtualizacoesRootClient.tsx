"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Disc3, FolderOpen, Headphones, Music2, Radio, RefreshCw, Sparkles } from "lucide-react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import type { VipMusicHomeSnapshot } from "../../lib/vip-music-home";
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
  const cover = catalog.coverUrl?.trim() || null;
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
        className="block outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#17191d] shadow-[0_16px_40px_-18px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition duration-300 group-hover/acervo:-translate-y-1 group-hover/acervo:ring-[#a78bfa]/40">
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
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a78bfa]/15 text-[#a78bfa] ring-1 ring-[#a78bfa]/25">
                <FolderOpen className="h-7 w-7" aria-hidden />
              </span>
            </div>
          )}

          {badge ? (
            <span
              className={`absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] backdrop-blur-sm ${
                isNew || status === "completo" || status === "em-atualizacao"
                  ? "bg-[#a78bfa]/90 text-black"
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
          <h2 className="line-clamp-2 text-[13px] font-bold leading-snug tracking-tight text-white transition-colors hover:text-[#a78bfa] sm:text-[14px]">
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
  const [folderQuery, setFolderQuery] = useState("");
  const [showOnlyNew, setShowOnlyNew] = useState(false);

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
  const seenNewFolderIds = useNewFolderHighlights(monthsReadKey(), folderIds);
  const newFolderIds = useMemo(
    () => new Set([...seenNewFolderIds, ...folders.filter((folder) => folder.isNew).map((folder) => folder.id)]),
    [folders, seenNewFolderIds],
  );

  const visibleFolders = useMemo(() => folders.filter((folder) => {
    if (showOnlyNew && !newFolderIds.has(folder.id)) return false;
    const query = folderQuery.trim().toLocaleLowerCase("pt-BR");
    return !query || displayFolderName(folder.name).toLocaleLowerCase("pt-BR").includes(query);
  }), [folders, folderQuery, newFolderIds, showOnlyNew]);

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
      <header className="relative mb-7 overflow-hidden rounded-[28px] border border-violet-400/20 bg-[#100d1d] px-5 py-7 shadow-[0_25px_90px_-45px_rgba(139,92,246,0.55)] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,rgba(139,92,246,0.27),transparent_52%),radial-gradient(ellipse_at_10%_100%,rgba(67,56,202,0.22),transparent_55%)]" aria-hidden />
        <div className="pointer-events-none absolute -right-10 top-0 hidden h-full w-[38%] items-center justify-center opacity-[0.12] sm:flex" aria-hidden>
          <Disc3 className="h-72 w-72 text-violet-200" strokeWidth={0.7} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-200">
            <Radio className="h-3.5 w-3.5" /> Brazilian Remix Service
          </span>
          <h1 className="mt-5 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            Seu próximo set <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-400 bg-clip-text text-transparent">começa aqui.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            Explore os packs e as últimas atualizações do acervo BRS. Encontre suas faixas, descubra novidades e prepare sua próxima apresentação.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <a href="#acervos" className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-400">
              Explorar acervos <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/musicas/artistas" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.12]">
              <Headphones className="h-4 w-4" /> Artistas
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
            <span className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/80">
              <FolderOpen className="mr-1.5 inline h-3.5 w-3.5 text-violet-300" />{folders.length} {folders.length === 1 ? "acervo" : "acervos"}
            </span>
            {typeof trackCount === "number" && trackCount > 0 ? (
              <span className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/80">
                <Music2 className="mr-1.5 inline h-3.5 w-3.5 text-violet-300" />{trackCount.toLocaleString("pt-BR")} faixas
              </span>
            ) : null}
            <span className={`rounded-xl border px-3 py-2 text-xs font-semibold ${hasVip ? "border-violet-400/30 bg-violet-400/10 text-violet-200" : "border-white/10 bg-white/[0.05] text-zinc-400"}`}>
              {hasVip ? "Premium ativo" : "Só navegação"}
            </span>
            {updatedLabel ? <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400"><RefreshCw className="h-3.5 w-3.5" />Atualizado {updatedLabel}</span> : null}
          </div>
        </div>
      </header>

      <div id="busca" className="scroll-mt-24"><AtualizacoesSearch /></div>
      <AtualizacoesSearchResults />
      <AtualizacoesSyncNotice />

      {!hasVip && <VipUpgradeBanner />}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <section id="acervos" className="mb-10 scroll-mt-24">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-300">Sua biblioteca</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Explore os acervos</h2>
            <p className="mt-1 text-sm text-zinc-400">Packs organizados com as capas e músicas do Drive.</p>
          </div>
          <span className="text-xs font-semibold tabular-nums text-zinc-400">{visibleFolders.length} {visibleFolders.length === 1 ? "resultado" : "resultados"}</span>
        </div>
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:flex-row sm:items-center">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Buscar acervo</span>
            <input type="search" value={folderQuery} onChange={(event) => setFolderQuery(event.target.value)}
              placeholder="Encontre um pack ou acervo..."
              className="w-full rounded-xl border border-white/10 bg-[#171322] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-400/60" />
          </label>
          <button type="button" onClick={() => setShowOnlyNew((value) => !value)} aria-pressed={showOnlyNew}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${showOnlyNew ? "border-violet-400 bg-violet-500/20 text-violet-200" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-violet-400/40"}`}>
            <Sparkles className="h-4 w-4" /> Somente novidades
          </button>
        </div>

        {loading && folders.length === 0 ? (
          <MusicasListSkeleton rows={8} />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 min-[480px]:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visibleFolders.map((folder, index) => (
              <AcervoCard
                key={folder.id}
                folder={folder}
                isNew={newFolderIds.has(folder.id)}
                index={index}
              />
            ))}
          </div>
        )}
        {!loading && visibleFolders.length === 0 ? <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-zinc-400">Nenhum acervo encontrado com esses filtros.</p> : null}
      </section>

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
