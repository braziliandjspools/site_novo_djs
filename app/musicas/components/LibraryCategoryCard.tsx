"use client";

import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, FolderOpen, Music2 } from "lucide-react";
import {
  formatLibraryStatCount,
  type LibraryCategoryGradient,
} from "../lib/library-category-meta";
import { prefetchMusicasJson } from "../lib/musicas-fetch-cache";

export type LibraryCategoryCardProps = {
  title: string;
  eyebrow: string;
  description?: string | null;
  folderCount?: number | null;
  trackCount?: number | null;
  href: string;
  /** Mantido por compatibilidade; o card usa tema verde + cinza escuro. */
  gradient?: LibraryCategoryGradient;
  icon: LucideIcon;
  cta: string;
  /** Prefetch do resolve da pasta (slug completo). */
  resolveSlug?: string;
  singularFolderLabel?: "subpasta" | "biblioteca";
  badge?: string | null;
  index?: number;
  className?: string;
  /** Capa da pasta raiz (imagem estática ou Drive). */
  coverUrl?: string | null;
};

function folderUnit(count: number, singular: "subpasta" | "biblioteca") {
  if (singular === "biblioteca") return count === 1 ? "biblioteca" : "bibliotecas";
  return count === 1 ? "subpasta" : "subpastas";
}

function StatBlock({
  value,
  label,
  icon: StatIcon,
}: {
  value: number;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[200px] flex-col items-center gap-2 rounded-xl border border-[#1ed760]/30 bg-[#121212]/90 px-4 py-3.5 text-center backdrop-blur-sm">
      <StatIcon className="h-4 w-4 flex-shrink-0 text-[#1ed760]/80" strokeWidth={2} aria-hidden />
      <div className="min-w-0">
        <p className="text-[28px] font-bold tabular-nums leading-none tracking-tight text-white sm:text-[30px]">
          {formatLibraryStatCount(value)}
        </p>
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">
          {label}
        </p>
      </div>
    </div>
  );
}

export function LibraryCategoryCard({
  title,
  eyebrow,
  description,
  folderCount,
  trackCount,
  href,
  icon: Icon,
  cta,
  resolveSlug,
  singularFolderLabel = "subpasta",
  badge,
  index = 0,
  className = "",
  coverUrl,
}: LibraryCategoryCardProps) {
  const hasFolders = typeof folderCount === "number" && folderCount > 0;
  const hasTracks = typeof trackCount === "number" && trackCount > 0;
  const primaryStat = hasFolders
    ? {
        value: folderCount as number,
        label: folderUnit(folderCount as number, singularFolderLabel),
        icon: FolderOpen,
      }
    : hasTracks
      ? {
          value: trackCount as number,
          label: (trackCount as number) === 1 ? "faixa" : "faixas",
          icon: Music2,
        }
      : null;
  const cover = coverUrl?.trim() || null;

  function prefetch() {
    if (!resolveSlug) return;
    prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`);
  }

  return (
    <Link
      href={href}
      aria-label={`${cta}: ${title}`}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className={`brs-folder-card group/card animate-fade-in-up relative mx-auto flex h-[300px] w-full max-w-[280px] flex-col overflow-hidden rounded-[18px] border border-[#1ed760]/30 bg-[#17191d] text-white opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.35)] outline-none transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-1 hover:border-[#1ed760]/55 hover:bg-[#121212] hover:shadow-[0_16px_32px_rgba(0,0,0,0.45)] focus-visible:ring-2 focus-visible:ring-[#1ed760]/40 md:h-[380px] md:max-w-none ${className}`}
    >
      {cover ? (
        <>
          <Image
            src={cover}
            alt=""
            fill
            sizes="280px"
            className="object-cover transition duration-500 group-hover/card:scale-[1.04]"
            unoptimized={cover.startsWith("/api/")}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,215,96,0.08),transparent_55%)]" />
      )}

      {!cover ? (
        <Icon
          className="pointer-events-none absolute bottom-[50px] right-[18px] h-[72px] w-[72px] text-white opacity-[0.08] sm:h-[88px] sm:w-[88px]"
          strokeWidth={1.25}
          aria-hidden
        />
      ) : null}

      <div className="relative z-10 flex h-full flex-col items-center p-4 pt-11 text-center sm:p-5 sm:pt-12">
        <div className="flex items-center justify-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
            {eyebrow}
          </p>
          {badge ? (
            <span className="rounded-full border border-[#1ed760]/35 bg-[#121212]/85 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#1ed760]">
              {badge}
            </span>
          ) : null}
        </div>

        <div className="mt-4 min-w-0 w-full sm:mt-5">
          <h3 className="text-[18px] font-bold leading-[1.1] tracking-[-0.03em] text-white drop-shadow sm:text-[20px]">
            {title}
          </h3>
          {description?.trim() ? (
            <p className="mx-auto mt-2 line-clamp-3 max-w-[22ch] text-[13px] leading-[1.45] text-white/75">
              {description.trim()}
            </p>
          ) : null}

          {primaryStat ? (
            <div className="mt-5 sm:mt-6">
              <StatBlock value={primaryStat.value} label={primaryStat.label} icon={primaryStat.icon} />
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex w-full justify-center pt-[18px] pb-1">
          <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-white transition-colors duration-200 group-hover/card:text-[#1ed760]">
            {cta}
            <ArrowRight
              className="h-4 w-4 text-[#1ed760]/80 transition-transform duration-200 ease-out group-hover/card:translate-x-1"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
