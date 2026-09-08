"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  childrenAreWeekFolders,
  displayFolderName,
  folderHref,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import { matchStyleSlug } from "../atualizacoes/AtualizacoesSearch";
import { AtualizacoesDriveSyncButton } from "./AtualizacoesDriveSyncButton";
import { AtualizacoesMonthFooterNav } from "./AtualizacoesMonthFooterNav";
import { AtualizacoesMonthHero } from "./AtualizacoesMonthHero";
import { StyleFolderAccordion } from "./StyleFolderAccordion";
import { WeekFolderGrid } from "./WeekFolderGrid";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { VipMusicTrackList } from "./VipMusicTrackList";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";
import { pushRecentFolder } from "../lib/music-library-storage";
import { stylesReadKey, weeksReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";
import { poolPanelClass, poolTableHeadClass } from "./atualizacoes-pool-ui";

type ResolveResponse = {
  folderId: string;
  folderName: string;
  level: "folders" | "tracks";
  items: VipMusicCatalogItem[];
  tracks?: PreviewTrack[];
  canPlay: boolean;
  canDownload?: boolean;
  canPlayFull?: boolean;
  resolvedPath: { slug: string; id: string; name: string }[];
  slugSegments: string[];
};

type AtualizacoesBrowseClientProps = {
  slugSegments: string[];
};

export function AtualizacoesBrowseClient({ slugSegments }: AtualizacoesBrowseClientProps) {
  const searchParams = useSearchParams();
  const estiloSlug = searchParams.get("estilo");
  const faixaId = searchParams.get("faixa");
  const [data, setData] = useState<ResolveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [months, setMonths] = useState<VipMusicFolder[]>([]);
  const [siblingWeeks, setSiblingWeeks] = useState<VipMusicFolder[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const slugPath = slugSegments.join("/");
  const monthSlug = slugSegments[0] ?? "";
  const weekSlug = slugSegments[1];

  useEffect(() => {
    void fetch("/api/musicas/tree", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => {
        setMonths((body as { folders?: VipMusicFolder[] }).folders ?? []);
      })
      .catch(() => setMonths([]));
  }, []);

  /** Semanas irmãs para o rodapé navegar 01→02→03… antes do próximo mês. */
  useEffect(() => {
    if (!monthSlug || !weekSlug) {
      setSiblingWeeks([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/musicas/resolve?slug=${encodeURIComponent(monthSlug)}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as ResolveResponse & { error?: string };
        if (!res.ok || cancelled) return;
        if (body.level === "folders" && childrenAreWeekFolders(body.items)) {
          setSiblingWeeks(body.items);
        } else {
          setSiblingWeeks([]);
        }
      })
      .catch(() => {
        if (!cancelled) setSiblingWeeks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [monthSlug, weekSlug]);

  const loadBrowse = useCallback(async (options?: { keepOpen?: boolean; forceRefresh?: boolean }) => {
    setLoading(true);
    setError(null);
    if (!options?.keepOpen) setOpenFolderId(null);

    try {
      const refresh = options?.forceRefresh ? "&refresh=1" : "";
      const res = await fetch(`/api/musicas/resolve?slug=${encodeURIComponent(slugPath)}${refresh}`, {
        cache: "no-store",
      });
      const body = (await res.json()) as ResolveResponse & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Pasta não encontrada.");
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pasta não encontrada.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slugPath]);

  useEffect(() => {
    void loadBrowse();
  }, [loadBrowse]);

  const showingWeeks = useMemo(() => {
    if (!data || data.level !== "folders" || slugSegments.length !== 1) return false;
    return childrenAreWeekFolders(data.items);
  }, [data, slugSegments.length]);

  const showingStyles = Boolean(data && data.level === "folders" && !showingWeeks);
  const showingTracks = Boolean(data && data.level === "tracks");

  useEffect(() => {
    if (!data || !estiloSlug || !showingStyles) return;
    const match = data.items.find((item) => matchStyleSlug(item.name, estiloSlug));
    if (match) setOpenFolderId(match.id);
  }, [data, estiloSlug, showingStyles]);

  useEffect(() => {
    if (!data) return;
    pushRecentFolder({
      name: displayFolderName(data.folderName),
      href: folderHref(slugSegments),
    });
  }, [data, slugSegments]);

  useEffect(() => {
    if (!data || !openFolderId || !showingStyles) return;
    const folder = data.items.find((item) => item.id === openFolderId);
    if (!folder) return;
    const params = new URLSearchParams({ estilo: slugifyFolderName(folder.name) });
    pushRecentFolder({
      name: `${displayFolderName(data.folderName)} · ${displayFolderName(folder.name)}`,
      href: `${folderHref(slugSegments)}?${params.toString()}`,
    });
  }, [data, openFolderId, showingStyles, slugSegments]);

  const { authenticated, hasVip } = useMusicasSession();
  const playbackEnabled = Boolean(data?.canPlay);
  const downloadEnabled = Boolean(data?.canDownload ?? data?.canPlayFull);

  const monthTitle = data?.resolvedPath[0]
    ? displayFolderName(data.resolvedPath[0].name)
    : monthSlug.replace(/-/g, " ");
  const weekTitle = data?.resolvedPath[1]
    ? displayFolderName(data.resolvedPath[1].name)
    : weekSlug?.replace(/-/g, " ");
  const currentTitle = data ? displayFolderName(data.folderName) : monthTitle;

  const childIds = data?.items.map((item) => item.id) ?? [];
  const highlightKey = showingWeeks
    ? weeksReadKey(monthSlug)
    : stylesReadKey(weekSlug ? `${monthSlug}/${weekSlug}` : monthSlug);
  const newChildIds = useNewFolderHighlights(highlightKey, childIds);

  const relativeStyleBase = weekTitle ? `${monthTitle}/${weekTitle}` : monthTitle;

  return (
    <div className="w-full">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/musicas/atualizacoes"
          className="font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Atualizações
        </Link>
        {(data?.resolvedPath ?? []).map((part, index, all) => {
          const hrefParts = all.slice(0, index + 1).map((item) => item.slug);
          const isLast = index === all.length - 1;
          return (
            <span key={`${part.id}-${part.slug}`} className="contents">
              <ChevronRight className="h-3 w-3" />
              {isLast ? (
                <span className="font-medium text-white">{displayFolderName(part.name)}</span>
              ) : (
                <Link
                  href={folderHref(hrefParts)}
                  className="font-medium text-zinc-400 transition-colors hover:text-white"
                >
                  {displayFolderName(part.name)}
                </Link>
              )}
            </span>
          );
        })}
        {!data && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-white">{currentTitle}</span>
          </>
        )}
      </nav>

      {data && (
        <AtualizacoesMonthHero
          folderName={data.folderName}
          styleCount={data.items.length}
          hasVip={hasVip}
          mode={showingWeeks ? "weeks" : weekSlug ? "week-styles" : "styles"}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <AtualizacoesDriveSyncButton
                onSynced={async () => {
                  await loadBrowse({ keepOpen: true, forceRefresh: true });
                  setReloadToken((token) => token + 1);
                }}
              />
              {slugSegments.length === 1 ? (
                <SendPackToDownloaderButton
                  slug={monthSlug}
                  label="Enviar mês inteiro ao Downloader"
                />
              ) : weekSlug && slugSegments.length === 2 ? (
                <SendPackToDownloaderButton
                  slug={`${monthSlug}/${weekSlug}`}
                  label="Enviar semana ao Downloader"
                />
              ) : null}
            </div>
          }
        />
      )}

      {!hasVip && <VipUpgradeBanner />}

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && data && showingWeeks && (
        <>
          <WeekFolderGrid
            monthSlug={monthSlug}
            monthName={monthTitle}
            weeks={data.items}
            newWeekIds={newChildIds}
          />
          <AtualizacoesMonthFooterNav
            monthSlug={monthSlug}
            months={months}
            weeks={showingWeeks ? data.items : siblingWeeks}
            weekSlug={weekSlug}
          />
        </>
      )}

      {!loading && !error && data && showingStyles && (
        <>
          {data.items.length === 0 ? (
            <p className="rounded-md border border-zinc-700 bg-black px-4 py-8 text-center text-sm text-zinc-500">
              Nenhum estilo nesta pasta. Adicione subpastas de estilo no Google Drive.
            </p>
          ) : (
            <div className={poolPanelClass}>
              <div className={`${poolTableHeadClass} grid-cols-[minmax(0,1fr)_auto]`}>
                <span>Pasta</span>
                <span className="text-right">Ações</span>
              </div>
              {data.items.map((folder, index) => (
                <StyleFolderAccordion
                  key={folder.id}
                  folder={folder}
                  canPlay={playbackEnabled}
                  canDownload={downloadEnabled}
                  relativePath={`${relativeStyleBase}/${displayFolderName(folder.name)}`}
                  monthSlug={monthSlug}
                  monthName={monthTitle}
                  weekSlug={weekSlug}
                  slugSegments={[...slugSegments, slugifyFolderName(folder.name)]}
                  isNew={newChildIds.has(folder.id)}
                  isOpen={openFolderId === folder.id}
                  highlightTrackId={openFolderId === folder.id ? (faixaId ?? undefined) : undefined}
                  autoPlayTrackId={
                    openFolderId === folder.id && playbackEnabled && faixaId ? faixaId : undefined
                  }
                  scrollIntoView={Boolean(estiloSlug && matchStyleSlug(folder.name, estiloSlug))}
                  onToggle={() => setOpenFolderId((current) => (current === folder.id ? null : folder.id))}
                  zebraIndex={index}
                  embedded
                  reloadToken={reloadToken}
                />
              ))}
            </div>
          )}
          <AtualizacoesMonthFooterNav
            monthSlug={monthSlug}
            months={months}
            weeks={siblingWeeks}
            weekSlug={weekSlug}
          />
        </>
      )}

      {!loading && !error && data && showingTracks && (
        <div className="overflow-hidden">
          <VipMusicTrackList
            folderId={data.folderId}
            tracks={data.tracks ?? []}
            canPlay={playbackEnabled}
            canDownload={downloadEnabled}
            relativePath={relativeStyleBase}
            highlightTrackId={faixaId ?? undefined}
            autoPlayTrackId={playbackEnabled && faixaId ? faixaId : undefined}
            layout="table"
            continueContext={
              monthSlug
                ? {
                    monthSlug,
                    monthName: monthTitle,
                    weekSlug,
                    styleName: displayFolderName(data.folderName),
                  }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
