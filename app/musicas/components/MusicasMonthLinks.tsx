"use client";

import Link from "next/link";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  displayFolderName,
  folderHref,
  parseMonthStatus,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";

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
  const sorted = [...folders].sort((a, b) => {
    const aNew = newFolderIds.has(a.id) ? 0 : 1;
    const bNew = newFolderIds.has(b.id) ? 0 : 1;
    return aNew - bNew;
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
            <Link
              key={folder.id}
              href={folderHref([slug])}
              className={`flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600/20 px-4 py-2.5 text-sm font-semibold text-orange-50 transition-all hover:bg-orange-500/35 hover:text-white ${
                isNew ? "ring-1 ring-orange-400/50" : ""
              }`}
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
          <Link
            key={folder.id}
            href={folderHref([slug])}
            className={`inline-flex items-center gap-2 rounded-full border bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[#1ed760]/50 hover:bg-[#1ed760]/10 hover:text-white ${
              isNew ? "border-[#1ed760]/60 text-white" : statusClass(status)
            }`}
          >
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
        );
      })}
    </div>
  );
}
