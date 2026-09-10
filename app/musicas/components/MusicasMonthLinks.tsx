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
  packListPanelClass,
  packListRowTone,
  poolPanelHeaderBrClass,
  poolPanelClass,
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
      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
        {label}
      </span>
    );
  }
  if (status === "completo") {
    return (
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1ed760]/90">
        {label}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
  );
}

type MusicasMonthLinksProps = {
  folders: VipMusicFolder[];
  newFolderIds: Set<string>;
  variant?: "inline" | "hero";
};

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
      <div className={packListPanelClass}>
        <div className={poolPanelHeaderBrClass}>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">Pastas</h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">Cada nível abre em página nova</p>
          </div>
          <p className="text-[11px] tabular-nums text-zinc-500">
            {sorted.length} pasta{sorted.length === 1 ? "" : "s"}
          </p>
        </div>
        <ul className="divide-y divide-white/[0.04]">
          {sorted.map((folder, index) => {
            const slug = slugifyFolderName(folder.name);
            const { label, status } = parseMonthStatus(folder.name);
            const isNew = newFolderIds.has(folder.id);
            const name = displayFolderName(folder.name);
            const rowTone = packListRowTone(index);

            return (
              <li
                key={folder.id}
                className={`flex w-full min-w-0 items-center gap-2 px-3 py-3 transition-colors sm:px-4 ${rowTone}`}
              >
                <Link
                  href={folderHref([slug])}
                  onMouseEnter={() => prefetchFolder(slug)}
                  onFocus={() => prefetchFolder(slug)}
                  className="group flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="min-w-0 flex-1 break-words text-sm font-medium text-zinc-100 group-hover:text-white">
                    {name}
                  </span>
                  {isNew && (
                    <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#1ed760]">
                      Novo
                    </span>
                  )}
                  <StatusBadge label={label} status={status} />
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600 group-hover:text-zinc-300" />
                </Link>
                <div className="flex flex-shrink-0 items-center justify-end gap-1">
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
              </li>
            );
          })}
        </ul>
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
