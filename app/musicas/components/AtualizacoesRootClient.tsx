"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Disc3, FolderOpen, Grid2X2, Headphones, List, Music2, Play, Radio, RefreshCw, Search, Sparkles } from "lucide-react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import type { VipMusicHomeSnapshot } from "../../lib/vip-music-home";
import {
  displayFolderName,
  folderHref,
  parseMonthStatus,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import { formatStyleNameForDisplay } from "../../lib/style-display";
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
import { MusicasCenterLoading } from "./MusicasSkeletons";
import { MusicLibraryShelf, MusicLibraryTile } from "./MusicLibraryTiles";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";
import { OctoberHalloweenPromo } from "./OctoberHalloweenPromo";

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
  view,
}: {
  folder: VipMusicFolder | VipMusicCatalogItem;
  isNew: boolean;
  index: number;
  view: "grid" | "list";
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
      className={`group/acervo min-w-0 overflow-hidden rounded-2xl border bg-[#0c0c0c] transition duration-300 ${
        view === "list"
          ? "flex items-center gap-3 border-white/10 p-2.5 hover:border-[#60cdff]/40 hover:bg-[#101418] sm:gap-5 sm:p-3"
          : "flex flex-col border-white/[0.08] hover:-translate-y-1 hover:border-[#60cdff]/45 hover:shadow-[0_18px_40px_-22px_rgba(96,205,255,0.45)]"
      }`}
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
    >
      <Link
        href={href}
        prefetch={false}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        aria-label={`Abrir acervo ${title}`}
        className={`relative block shrink-0 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#60cdff] ${
          view === "list" ? "h-20 w-20 rounded-xl sm:h-24 sm:w-24" : "aspect-[4/3] w-full"
        }`}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes={view === "list" ? "96px" : "(max-width:480px) 50vw, (max-width:1024px) 33vw, 240px"}
            className="object-cover transition duration-500 group-hover/acervo:scale-110"
            unoptimized={cover.startsWith("/api/")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(96,205,255,0.18),#111_62%)]">
            <Disc3 className="h-12 w-12 text-[#60cdff]/35 sm:h-16 sm:w-16" strokeWidth={0.9} aria-hidden />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover/acervo:opacity-100 bg-[radial-gradient(circle_at_50%_80%,rgba(96,205,255,0.22),transparent_58%)]" />
        {badge ? (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] backdrop-blur ${
              isNew
                ? "border border-[#60cdff]/45 bg-[#60cdff] text-black"
                : "border border-[#60cdff]/30 bg-black/70 text-[#8ad4ff]"
            }`}
          >
            {badge}
          </span>
        ) : null}
        <span
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#60cdff] text-black opacity-0 shadow-[0_8px_20px_rgba(96,205,255,0.4)] transition group-hover/acervo:opacity-100 sm:h-9 sm:w-9"
          aria-hidden
        >
          <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
        </span>
      </Link>
      <div className={`min-w-0 flex-1 ${view === "list" ? "py-1 pr-1 text-left" : "flex flex-col items-center px-3 pb-3 pt-2.5 text-center sm:px-3.5 sm:pb-3.5 sm:pt-3"}`}>
        <p className="mb-1 truncate text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#60cdff]/80">
          Catálogo BRS
        </p>
        <Link href={href} prefetch={false} onMouseEnter={prefetch} onFocus={prefetch} className="block w-full outline-none focus-visible:text-[#60cdff]">
          <h3 className="line-clamp-2 text-[13px] font-extrabold leading-snug text-white transition group-hover/acervo:text-[#8ad4ff] sm:text-[15px]">
            {title}
          </h3>
        </Link>
        <div className={`flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400 sm:text-[11px] ${view === "grid" ? "justify-center" : ""} mt-2`}>
          {hasFolderStats ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
              <FolderOpen className="h-3.5 w-3.5 text-[#60cdff]/80" />
              {folderCount!.toLocaleString("pt-BR")} pastas
            </span>
          ) : null}
          {hasTrackStats ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
              <Music2 className="h-3.5 w-3.5 text-[#60cdff]/80" />
              {trackCount!.toLocaleString("pt-BR")} faixas
            </span>
          ) : null}
          {!hasFolderStats && !hasTrackStats ? (
            <span className="inline-flex items-center gap-1 text-[#8ad4ff]/80">
              Explorar catálogo <ArrowRight className="h-3 w-3" />
            </span>
          ) : null}
        </div>
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
  const [catalogView, setCatalogView] = useState<"grid" | "list">("grid");

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
      // A sincronização só relê a pasta raiz. A tabela da pasta aberta carrega no resolve.
      await Promise.all([loadTree(false), loadHome(false)]);
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
    const query = folderQuery.trim().toLocaleLowerCase("pt-BR");
    return !query || displayFolderName(folder.name).toLocaleLowerCase("pt-BR").includes(query);
  }), [folders, folderQuery]);

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
      <header className="relative mb-7 overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0b] px-5 py-7 shadow-[0_25px_90px_-45px_rgba(0,0,0,0.8)] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,rgba(255,255,255,0.06),transparent_52%)]" aria-hidden />
        <div className="pointer-events-none absolute -right-10 top-0 hidden h-full w-[38%] items-center justify-center opacity-[0.12] sm:flex" aria-hidden>
          <Disc3 className="h-72 w-72 text-white" strokeWidth={0.7} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">
            <Radio className="h-3.5 w-3.5" /> Brazilian Remix Service
          </span>
          <h1 className="mt-5 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            Seu próximo set <span className="text-white">começa aqui.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            Explore os packs e as últimas atualizações do acervo BRS. Encontre suas faixas, descubra novidades e prepare sua próxima apresentação.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <a href="#acervos" className="inline-flex items-center gap-2 rounded-full bg-[#60cdff] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#60cdff]">
              Explorar acervos <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/musicas/artistas" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.12]">
              <Headphones className="h-4 w-4" /> Artistas
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
            <span className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/80">
              <FolderOpen className="mr-1.5 inline h-3.5 w-3.5 text-white/45" />{folders.length} {folders.length === 1 ? "acervo" : "acervos"}
            </span>
            {typeof trackCount === "number" && trackCount > 0 ? (
              <span className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/80">
                <Music2 className="mr-1.5 inline h-3.5 w-3.5 text-white/45" />{trackCount.toLocaleString("pt-BR")} faixas
              </span>
            ) : null}
            <span className={`rounded-xl border px-3 py-2 text-xs font-semibold ${hasVip ? "border-[#60cdff]/30 bg-[#60cdff]/10 text-white" : "border-white/10 bg-white/[0.05] text-zinc-400"}`}>
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
        <div className="mb-6 overflow-hidden rounded-[24px] border border-[#60cdff]/15 bg-[linear-gradient(180deg,rgba(96,205,255,0.08),rgba(12,12,12,0.4)_42%,transparent)] px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#60cdff]">Sua biblioteca</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Explore os acervos</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
                Packs organizados com as capas e músicas do Drive.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-[#60cdff]/25 bg-[#60cdff]/10 px-3 py-1.5 text-xs font-semibold tabular-nums text-[#8ad4ff]">
              {visibleFolders.length} {visibleFolders.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </div>
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#60cdff]/12 bg-[#0c0c0c] p-3 shadow-[0_14px_35px_-25px_rgba(96,205,255,0.35)] sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Buscar acervo</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#60cdff]/70" aria-hidden />
            <input type="search" value={folderQuery} onChange={(event) => setFolderQuery(event.target.value)}
              placeholder="Encontre um pack ou acervo..."
              className="w-full rounded-xl border border-white/10 bg-[#080808] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#60cdff]/50 focus:ring-1 focus:ring-[#60cdff]/30" />
          </label>
          <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-[#080808] p-1" aria-label="Visualização do catálogo">
            <button type="button" aria-label="Ver em grade" aria-pressed={catalogView === "grid"} onClick={() => setCatalogView("grid")}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${catalogView === "grid" ? "bg-[#60cdff] text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white"}`}><Grid2X2 className="h-4 w-4" /></button>
            <button type="button" aria-label="Ver em lista" aria-pressed={catalogView === "list"} onClick={() => setCatalogView("list")}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${catalogView === "list" ? "bg-[#60cdff] text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white"}`}><List className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mb-6">
          <OctoberHalloweenPromo updatesHref="#acervos" />
        </div>

        {loading && folders.length === 0 ? (
          <MusicasCenterLoading label="Carregando acervos…" />
        ) : (
          <div className={
            catalogView === "list"
              ? "grid grid-cols-1 gap-3 md:grid-cols-2"
              : "grid grid-cols-2 gap-4 min-[480px]:grid-cols-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          }>
            {visibleFolders.map((folder, index) => (
              <AcervoCard
                key={folder.id}
                folder={folder}
                isNew={newFolderIds.has(folder.id)}
                index={index}
                view={catalogView}
              />
            ))}
          </div>
        )}
        {!loading && visibleFolders.length === 0 ? <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-zinc-400">Nenhum acervo encontrado para essa busca.</p> : null}
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
                {continueItem.artist || formatStyleNameForDisplay(continueItem.styleName)}
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
