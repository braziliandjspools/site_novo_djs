"use client";

import Link from "next/link";
import { CalendarDays, Download, HardDrive, Music2 } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import { formatBytes } from "../../lib/format-bytes";
import { folderHref } from "../../lib/vip-music-slugs";
import { CopyPackLinkButton } from "./CopyPackLinkButton";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { VipMusicTrackList } from "./VipMusicTrackList";
import { poolPanelClass } from "./atualizacoes-pool-ui";

export type AtualizacoesPackBlockData = {
  id: string;
  name: string;
  slugSegments: string[];
  monthName: string;
  weekName: string | null;
  modifiedAt: string | null;
  tracks: PreviewTrack[];
  trackCount?: number;
  totalSizeBytes?: number;
};

function formatPackDate(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function formatPackStamp(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-")
    .toUpperCase();
}

type AtualizacoesPackBlockProps = {
  pack: AtualizacoesPackBlockData;
  canPlay: boolean;
  canDownload: boolean;
  continueContext?: {
    styleName: string;
    monthName: string;
    monthSlug: string;
    weekSlug?: string;
  };
};

export function AtualizacoesPackBlock({
  pack,
  canPlay,
  canDownload,
  continueContext,
}: AtualizacoesPackBlockProps) {
  const href = folderHref(pack.slugSegments);
  const slug = pack.slugSegments.join("/");
  const dateLabel = formatPackDate(pack.modifiedAt);
  const stamp = formatPackStamp(pack.modifiedAt);
  const fileCount = pack.trackCount ?? pack.tracks.length;
  const totalSize = formatBytes(pack.totalSizeBytes ?? pack.tracks.reduce((sum, track) => sum + (track.sizeBytes ?? 0), 0));
  const tags = [pack.monthName, pack.weekName].filter(Boolean) as string[];

  return (
    <article className={`${poolPanelClass} bg-[#181818]`}>
      <header className="border-b border-white/[0.07] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              <Link href={href} className="hover:text-[#1ed760]">
                {pack.name}
                {stamp ? <span className="ml-1.5 font-semibold text-zinc-400">[{stamp}]</span> : null}
              </Link>
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
              {dateLabel ? (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dateLabel}
                </span>
              ) : null}
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  {tag}
                </span>
              ))}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <SendPackToDownloaderButton slug={slug} compact label={`Enviar ${pack.name} ao Downloader`} />
            <CopyPackLinkButton slugSegments={pack.slugSegments} label={`Copiar link de ${pack.name}`} />
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-black/35 px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              <Music2 className="h-3 w-3" />
              Arquivos
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-white">{fileCount}</dd>
          </div>
          <div className="rounded-lg bg-black/35 px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              <HardDrive className="h-3 w-3" />
              Tamanho
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-white">{totalSize}</dd>
          </div>
          <div className="col-span-2 rounded-lg bg-black/35 px-3 py-2 sm:col-span-1">
            <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              <Download className="h-3 w-3" />
              Pasta
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-[#1ed760]">
              <Link href={href} className="hover:underline">
                Abrir
              </Link>
            </dd>
          </div>
        </dl>
      </header>

      {pack.tracks.length > 0 ? (
        <>
          <VipMusicTrackList
            folderId={pack.id}
            tracks={pack.tracks}
            canPlay={canPlay}
            canDownload={canDownload}
            albumTitle={pack.name}
            layout="table"
            embedded
            continueContext={continueContext}
          />
          {fileCount > pack.tracks.length ? (
            <p className="border-t border-white/[0.06] px-4 py-3 text-center text-xs text-zinc-500">
              Mostrando {pack.tracks.length} de {fileCount} faixas.{" "}
              <Link href={href} className="font-semibold text-[#1ed760] hover:underline">
                Ver pasta completa
              </Link>
            </p>
          ) : null}
        </>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-zinc-500">Nenhuma faixa nesta pasta.</p>
      )}
    </article>
  );
}
