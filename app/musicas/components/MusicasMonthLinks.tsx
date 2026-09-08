"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  displayFolderName,
  folderHref,
  parseMonthStatus,
  parseYearCollectionFolder,
  slugifyFolderName,
  sortFoldersByMonthDate,
  sortFoldersByYearCollection,
} from "../../lib/vip-music-slugs";
import { prefetchMusicasJson } from "../lib/musicas-fetch-cache";
import { CopyPackLinkButton } from "./CopyPackLinkButton";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import {
  poolPanelClass,
  poolPanelHeaderClass,
  poolRowBaseClass,
  poolRowTone,
  poolTableHeadClass,
} from "./atualizacoes-pool-ui";

function prefetchFolder(slug: string) {
  prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(slug)}`);
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: ReturnType<typeof parseMonthStatus>["status"];
}) {
  if (!label) return null;

  if (status === "em-atualizacao") {
    return (
      <span className="rounded bg-amber-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
        {label}
      </span>
    );
  }
  if (status === "completo") {
    return (
      <span className="rounded border border-[#1ed760]/35 bg-[#1ed760]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#1ed760]">
        {label}
      </span>
    );
  }
  return (
    <span className="rounded border border-zinc-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
      {label}
    </span>
  );
}

type MusicasMonthLinksProps = {
  folders: VipMusicFolder[];
  newFolderIds: Set<string>;
  variant?: "inline" | "hero";
};

const MONTH_GRID = "grid-cols-[minmax(0,1fr)_auto_auto]";

export function MusicasMonthLinks({ folders, newFolderIds, variant = "inline" }: MusicasMonthLinksProps) {
  const yearLike = folders.filter((folder) => parseYearCollectionFolder(folder.name)).length;
  const byStructure =
    yearLike >= Math.ceil(folders.length * 0.5)
      ? sortFoldersByYearCollection(folders, true)
      : sortFoldersByMonthDate(folders, true);
  const sorted = [...byStructure].sort((a, b) => {
    const aNew = newFolderIds.has(a.id) ? 0 : 1;
    const bNew = newFolderIds.has(b.id) ? 0 : 1;
    if (aNew !== bNew) return aNew - bNew;
    return byStructure.indexOf(a) - byStructure.indexOf(b);
  });

  if (sorted.length === 0) {
    return <p className="text-center text-sm text-zinc-500">Nenhum mês encontrado.</p>;
  }

  if (variant === "hero") {
    return (
      <div className={poolPanelClass}>
        <div className={poolPanelHeaderClass}>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">Pastas do acervo</h2>
          <p className="text-[11px] text-zinc-500">Abra a pasta · envie ao Downloader</p>
        </div>
        <div className={`${poolTableHeadClass} ${MONTH_GRID}`}>
          <span>Nome</span>
          <span className="hidden sm:inline">Status</span>
          <span className="text-right">Ações</span>
        </div>
        <div>
          {sorted.map((folder, index) => {
            const slug = slugifyFolderName(folder.name);
            const { label, status } = parseMonthStatus(folder.name);
            const isNew = newFolderIds.has(folder.id);
            const name = displayFolderName(folder.name);

            return (
              <div key={folder.id} className={`${poolRowBaseClass} ${MONTH_GRID} ${poolRowTone(index)}`}>
                <Link
                  href={folderHref([slug])}
                  onMouseEnter={() => prefetchFolder(slug)}
                  onFocus={() => prefetchFolder(slug)}
                  className="group flex min-w-0 items-center gap-2 text-left"
                >
                  <span className="truncate text-sm font-semibold text-zinc-100 group-hover:text-[#1ed760]">
                    {name}
                  </span>
                  {isNew && (
                    <span className="flex-shrink-0 rounded bg-[#1ed760] px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
                      Novo
                    </span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600 group-hover:text-[#1ed760]" />
                </Link>
                <div className="hidden sm:flex sm:justify-center">
                  <StatusBadge label={label} status={status} />
                </div>
                <div className="flex items-center justify-end gap-1">
                  <SendPackToDownloaderButton
                    slug={slug}
                    compact
                    label="Enviar mês inteiro ao Downloader"
                  />
                  <CopyPackLinkButton
                    slugSegments={[slug]}
                    label="Copiar link do mês para o Downloader"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {sorted.map((folder) => {
        const slug = slugifyFolderName(folder.name);
        const { label, status } = parseMonthStatus(folder.name);
        const isNew = newFolderIds.has(folder.id);
        const name = displayFolderName(folder.name);

        return (
          <div
            key={folder.id}
            className={`inline-flex items-center gap-1 rounded border border-zinc-700 bg-[#1a1a1a] py-1 pl-4 pr-1.5 text-sm font-semibold transition-colors hover:border-[#1ed760]/50 ${
              isNew ? "text-white" : "text-zinc-300"
            }`}
          >
            <Link
              href={folderHref([slug])}
              onMouseEnter={() => prefetchFolder(slug)}
              onFocus={() => prefetchFolder(slug)}
              className="inline-flex cursor-pointer items-center gap-2 py-1.5 hover:text-white"
            >
              <span>{name}</span>
              {isNew && (
                <span className="rounded bg-[#1ed760] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                  Novas
                </span>
              )}
              <StatusBadge label={label} status={status} />
            </Link>
            <SendPackToDownloaderButton
              slug={slug}
              compact
              label="Enviar mês inteiro ao Downloader"
            />
            <CopyPackLinkButton slugSegments={[slug]} label="Copiar link do mês para o Downloader" />
          </div>
        );
      })}
    </div>
  );
}
