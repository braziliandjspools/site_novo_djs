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
  displayFolderName,
  folderHref,
  formatDateFolderLabel,
  isDateFolderName,
  isYearFolderName,
  slugifyFolderName,
  sortFoldersByDateFolder,
} from "../../lib/vip-music-slugs";
import { AtualizacoesMonthFooterNav } from "./AtualizacoesMonthFooterNav";
import { AtualizacoesMonthHero } from "./AtualizacoesMonthHero";
import { AtualizacoesPackView } from "./AtualizacoesPackView";
import { WeekFolderGrid } from "./WeekFolderGrid";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";
import { pushRecentFolder } from "../lib/music-library-storage";
import { weeksReadKey } from "../lib/read-state";
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

function isAudioFormatFolder(name: string) {
  return /^(mp3|wav|flac|m4a|aac)$/i.test(displayFolderName(name).trim());
}

/** Se a pasta do pool só tem MP3/WAV/…, usa o formato preferido para a tabela flat. */
function pickAudioFormatFolder(items: VipMusicFolder[]): VipMusicFolder | null {
  if (items.length === 0) return null;
  if (!items.every((item) => isAudioFormatFolder(item.name))) return null;
  return (
    items.find((item) => /^mp3$/i.test(displayFolderName(item.name).trim())) ??
    items[0] ??
    null
  );
}

