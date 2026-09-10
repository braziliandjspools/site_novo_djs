"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, FolderOpen } from "lucide-react";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import { displayFolderName, folderHref, slugifyFolderName } from "../../lib/vip-music-slugs";
import { prefetchMusicasJson } from "../lib/musicas-fetch-cache";
import { CopyPackLinkButton } from "./CopyPackLinkButton";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import {
  packListPanelClass,
  packListRowTone,
  poolPanelClass,
  poolPanelHeaderBrClass,
} from "./atualizacoes-pool-ui";

type StyleFolderLinksProps = {
  folders: VipMusicCatalogItem[];
  slugSegments: string[];
  newFolderIds?: Set<string>;
};

export function StyleFolderLinks({ folders, slugSegments, newFolderIds }: StyleFolderLinksProps) {
  if (folders.length === 0) {
    return (
      <p className={`${poolPanelClass} px-4 py-8 text-center text-sm text-zinc-500`}>
        Nenhuma pasta nesta pasta. Adicione subpastas no Google Drive.
      </p>
    );
  }

  return (
    <div className={packListPanelClass}>
      <div className={poolPanelHeaderBrClass}>
        <h2 className="text-sm font-semibold tracking-tight text-white">Pastas</h2>
        <p className="text-[11px] tabular-nums text-zinc-500">
          {folders.length} pasta{folders.length === 1 ? "" : "s"}
        </p>
      </div>
      <ul className="divide-y divide-white/[0.04]">
        {folders.map((folder, index) => {
          const folderSlug = slugifyFolderName(folder.name);
          const nextSegments = [...slugSegments, folderSlug];
          const href = folderHref(nextSegments);
          const resolveSlug = nextSegments.join("/");
          const isNew = newFolderIds?.has(folder.id);
          const label = displayFolderName(folder.name);
          const cover = folder.coverUrl?.trim();

          return (
            <li
              key={folder.id}
              className={`flex w-full min-w-0 items-center gap-2 px-3 py-3 sm:px-4 ${packListRowTone(index)}`}
            >
              <Link
                href={href}
                onMouseEnter={() =>
                  prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`)
                }
                onFocus={() =>
                  prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`)
                }
                className="group flex min-w-0 flex-1 items-center gap-2.5"
              >
                {cover ? (
                  <span className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded shadow-sm ring-1 ring-white/10">
                    <Image
                      src={cover}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                      unoptimized={cover.startsWith("/api/")}
                    />
                  </span>
                ) : (
                  <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
                )}
                <span className="min-w-0 flex-1 break-words text-sm font-medium text-zinc-100 group-hover:text-white">
                  {label}
                </span>
                {isNew && (
                  <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#1ed760]">
                    Novo
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600 group-hover:text-zinc-300" />
              </Link>
              <div className="flex flex-shrink-0 items-center justify-end gap-1">
                <SendPackToDownloaderButton
                  slug={resolveSlug}
                  compact
                  label={`Enviar ${label} ao Downloader`}
                />
                <CopyPackLinkButton
                  slugSegments={nextSegments}
                  label={`Copiar link de ${label} para o Downloader`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
