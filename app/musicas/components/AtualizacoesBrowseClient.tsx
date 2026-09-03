"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  childrenAreWeekFolders,
  displayFolderName,
  folderHref,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import { matchStyleSlug } from "../atualizacoes/AtualizacoesSearch";
import { AtualizacoesMonthFooterNav } from "./AtualizacoesMonthFooterNav";
import { AtualizacoesMonthHero } from "./AtualizacoesMonthHero";
import { StyleFolderAccordion } from "./StyleFolderAccordion";
import { WeekFolderGrid } from "./WeekFolderGrid";
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
  const estiloSlug = searchParams.get("estilo");
  const faixaId = searchParams.get("faixa");
  const [data, setData] = useState<ResolveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [months, setMonths] = useState<VipMusicFolder[]>([]);

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

  const showingWeeks = useMemo(() => {
    if (!data || data.level !== "folders" || slugSegments.length !== 1) return false;
    return childrenAreWeekFolders(data.items);
  }, [data, slugSegments.length]);

  const showingStyles = Boolean(data && data.level === "folders" && !showingWeeks);

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

  const { authenticated } = useMusicasSession();
  const playbackEnabled = Boolean(data?.canPlay);

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
        <ChevronRight className="h-3 w-3" />
        {weekSlug ? (
          <>
            <Link
              href={folderHref([monthSlug])}
              className="font-medium text-zinc-400 transition-colors hover:text-white"
            >
              {monthTitle}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-white">{weekTitle}</span>
          </>
        ) : (
          <span className="font-medium text-white">{currentTitle}</span>
        )}
      </nav>

      {data && (
        <AtualizacoesMonthHero
          folderName={data.folderName}
          styleCount={data.items.length}
          hasVip={playbackEnabled}
          mode={showingWeeks ? "weeks" : weekSlug ? "week-styles" : "styles"}
        />
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

      {!loading && !error && data && showingWeeks && (
        <>
          <WeekFolderGrid
            monthSlug={monthSlug}
            monthName={monthTitle}
            weeks={data.items}
            newWeekIds={newChildIds}
          />
          <AtualizacoesMonthFooterNav monthSlug={monthSlug} months={months} />
        </>
      )}

      {!loading && !error && data && showingStyles && (
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
                  relativePath={`${relativeStyleBase}/${displayFolderName(folder.name)}`}
                  monthSlug={monthSlug}
                  monthName={monthTitle}
                  weekSlug={weekSlug}
                  slugSegments={[monthSlug, weekSlug, slugifyFolderName(folder.name)].filter(
                    (part): part is string => Boolean(part),
                  )}
                  isNew={newChildIds.has(folder.id)}
                  isOpen={openFolderId === folder.id}
                  highlightTrackId={openFolderId === folder.id ? (faixaId ?? undefined) : undefined}
                  autoPlayTrackId={
                    openFolderId === folder.id && playbackEnabled && faixaId ? faixaId : undefined
                  }
                  scrollIntoView={Boolean(estiloSlug && matchStyleSlug(folder.name, estiloSlug))}
                  onToggle={() => setOpenFolderId((current) => (current === folder.id ? null : folder.id))}
                />
              ))
            )}
          </div>
          <AtualizacoesMonthFooterNav monthSlug={monthSlug} months={months} />
        </>
      )}
    </div>
  );
}
