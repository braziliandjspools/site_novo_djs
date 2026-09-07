"use client";

import Link from "next/link";
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
import { CopyPackLinkButton } from "./CopyPackLinkButton";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";

function statusClass(status: ReturnType<typeof parseMonthStatus>["status"]) {
  if (status === "completo") return "border-[#1ed760]/40 text-[#1ed760]";
  if (status === "em-atualizacao") return "border-amber-500/40 text-amber-400";
  if (status === "em-breve") return "border-zinc-600 text-zinc-400";
  return "border-zinc-700 text-zinc-300";
}

function StatusBadge({
  label,
  status,
  tone = "default",
}: {
  label: string;
  status: ReturnType<typeof parseMonthStatus>["status"];
  tone?: "default" | "hero";
}) {
  if (!label) return null;

  if (tone === "hero") {
    if (status === "em-atualizacao") {
      return (
        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
          {label}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200/80">{label}</span>
    );
  }

  if (status === "em-atualizacao") {
    return (
      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
        {label}
      </span>
    );
  }

  return <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>;
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
      <div className="flex w-full flex-col gap-2">
        {sorted.map((folder) => {
          const slug = slugifyFolderName(folder.name);
          const { label, status } = parseMonthStatus(folder.name);
          const isNew = newFolderIds.has(folder.id);
          const name = displayFolderName(folder.name);
          const updating = status === "em-atualizacao";

          return (
            <div
              key={folder.id}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-all sm:px-4 sm:py-3 ${
                updating
                  ? "bg-amber-500/20 ring-1 ring-amber-400/40 hover:bg-amber-500/30"
                  : "bg-orange-600/20 hover:bg-orange-500/35"
              } ${isNew && !updating ? "ring-1 ring-orange-400/50" : ""}`}
            >
              <Link
                href={folderHref([slug])}
                className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold text-orange-50 hover:text-white sm:text-base"
              >
                <span>{name}</span>
                {isNew && (
                  <span className="rounded-full bg-orange-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                    Novas
                  </span>
                )}
                <StatusBadge label={label} status={status} tone="hero" />
              </Link>
              <SendPackToDownloaderButton
                slug={slug}
                compact
                label="Enviar mês inteiro ao Downloader"
                className="!h-9 !w-9 text-orange-100/80 hover:text-white"
              />
              <CopyPackLinkButton
                slugSegments={[slug]}
                className="!h-9 !w-9 text-orange-100/80 hover:text-white"
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
            <Link
              href={folderHref([slug])}
              className="inline-flex cursor-pointer items-center gap-2 py-1.5 hover:text-white"
            >
              <span>{name}</span>
              {isNew && (
                <span className="rounded-full bg-[#1ed760] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
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
