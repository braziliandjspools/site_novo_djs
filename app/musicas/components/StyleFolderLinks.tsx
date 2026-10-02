"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Disc3, FolderOpen, Music2, Sparkles } from "lucide-react";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import { displayFolderName, folderHref, isMonthFolderName, slugifyFolderName, sortFoldersByMonthDate } from "../../lib/vip-music-slugs";
import { formatStyleNameForDisplay } from "../../lib/style-display";
import { prefetchMusicasJson } from "../lib/musicas-fetch-cache";

type StyleFolderLinksProps = {
  folders: VipMusicCatalogItem[];
  slugSegments: string[];
  newFolderIds?: Set<string>;
};

/** Pastas internas do catálogo (estilos, semanas e subpastas), com visual de DJ pool. */
export function StyleFolderLinks({ folders, slugSegments, newFolderIds }: StyleFolderLinksProps) {
  const monthLike = folders.filter((folder) => isMonthFolderName(folder.name)).length >= Math.max(1, Math.ceil(folders.length * 0.4));
  const ordered = useMemo(() => monthLike ? sortFoldersByMonthDate(folders, true) : folders, [folders, monthLike]);
  const items = useMemo(() => {
    const newestId = ordered[0]?.id ?? null;
    return ordered.map((folder, index) => ({
      ...folder,
      index,
      isNew: Boolean(newFolderIds?.has(folder.id)) || (monthLike && folder.id === newestId),
    }));
  }, [ordered, monthLike, newFolderIds]);

  return (
    <section className="mb-8 w-full min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#60cdff]/20 pb-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#60cdff]">
            <Disc3 className="h-3.5 w-3.5" /> Brazilian Remix Service
          </span>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">Catálogo de músicas</h2>
          <p className="mt-1 text-xs text-zinc-500">Escolha um estilo ou pasta para explorar o conteúdo.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] font-bold tabular-nums text-zinc-400">
          {items.length.toString().padStart(2, "0")} categorias
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b0b0b]">
        {items.map((folder) => {
          const nextSegments = [...slugSegments, slugifyFolderName(folder.name)];
          const href = folderHref(nextSegments);
          const resolveSlug = nextSegments.join("/");
          const count = folder.trackCount ?? 0;
          const subfolders = folder.folderCount ?? 0;
          const hasTracks = count > 0;
          const contentLabel = hasTracks
            ? `${count.toLocaleString("pt-BR")} ${count === 1 ? "faixa" : "faixas"}`
            : subfolders > 0
              ? `${subfolders.toLocaleString("pt-BR")} ${subfolders === 1 ? "pasta" : "pastas"}`
              : "Explorar conteúdo";

          return (
            <Link key={folder.id} href={href} prefetch={false}
              onMouseEnter={() => prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`)}
              onFocus={() => prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`)}
              className="group relative flex min-h-[74px] w-full min-w-0 items-center gap-3 px-3 py-3 outline-none transition hover:bg-[#141914] focus-visible:bg-[#141914] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#60cdff] sm:min-h-[82px] sm:gap-4 sm:px-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#60cdff]/20 bg-[#60cdff]/[0.08] text-[#60cdff] sm:h-12 sm:w-12">
                {hasTracks ? <Music2 className="h-5 w-5" /> : <FolderOpen className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  <span className="font-mono">{String(folder.index + 1).padStart(2, "0")}</span>
                  {folder.isNew ? <span className="inline-flex items-center gap-1 text-[#60cdff]"><Sparkles className="h-2.5 w-2.5" /> Novo</span> : null}
                </span>
                <span className="block truncate text-[13px] font-extrabold text-white transition group-hover:text-[#60cdff] sm:text-[15px]">
                  {formatStyleNameForDisplay(displayFolderName(folder.name))}
                </span>
                <span className="mt-1 block text-[10px] font-medium text-zinc-500 sm:text-[11px]">{contentLabel}</span>
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition group-hover:border-[#60cdff]/50 group-hover:bg-[#60cdff] group-hover:text-black">
                <ArrowRight className="h-4 w-4" />
              </span>
              {folder.index < items.length - 1 ? (
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-[#60cdff]/25 via-white/10 to-transparent">
                  <span className="block h-px w-7 bg-[#60cdff]/35" />
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );}
