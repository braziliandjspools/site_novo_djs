"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Disc3, FolderOpen, Music2, Sparkles } from "lucide-react";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import { displayFolderName, folderHref, isMonthFolderName, slugifyFolderName, sortFoldersByMonthDate } from "../../lib/vip-music-slugs";
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
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-violet-400/15 pb-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-300">
            <Disc3 className="h-3.5 w-3.5" /> Brazilian Remix Service
          </span>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">Catálogo de músicas</h2>
          <p className="mt-1 text-xs text-zinc-500">Escolha uma pasta ou estilo para explorar o conteúdo.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] font-bold tabular-nums text-zinc-400">
          {items.length.toString().padStart(2, "0")} categorias
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
          const cover = folder.coverUrl?.trim() || null;

          return (
            <Link key={folder.id} href={href} prefetch={false}
              onMouseEnter={() => prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`)}
              onFocus={() => prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`)}
              className="group relative min-w-0 overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#181321] outline-none transition duration-300 hover:-translate-y-1 hover:border-violet-400/45 hover:bg-[#20172d] hover:shadow-[0_20px_45px_-24px_rgba(139,92,246,0.65)] focus-visible:ring-2 focus-visible:ring-violet-400">
              <div className="relative aspect-[5/4] overflow-hidden bg-[radial-gradient(circle_at_25%_20%,rgba(167,139,250,0.38),transparent_55%),linear-gradient(145deg,#352153,#120e1d)]">
                {cover ? (
                  <Image src={cover} alt="" fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 220px"
                    className="object-cover transition duration-500 group-hover:scale-105" unoptimized={cover.startsWith("/api/")} />
                ) : (
                  <>
                    <Disc3 className="absolute -bottom-6 -right-5 h-32 w-32 text-violet-200/[0.13] transition duration-500 group-hover:rotate-12 group-hover:scale-110 sm:h-40 sm:w-40" strokeWidth={0.8} />
                    <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200 backdrop-blur">
                      {hasTracks ? <Music2 className="h-5 w-5" /> : <FolderOpen className="h-5 w-5" />}
                    </span>
                  </>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120d1c]/85 via-transparent to-black/5" />
                <span className="absolute bottom-3 left-3 font-mono text-[10px] font-bold tracking-widest text-white/50">{String(folder.index + 1).padStart(2, "0")}</span>
                {folder.isNew ? (
                  <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-fuchsia-300/35 bg-fuchsia-500/85 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur">
                    <Sparkles className="h-2.5 w-2.5" /> Novo
                  </span>
                ) : null}
              </div>

              <div className="relative p-3 sm:p-4">
                <h3 className="line-clamp-2 min-h-9 text-[13px] font-extrabold leading-snug tracking-tight text-white transition group-hover:text-violet-200 sm:min-h-10 sm:text-[15px]">
                  {displayFolderName(folder.name)}
                </h3>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
                  <span className="truncate text-[10px] font-semibold text-zinc-500 sm:text-[11px]">{contentLabel}</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-300 transition group-hover:bg-violet-500 group-hover:text-white">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
