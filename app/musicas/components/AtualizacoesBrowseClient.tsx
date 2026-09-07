"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import { PLACEHOLDER } from "../../lib/theme";
import {
  childrenAreDateFolders,
  childrenAreWeekFolders,
  childrenAreYearFolders,
  displayFolderName,
  folderHref,
  formatDateFolderLabel,
  isDateFolderName,
  isYearFolderName,
  slugifyFolderName,
  sortFoldersByDateFolder,
  sortFoldersByYear,
} from "../../lib/vip-music-slugs";
import { matchStyleSlug } from "../atualizacoes/AtualizacoesSearch";
import { AtualizacoesDatePackHero } from "./AtualizacoesDatePackHero";
import { AtualizacoesMonthFooterNav } from "./AtualizacoesMonthFooterNav";
import { AtualizacoesMonthHero } from "./AtualizacoesMonthHero";
import { AtualizacoesSourcesNav } from "./AtualizacoesSourcesNav";
import { StyleFolderAccordion } from "./StyleFolderAccordion";
import { WeekFolderGrid } from "./WeekFolderGrid";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";
import { pushRecentFolder } from "../lib/music-library-storage";
import { stylesReadKey, weeksReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";

type ResolveResponse = {
  folderId: string;
  folderName: string;
  level: "folders" | "tracks";
  items: VipMusicCatalogItem[];
  canPlay: boolean;
  resolvedPath: { slug: string; id: string; name: string }[];
  slugSegments: string[];
};

type AtualizacoesBrowseClientProps = {
  slugSegments: string[];
};

export function AtualizacoesBrowseClient({ slugSegments }: AtualizacoesBrowseClientProps) {
  const searchParams = useSearchParams();
  const poolSlug = searchParams.get("pool") ?? searchParams.get("estilo");
  const faixaId = searchParams.get("faixa");
  const [data, setData] = useState<ResolveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [rootFolders, setRootFolders] = useState<VipMusicFolder[]>([]);
  const [siblingWeeks, setSiblingWeeks] = useState<VipMusicFolder[]>([]);
  const [yearDates, setYearDates] = useState<VipMusicFolder[]>([]);

  const slugPath = slugSegments.join("/");
  const firstSlug = slugSegments[0] ?? "";
  const secondSlug = slugSegments[1];

  useEffect(() => {
    void fetch("/api/musicas/tree", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => {
        setRootFolders((body as { folders?: VipMusicFolder[] }).folders ?? []);
      })
      .catch(() => setRootFolders([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setOpenFolderId(null);

    void fetch(`/api/musicas/resolve?slug=${encodeURIComponent(slugPath)}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as ResolveResponse & { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Pasta não encontrada.");
        setData(body);
      })
      .catch((err: Error) => {
        setError(err.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [slugPath]);

  const isYearLevel =
    Boolean(data && data.level === "folders" && slugSegments.length === 1) &&
    (isYearFolderName(data?.folderName ?? "") || childrenAreDateFolders(data?.items ?? []));

  const isDateLevel =
    Boolean(data && data.level === "folders" && slugSegments.length === 2) &&
    (isDateFolderName(data?.folderName ?? "") ||
      (!childrenAreWeekFolders(data?.items ?? []) &&
        data?.resolvedPath[0] &&
        (isYearFolderName(data.resolvedPath[0].name) || childrenAreYearFolders(rootFolders))));

  const showingWeeks = useMemo(() => {
    if (!data || data.level !== "folders" || slugSegments.length !== 1) return false;
    if (isYearLevel) return false;
    return childrenAreWeekFolders(data.items);
  }, [data, slugSegments.length, isYearLevel]);

  const showingLegacyStyles = Boolean(
    data && data.level === "folders" && !showingWeeks && !isYearLevel && !isDateLevel,
  );

  /** Semanas irmãs (legado). */
  useEffect(() => {
    if (!firstSlug || !secondSlug || isDateLevel || isYearLevel) {
      setSiblingWeeks([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/musicas/resolve?slug=${encodeURIComponent(firstSlug)}`, { cache: "no-store" })
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
  }, [firstSlug, secondSlug, isDateLevel, isYearLevel]);

  /** Datas do ano para Sources (quando em data ou ano). */
  useEffect(() => {
    if (!firstSlug || (!isYearLevel && !isDateLevel)) {
      if (!isYearLevel && !isDateLevel) setYearDates([]);
      return;
    }
    if (isYearLevel && data) {
      setYearDates(data.items);
      return;
    }
    let cancelled = false;
    void fetch(`/api/musicas/resolve?slug=${encodeURIComponent(firstSlug)}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as ResolveResponse & { error?: string };
        if (!res.ok || cancelled) return;
        if (body.level === "folders" && childrenAreDateFolders(body.items)) {
          setYearDates(body.items);
        } else if (body.level === "folders") {
          setYearDates(body.items);
        } else {
          setYearDates([]);
        }
      })
      .catch(() => {
        if (!cancelled) setYearDates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [firstSlug, isYearLevel, isDateLevel, data]);

  useEffect(() => {
    if (!data || !poolSlug || !(showingLegacyStyles || isDateLevel)) return;
    const match = data.items.find((item) => matchStyleSlug(item.name, poolSlug));
    if (match) setOpenFolderId(match.id);
  }, [data, poolSlug, showingLegacyStyles, isDateLevel]);

  useEffect(() => {
    if (!data) return;
    pushRecentFolder({
      name: isDateLevel
        ? formatDateFolderLabel(data.folderName)
        : displayFolderName(data.folderName),
      href: folderHref(slugSegments),
    });
  }, [data, slugSegments, isDateLevel]);

  useEffect(() => {
    if (!data || !openFolderId || !(showingLegacyStyles || isDateLevel)) return;
    const folder = data.items.find((item) => item.id === openFolderId);
    if (!folder) return;
    const params = new URLSearchParams({
      pool: slugifyFolderName(folder.name),
      estilo: slugifyFolderName(folder.name),
    });
    pushRecentFolder({
      name: `${isDateLevel ? formatDateFolderLabel(data.folderName) : displayFolderName(data.folderName)} · ${displayFolderName(folder.name)}`,
      href: `${folderHref(slugSegments)}?${params.toString()}`,
    });
  }, [data, openFolderId, showingLegacyStyles, isDateLevel, slugSegments]);

  const { authenticated } = useMusicasSession();
  const playbackEnabled = Boolean(data?.canPlay);

  const yearFolders = childrenAreYearFolders(rootFolders)
    ? sortFoldersByYear(rootFolders, true)
    : rootFolders.filter((f) => isYearFolderName(f.name));

  const yearTitle = data?.resolvedPath[0]
    ? displayFolderName(data.resolvedPath[0].name)
    : firstSlug.replace(/-/g, " ");
  const secondTitle = data?.resolvedPath[1]
    ? isDateFolderName(data.resolvedPath[1].name)
      ? formatDateFolderLabel(data.resolvedPath[1].name)
      : displayFolderName(data.resolvedPath[1].name)
    : secondSlug?.replace(/-/g, " ");
  const currentTitle = data
    ? isDateFolderName(data.folderName)
      ? formatDateFolderLabel(data.folderName)
      : displayFolderName(data.folderName)
    : yearTitle;

  const childIds = data?.items.map((item) => item.id) ?? [];
  const highlightKey = isDateLevel
    ? stylesReadKey(`${firstSlug}/${secondSlug}`)
    : showingWeeks
      ? weeksReadKey(firstSlug)
      : stylesReadKey(secondSlug ? `${firstSlug}/${secondSlug}` : firstSlug);
  const newChildIds = useNewFolderHighlights(highlightKey, childIds);

  const dateListForSources = isYearLevel && data ? data.items : yearDates;
  const sortedDates = childrenAreDateFolders(dateListForSources)
    ? sortFoldersByDateFolder(dateListForSources, true)
    : dateListForSources;

  const relativePoolBase = isDateLevel
    ? `${yearTitle}/${formatDateFolderLabel(data?.folderName ?? "")}`
    : secondTitle
      ? `${yearTitle}/${secondTitle}`
      : yearTitle;

  const useDateLayout = isYearLevel || isDateLevel;

  return (
    <div className={`w-full ${useDateLayout ? "flex flex-col gap-5 md:flex-row md:items-start" : ""}`}>
      {useDateLayout && (
        <AtualizacoesSourcesNav
          years={yearFolders.length > 0 ? yearFolders : rootFolders.filter((f) => isYearFolderName(f.name))}
          dates={sortedDates}
          activeYearSlug={firstSlug || undefined}
          activeDateSlug={isDateLevel ? secondSlug : undefined}
          newDateIds={isYearLevel ? newChildIds : undefined}
        />
      )}

      <div className="min-w-0 flex-1">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <Link
            href="/musicas/atualizacoes"
            className="font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Atualizações
          </Link>
          <ChevronRight className="h-3 w-3" />
          {secondSlug ? (
            <>
              <Link
                href={folderHref([firstSlug])}
                className="max-w-[12rem] truncate font-medium text-zinc-400 transition-colors hover:text-white"
                title={yearTitle}
              >
                {yearTitle}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="max-w-[14rem] truncate font-medium text-white" title={secondTitle}>
                {secondTitle}
              </span>
            </>
          ) : (
            <span className="max-w-[16rem] truncate font-medium text-white" title={currentTitle}>
              {currentTitle}
            </span>
          )}
        </nav>

        {data && isDateLevel && (
          <AtualizacoesDatePackHero
            folderName={data.folderName}
            yearLabel={yearTitle}
            poolCount={data.items.length}
            isNew={false}
            hasVip={playbackEnabled}
            actions={
              secondSlug ? (
                <SendPackToDownloaderButton
                  slug={`${firstSlug}/${secondSlug}`}
                  label="Enviar data ao Downloader"
                />
              ) : null
            }
          />
        )}

        {data && !isDateLevel && !isYearLevel && (
          <AtualizacoesMonthHero
            folderName={data.folderName}
            styleCount={data.items.length}
            hasVip={playbackEnabled}
            mode={showingWeeks ? "weeks" : secondSlug ? "week-styles" : "styles"}
            actions={
              slugSegments.length === 1 ? (
                <SendPackToDownloaderButton
                  slug={firstSlug}
                  label="Enviar mês inteiro ao Downloader"
                />
              ) : secondSlug && slugSegments.length === 2 ? (
                <SendPackToDownloaderButton
                  slug={`${firstSlug}/${secondSlug}`}
                  label="Enviar semana ao Downloader"
                />
              ) : null
            }
          />
        )}

        {isYearLevel && data && (
          <div className="mb-4">
            <h1 className="font-display text-2xl font-black text-white sm:text-3xl" title={yearTitle}>
              {yearTitle}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {data.items.length} data{data.items.length === 1 ? "" : "s"} · escolha em Sources ou abaixo
            </p>
            <div className="mt-3">
              <SendPackToDownloaderButton slug={firstSlug} label="Enviar ano ao Downloader" />
            </div>
          </div>
        )}

        {authenticated && !playbackEnabled && <VipUpgradeBanner />}

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

        {/* Ano → grid de datas (mobile; desktop tem Sources) */}
        {!loading && !error && data && isYearLevel && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sortFoldersByDateFolder(data.items, true).map((dateFolder) => {
              const dateSlug = slugifyFolderName(dateFolder.name);
              const label = formatDateFolderLabel(dateFolder.name);
              const full = displayFolderName(dateFolder.name);
              return (
                <Link
                  key={dateFolder.id}
                  href={folderHref([firstSlug, dateSlug])}
                  title={full}
                  className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-[#181818] transition hover:border-[#1ed760]/40"
                >
                  <div className="relative aspect-square bg-zinc-900">
                    <Image
                      src={PLACEHOLDER.trackCover}
                      alt=""
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    {newChildIds.has(dateFolder.id) && (
                      <span className="absolute left-2 top-2 rounded-md bg-[#1ed760] px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
                        Novo
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-bold text-white" title={label}>
                      {label}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500" title={full}>
                      {full}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Data → chips de pool + accordion/tabela */}
        {!loading && !error && data && isDateLevel && (
          <div className="mt-5 space-y-4">
            {data.items.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-4 py-8 text-center text-sm text-zinc-500">
                Nenhum pool nesta data. Adicione pastas de estilo/pool no Google Drive.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {data.items.map((folder) => {
                    const label = displayFolderName(folder.name);
                    const active = openFolderId === folder.id;
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        title={label}
                        onClick={() =>
                          setOpenFolderId((current) => (current === folder.id ? null : folder.id))
                        }
                        className={`max-w-[14rem] truncate rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? "border-[#1ed760]/50 bg-[#1ed760]/15 text-[#1ed760]"
                            : newChildIds.has(folder.id)
                              ? "border-[#1ed760]/30 bg-[#1ed760]/5 text-zinc-200"
                              : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {label}
                        {newChildIds.has(folder.id) ? " · Novo" : ""}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  {data.items.map((folder) => (
                    <StyleFolderAccordion
                      key={folder.id}
                      folder={folder}
                      canPlay={playbackEnabled}
                      canDownload={playbackEnabled}
                      relativePath={`${relativePoolBase}/${displayFolderName(folder.name)}`}
                      monthSlug={firstSlug}
                      monthName={yearTitle}
                      weekSlug={secondSlug}
                      slugSegments={[firstSlug, secondSlug, slugifyFolderName(folder.name)].filter(
                        (part): part is string => Boolean(part),
                      )}
                      isNew={newChildIds.has(folder.id)}
                      isOpen={openFolderId === folder.id}
                      highlightTrackId={openFolderId === folder.id ? (faixaId ?? undefined) : undefined}
                      autoPlayTrackId={
                        openFolderId === folder.id && playbackEnabled && faixaId ? faixaId : undefined
                      }
                      scrollIntoView={Boolean(poolSlug && matchStyleSlug(folder.name, poolSlug))}
                      onToggle={() =>
                        setOpenFolderId((current) => (current === folder.id ? null : folder.id))
                      }
                      poolColumn
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Legado: semanas */}
        {!loading && !error && data && showingWeeks && (
          <>
            <WeekFolderGrid
              monthSlug={firstSlug}
              monthName={yearTitle}
              weeks={data.items}
              newWeekIds={newChildIds}
            />
            <AtualizacoesMonthFooterNav
              monthSlug={firstSlug}
              months={rootFolders}
              weeks={showingWeeks ? data.items : siblingWeeks}
              weekSlug={secondSlug}
            />
          </>
        )}

        {/* Legado: estilos */}
        {!loading && !error && data && showingLegacyStyles && (
          <>
            <div className="space-y-3">
              {data.items.length === 0 ? (
                <p className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-4 py-8 text-center text-sm text-zinc-500">
                  Nenhum estilo nesta pasta. Adicione subpastas de estilo no Google Drive.
                </p>
              ) : (
                data.items.map((folder) => (
                  <StyleFolderAccordion
                    key={folder.id}
                    folder={folder}
                    canPlay={playbackEnabled}
                    canDownload={playbackEnabled}
                    relativePath={`${relativePoolBase}/${displayFolderName(folder.name)}`}
                    monthSlug={firstSlug}
                    monthName={yearTitle}
                    weekSlug={secondSlug}
                    slugSegments={[firstSlug, secondSlug, slugifyFolderName(folder.name)].filter(
                      (part): part is string => Boolean(part),
                    )}
                    isNew={newChildIds.has(folder.id)}
                    isOpen={openFolderId === folder.id}
                    highlightTrackId={openFolderId === folder.id ? (faixaId ?? undefined) : undefined}
                    autoPlayTrackId={
                      openFolderId === folder.id && playbackEnabled && faixaId ? faixaId : undefined
                    }
                    scrollIntoView={Boolean(poolSlug && matchStyleSlug(folder.name, poolSlug))}
                    onToggle={() =>
                      setOpenFolderId((current) => (current === folder.id ? null : folder.id))
                    }
                  />
                ))
              )}
            </div>
            <AtualizacoesMonthFooterNav
              monthSlug={firstSlug}
              months={rootFolders}
              weeks={siblingWeeks}
              weekSlug={secondSlug}
            />
          </>
        )}
      </div>
    </div>
  );
}
