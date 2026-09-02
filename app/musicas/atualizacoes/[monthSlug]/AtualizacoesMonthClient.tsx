"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../../lib/vip-music-catalog";
import { displayFolderName } from "../../../lib/vip-music-slugs";
import { matchStyleSlug } from "../AtualizacoesSearch";
import { AtualizacoesMonthFooterNav } from "../../components/AtualizacoesMonthFooterNav";
import { AtualizacoesMonthHero } from "../../components/AtualizacoesMonthHero";
import { StyleFolderAccordion } from "../../components/StyleFolderAccordion";
import { VipMusicPlayerProvider } from "../../components/VipMusicPlayerContext";
import { VipUpgradeBanner } from "../../VipUpgradeGate";
import { useMusicasSession } from "../../components/MusicasSessionContext";
import { stylesReadKey } from "../../lib/read-state";
import { useNewFolderHighlights } from "../../lib/use-new-folder-highlights";

type MonthResponse = {
  folderId: string;
  folderName: string;
  level: "folders" | "tracks";
  items: VipMusicCatalogItem[];
  canPlay: boolean;
  resolvedPath: { slug: string; id: string; name: string }[];
};

export function AtualizacoesMonthClient({ monthSlug }: { monthSlug: string }) {
  const searchParams = useSearchParams();
  const estiloSlug = searchParams.get("estilo");
  const faixaId = searchParams.get("faixa");
  const [data, setData] = useState<MonthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [months, setMonths] = useState<VipMusicFolder[]>([]);

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

    void fetch(`/api/musicas/resolve?slug=${encodeURIComponent(monthSlug)}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as MonthResponse & { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Mês não encontrado.");
        setData(body);
      })
      .catch((err: Error) => {
        setError(err.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [monthSlug]);

  useEffect(() => {
    if (!data || !estiloSlug) return;
    const match = data.items.find((item) => matchStyleSlug(item.name, estiloSlug));
    if (match) setOpenFolderId(match.id);
  }, [data, estiloSlug]);

  const { authenticated } = useMusicasSession();
  const playbackEnabled = Boolean(data?.canPlay);
  const title = data ? displayFolderName(data.folderName) : monthSlug.replace(/-/g, " ");
  const styleFolderIds = data?.items.map((item) => item.id) ?? [];
  const newStyleIds = useNewFolderHighlights(stylesReadKey(monthSlug), styleFolderIds);

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
        <span className="font-medium text-white">{title}</span>
      </nav>

      {data && (
        <AtualizacoesMonthHero
          folderName={data.folderName}
          styleCount={data.items.length}
          hasVip={playbackEnabled}
        />
      )}

      {authenticated && !playbackEnabled && <VipUpgradeBanner />}

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {!loading && !error && data && (
        <VipMusicPlayerProvider canPlay={playbackEnabled}>
          <div className="space-y-3">
            {data.items.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-4 py-8 text-center text-sm text-zinc-500">
                Nenhum estilo neste mês. Adicione subpastas no Google Drive.
              </p>
            ) : (
              data.items.map((folder) => (
                <StyleFolderAccordion
                  key={folder.id}
                  folder={folder}
                  canPlay={playbackEnabled}
                  canDownload={playbackEnabled}
                  relativePath={`${title}/${displayFolderName(folder.name)}`}
                  isNew={newStyleIds.has(folder.id)}
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
        </VipMusicPlayerProvider>
      )}
    </div>
  );
}