function SourceCards({
  baseSegments,
  items,
  newIds,
  asDates,
}: {
  baseSegments: string[];
  items: VipMusicFolder[];
  newIds: Set<string>;
  asDates: boolean;
}) {
  const list = asDates ? sortFoldersByDateFolder(items, true) : items;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {list.map((item) => {
        const slug = slugifyFolderName(item.name);
        const label = asDates ? formatDateFolderLabel(item.name) : displayFolderName(item.name);
        const full = displayFolderName(item.name);
        return (
          <Link
            key={item.id}
            href={folderHref([...baseSegments, slug])}
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
              {newIds.has(item.id) && (
                <span className="absolute left-2 top-2 rounded-md bg-[#1ed760] px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
                  Novo
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-bold text-white" title={label}>
                {label}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                {asDates ? "Abrir data" : "Abrir pool"}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function AtualizacoesBrowseClient({ slugSegments }: AtualizacoesBrowseClientProps) {
  const searchParams = useSearchParams();
  const faixaId = searchParams.get("faixa") ?? undefined;
  const [data, setData] = useState<ResolveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rootFolders, setRootFolders] = useState<VipMusicFolder[]>([]);
  const [siblingWeeks, setSiblingWeeks] = useState<VipMusicFolder[]>([]);

  const slugPath = slugSegments.join("/");
  const firstSlug = slugSegments[0] ?? "";
  const secondSlug = slugSegments[1];

  useEffect(() => {
    void fetch("/api/musicas/tree", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => setRootFolders((body as { folders?: VipMusicFolder[] }).folders ?? []))
      .catch(() => setRootFolders([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
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

  const showingWeeks = useMemo(() => {
    if (!data || data.level !== "folders" || slugSegments.length !== 1) return false;
    if (isYearFolderName(data.folderName)) return false;
    return childrenAreWeekFolders(data.items);
  }, [data, slugSegments.length]);

  useEffect(() => {
    if (!firstSlug || !secondSlug || showingWeeks || isYearFolderName(data?.folderName ?? "")) {
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
        } else setSiblingWeeks([]);
      })
      .catch(() => {
        if (!cancelled) setSiblingWeeks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [firstSlug, secondSlug, showingWeeks, data?.folderName]);

  useEffect(() => {
    if (!data) return;
    pushRecentFolder({
      name: isDateFolderName(data.folderName)
        ? formatDateFolderLabel(data.folderName)
        : displayFolderName(data.folderName),
      href: folderHref(slugSegments),
    });
  }, [data, slugSegments]);

  const { authenticated } = useMusicasSession();
  const playbackEnabled = Boolean(data?.canPlay);

  const yearTitle = data?.resolvedPath[0]
    ? displayFolderName(data.resolvedPath[0].name)
    : firstSlug.replace(/-/g, " ");
  const currentTitle = data
    ? isDateFolderName(data.folderName)
      ? formatDateFolderLabel(data.folderName)
      : displayFolderName(data.folderName)
    : yearTitle;

  const isYearView =
    Boolean(data && data.level === "folders" && slugSegments.length === 1 && isYearFolderName(data.folderName));
  const isDateView =
    Boolean(data && data.level === "folders" && slugSegments.length === 2 && isDateFolderName(data.folderName));

  const formatFolder =
    data && data.level === "folders" && !isYearView && !isDateView && !showingWeeks
      ? pickAudioFormatFolder(data.items)
      : null;

  const showPackTracks = Boolean(data && (data.level === "tracks" || formatFolder));
  const showSourceCards =
    Boolean(data && data.level === "folders") && (isYearView || isDateView) && !showingWeeks;
  const showLegacyWeeks = showingWeeks;
  const showLegacyFolderCards =
    Boolean(data && data.level === "folders") &&
    !showPackTracks &&
    !showSourceCards &&
    !showLegacyWeeks &&
    !formatFolder;

  const childIds = data?.items.map((item) => item.id) ?? [];
  const newChildIds = useNewFolderHighlights(
    showLegacyWeeks ? weeksReadKey(firstSlug) : `atualizacoes:${slugPath}`,
    childIds,
  );

  const cardsAreDates = Boolean(
    data && (isDateView ? false : childrenAreDateFolders(data.items)),
  );

  return (
    <div className="w-full">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/musicas/atualizacoes"
          className="font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Atualizações
        </Link>
        {slugSegments.map((seg, index) => {
          const href = folderHref(slugSegments.slice(0, index + 1));
          const name = data?.resolvedPath[index]?.name ?? seg.replace(/-/g, " ");
          const label = isDateFolderName(name) ? formatDateFolderLabel(name) : displayFolderName(name);
          const isLast = index === slugSegments.length - 1;
          return (
            <span key={href} className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3" />
              {isLast ? (
                <span className="max-w-[14rem] truncate font-medium text-white" title={label}>
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="max-w-[12rem] truncate font-medium text-zinc-400 hover:text-white"
                  title={label}
                >
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

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

      {authenticated && data && !playbackEnabled && <VipUpgradeBanner />}

      {/* Pack flat: hero + tabela (sem accordion) */}
      {!loading && !error && data && showPackTracks && (
        <AtualizacoesPackView
          folderId={formatFolder?.id ?? data.folderId}
          folderName={data.folderName}
          yearLabel={data.resolvedPath[0] ? displayFolderName(data.resolvedPath[0].name) : undefined}
          packSlug={slugPath}
          relativePath={data.resolvedPath.map((p) => displayFolderName(p.name)).join("/")}
          canPlay={playbackEnabled}
          highlightTrackId={faixaId}
          autoPlayTrackId={playbackEnabled ? faixaId : undefined}
          continueContext={
            data.resolvedPath[0]
              ? {
                  monthSlug: firstSlug,
                  monthName: displayFolderName(data.resolvedPath[0].name),
                  weekSlug: slugSegments.length >= 3 ? secondSlug : undefined,
                  styleName: displayFolderName(data.folderName),
                }
              : undefined
          }
        />
      )}

      {/* Ano / Data: escolha via Sources (sidebar) + cards */}
      {!loading && !error && data && showSourceCards && (
        <div className="space-y-4">
          <div>
            <h1 className="font-display text-2xl font-black text-white sm:text-3xl" title={currentTitle}>
              {currentTitle}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {data.items.length}{" "}
              {cardsAreDates ? (data.items.length === 1 ? "data" : "datas") : data.items.length === 1 ? "pool" : "pools"}
              {" · "}
              use Sources no menu lateral
            </p>
            <div className="mt-3">
              <SendPackToDownloaderButton
                slug={slugPath}
                label={isDateView ? "Enviar data ao Downloader" : "Enviar ano ao Downloader"}
              />
            </div>
          </div>
          {data.items.length > 0 ? (
            <SourceCards
              baseSegments={slugSegments}
              items={data.items}
              newIds={newChildIds}
              asDates={cardsAreDates}
            />
          ) : (
            <p className="rounded-xl border border-zinc-800 bg-[#181818] px-4 py-10 text-center text-sm text-zinc-500">
              Pasta vazia. Selecione um Source no menu lateral quando disponível.
            </p>
          )}
        </div>
      )}

      {/* Legado: semanas */}
      {!loading && !error && data && showLegacyWeeks && (
        <>
          <AtualizacoesMonthHero
            folderName={data.folderName}
            styleCount={data.items.length}
            hasVip={playbackEnabled}
            mode="weeks"
            actions={<SendPackToDownloaderButton slug={firstSlug} label="Enviar mês ao Downloader" />}
          />
          <WeekFolderGrid
            monthSlug={firstSlug}
            monthName={yearTitle}
            weeks={data.items}
            newWeekIds={newChildIds}
          />
          <AtualizacoesMonthFooterNav
            monthSlug={firstSlug}
            months={rootFolders}
            weeks={data.items}
            weekSlug={secondSlug}
          />
        </>
      )}

      {/* Legado: pastas de estilo — cards, sem accordion */}
      {!loading && !error && data && showLegacyFolderCards && (
        <>
          <AtualizacoesMonthHero
            folderName={data.folderName}
            styleCount={data.items.length}
            hasVip={playbackEnabled}
            mode={secondSlug ? "week-styles" : "styles"}
            actions={<SendPackToDownloaderButton slug={slugPath} label="Enviar pasta ao Downloader" />}
          />
          {data.items.length > 0 ? (
            <SourceCards
              baseSegments={slugSegments}
              items={data.items}
              newIds={newChildIds}
              asDates={false}
            />
          ) : (
            <p className="rounded-xl border border-zinc-800 bg-[#181818] px-4 py-10 text-center text-sm text-zinc-500">
              Pasta vazia.
            </p>
          )}
          <AtualizacoesMonthFooterNav
            monthSlug={firstSlug}
            months={rootFolders}
            weeks={siblingWeeks}
            weekSlug={secondSlug}
          />
        </>
      )}
    </div>
  );
}
