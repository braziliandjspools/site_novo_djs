"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-sky-200/75">
            <Disc3 className="h-3.5 w-3.5" /> Brazilian Remix Service
          </span>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">Explore este acervo</h2>
          <p className="mt-1 text-xs text-white/45">Abra uma categoria para encontrar as faixas e pastas disponíveis.</p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 font-mono text-[10px] font-bold tabular-nums text-white/50">
          {items.length.toString().padStart(2, "0")} {items.length === 1 ? "categoria" : "categorias"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 min-[520px]:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((folder) => {
          const nextSegments = [...slugSegments, slugifyFolderName(folder.name)];
          const href = folderHref(nextSegments);
          const resolveSlug = nextSegments.join("/");
          const count = folder.trackCount ?? 0;
          const subfolders = folder.folderCount ?? 0;
          const hasTracks = count > 0;
          const cover = folder.coverUrl?.trim() || null;
          const contentLabel = hasTracks
            ? `${count.toLocaleString("pt-BR")} ${count === 1 ? "faixa" : "faixas"}`
            : subfolders > 0
              ? `${subfolders.toLocaleString("pt-BR")} ${subfolders === 1 ? "pasta" : "pastas"}`
              : "Explorar conteúdo";

          return (
            <Link
              key={folder.id}
              href={href}
              prefetch={false}
              onMouseEnter={() => prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`)}
              onFocus={() => prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`)}
              className="group min-w-0 rounded-2xl border border-white/[0.07] bg-[#111418] p-2.5 transition duration-300 hover:-translate-y-1 hover:border-sky-200/25 hover:bg-[#171c22] hover:shadow-[0_18px_44px_-28px_rgba(96,205,255,0.48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70 sm:p-3"
            >
              <span className="relative block aspect-square overflow-hidden rounded-xl bg-[radial-gradient(circle_at_32%_22%,rgba(96,205,255,0.2),#101317_68%)]">
                {cover ? (
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes="(max-width: 520px) 44vw, (max-width: 1024px) 28vw, 210px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    unoptimized={cover.startsWith("/api/")}
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-sky-100/45">
                    {hasTracks ? <Music2 className="h-10 w-10" strokeWidth={1.2} /> : <FolderOpen className="h-10 w-10" strokeWidth={1.2} />}
                  </span>
                )}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
                <span className="absolute left-2 top-2 rounded-md border border-white/10 bg-black/45 px-1.5 py-1 font-mono text-[9px] font-bold text-white/75 backdrop-blur-sm">
                  {String(folder.index + 1).padStart(2, "0")}
                </span>
                {folder.isNew ? (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-sky-200/25 bg-[#0d1419]/80 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-sky-100 backdrop-blur-sm">
                    <Sparkles className="h-2.5 w-2.5" /> Novo
                  </span>
                ) : null}
                <span className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-sky-200 text-[#08121a] opacity-0 shadow-lg shadow-sky-300/20 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:opacity-100">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </span>
              <span className="block min-w-0 px-1 pb-1 pt-3">
                <span className="block truncate text-[12px] font-bold leading-snug text-white transition-colors group-hover:text-sky-100 sm:text-sm">
                  {formatStyleNameForDisplay(displayFolderName(folder.name))}
                </span>
                <span className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium text-white/45 sm:text-[11px]">
                  {hasTracks ? <Music2 className="h-3.5 w-3.5 text-sky-200/70" /> : <FolderOpen className="h-3.5 w-3.5 text-sky-200/70" />}
                  <span className="truncate">{contentLabel}</span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );}
