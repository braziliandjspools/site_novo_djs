"use client";

import Link from "next/link";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  displayFolderName,
  folderHref,
  parseMonthStatus,
  slugifyFolderName,
  sortFoldersByMonthDate,
} from "../../lib/vip-music-slugs";
import { CopyPackLinkButton } from "./CopyPackLinkButton";

function statusClass(status: ReturnType<typeof parseMonthStatus>["status"]) {
  if (status === "completo") return "border-[#1ed760]/40 text-[#1ed760]";
  if (status === "em-atualizacao") return "border-amber-500/40 text-amber-400";
  if (status === "em-breve") return "border-zinc-600 text-zinc-400";
  return "border-zinc-700 text-zinc-300";
}

type MusicasMonthLinksProps = {
  folders: VipMusicFolder[];
  newFolderIds: Set<string>;
  variant?: "inline" | "hero";
};

export function MusicasMonthLinks({ folders, newFolderIds, variant = "inline" }: MusicasMonthLinksProps) {
  const byDate = sortFoldersByMonthDate(folders, true);
  const sorted = [...byDate].sort((a, b) => {
    const aNew = newFolderIds.has(a.id) ? 0 : 1;
    const bNew = newFolderIds.has(b.id) ? 0 : 1;
    if (aNew !== bNew) return aNew - bNew;
    return 0;
  });

  if (sorted.length === 0) {
    return <p className="text-center text-sm text-zinc-500">Nenhum mês encontrado.</p>;
  }

  if (variant === "hero") {
    return (
      <div className="flex w-full flex-col gap-2">
        {sorted.map((folder) => {
          const slug = slugifyFolderName(folder.name);
          const { label } = parseMonthStatus(folder.name);
          const isNew = newFolderIds.has(folder.id);
          const name = displayFolderName(folder.name);

          return (
            <div
              key={folder.id}
              className={`flex w-full items-center gap-2 rounded-lg bg-orange-600/20 px-2 py-1.5 transition-all hover:bg-orange-500/35 ${
                isNew ? "ring-1 ring-orange-400/50" : ""
              }`}
            >
              <Link
                href={folderHref([slug])}
                className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2 py-1 text-sm font-semibold text-orange-50 hover:text-white"
              >
                <span>{name}</span>
                {isNew && (
                  <span className="rounded-full bg-orange-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                    Novas
                  </span>
                )}
                {!isNew && label ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200/80">{label}</span>
                ) : null}
              </Link>
              <CopyPackLinkButton
                slugSegments={[slug]}
                className="!h-8 !w-8 text-orange-100/80 hover:text-white"
                label="Copiar link do mês para o Downloader"
              />
            </div>
          );
        })}
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
            className={`inline-flex items-center gap-1 rounded-full border bg-[#1a1a1a] py-1 pl-4 pr-1.5 text-sm font-semibold transition-colors hover:border-[#1ed760]/50 hover:bg-[#1ed760]/10 ${
              isNew ? "border-[#1ed760]/60 text-white" : statusClass(status)
            }`}
          >
            <Link href={folderHref([slug])} className="inline-flex items-center gap-2 py-1.5 hover:text-white">
              <span>{name}</span>
              {isNew && (
                <span className="rounded-full bg-[#1ed760] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                  Novas
                </span>
              )}
              {!isNew && label ? (
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
              ) : null}
            </Link>
            <CopyPackLinkButton slugSegments={[slug]} label="Copiar link do mês para o Downloader" />
          </div>
        );
      })}
    </div>
  );
}
