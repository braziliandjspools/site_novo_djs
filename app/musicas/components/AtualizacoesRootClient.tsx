"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Disc3, FolderOpen, Music2, Sparkles } from "lucide-react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import type { VipMusicHomeSnapshot } from "../../lib/vip-music-home";
import { resolveFolderCoverUrl } from "../../lib/local-folder-covers";
import { displayFolderName, folderHref, slugifyFolderName } from "../../lib/vip-music-slugs";
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
import { MusicasListSkeleton } from "./MusicasSkeletons";
import { MusicLibraryQuickLinks } from "./MusicLibraryQuickLinks";
import { MusicLibraryShelf, MusicLibraryTile } from "./MusicLibraryTiles";
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
  const cover = resolveFolderCoverUrl({
    folderName: folder.name,
    driveCoverUrl: catalog.coverUrl,
  });
  const folderCount = catalog.folderCount;
  const trackCount = catalog.trackCount;

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#151a17] shadow-[0_18px_50px_rgba(0,0,0,0.4)] transition duration-300 hover:-translate-y-0.5 hover:border-[#1ed760]/35 hover:shadow-[0_22px_60px_rgba(0,0,0,0.5)]"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0c1210]/90 via-[#101412]/80 to-[#0a0c0b]/95" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a24] via-[#121816] to-[#0c0e0d]" />
        )}
      </div>

      <Link
        href={href}
        prefetch={false}
        className="relative z-10 flex h-full flex-col gap-4 p-4 sm:p-5"
        onMouseEnter={() => {
          void import("../lib/musicas-fetch-cache").then(({ prefetchMusicasJson }) => {
            prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(slug)}`);
          });
        }}
      >
        <div className="flex items-start gap-3.5">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15 sm:h-[72px] sm:w-[72px]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1ed760]/30 to-white/5 text-[#1ed760]">
                <FolderOpen className="h-7 w-7" aria-hidden />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ed760]/80">
                Acervo
              </p>
              {isNew ? (
                <span className="rounded-full bg-[#1ed760]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1ed760]">
                  Novo
                </span>
              ) : null}
            </div>
            <h2 className="mt-1 truncate font-display text-[20px] font-extrabold uppercase tracking-tight text-white sm:text-[22px]">
              {title}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {typeof folderCount === "number" && folderCount > 0 ? (
                <span className="rounded-lg bg-black/40 px-2 py-1 text-[11px] font-semibold tabular-nums text-white/65 ring-1 ring-white/10">
                  {folderCount.toLocaleString("pt-BR")}{" "}
                  {folderCount === 1 ? "pasta" : "pastas"}
                </span>
              ) : null}
              {typeof trackCount === "number" && trackCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-[11px] font-semibold tabular-nums text-white/65 ring-1 ring-white/10">
                  <Music2 className="h-3 w-3 opacity-60" aria-hidden />
                  {trackCount.toLocaleString("pt-BR")}{" "}
                  {trackCount === 1 ? "música" : "músicas"}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <span className="mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1ed760] text-[13px] font-bold uppercase tracking-wide text-black transition group-hover:brightness-110">
          Abrir acervo
          <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      </Link>
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
          <div className="mt-4">
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
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-white sm:text-2xl">
              Acervos
            </h2>
            <p className="mt-1 text-[13px] text-white/45">
              Abra um acervo para navegar estilos em acordeão. O acervo inteiro não pode ser baixado de uma vez.
            </p>
          </div>
        </div>

        {loading && folders.length === 0 ? (
          <MusicasListSkeleton rows={8} />
        ) : (
          <div className="grid grid-cols-1 gap-3.5 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
