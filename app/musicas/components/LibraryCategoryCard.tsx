"use client";

import Link from "next/link";
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
  folderCount?: number | null;
  trackCount?: number | null;
  href: string;
  gradient: LibraryCategoryGradient;
  icon: LucideIcon;
  cta: string;
  /** Prefetch do resolve da pasta (slug completo). */
  resolveSlug?: string;
  singularFolderLabel?: "subpasta" | "biblioteca";
  badge?: string | null;
  index?: number;
  className?: string;
};

function folderUnit(count: number, singular: "subpasta" | "biblioteca") {
  if (singular === "biblioteca") return count === 1 ? "biblioteca" : "bibliotecas";
  return count === 1 ? "subpasta" : "subpastas";
}

function StatCell({
  value,
  label,
  icon: StatIcon,
}: {
  value: number;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-2.5">
      <StatIcon className="h-3.5 w-3.5 text-white/45" strokeWidth={2} aria-hidden />
      <p className="text-[18px] font-bold tabular-nums leading-none tracking-tight text-white sm:text-[20px]">
        {formatLibraryStatCount(value)}
      </p>
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/50">{label}</p>
    </div>
  );
}

export function LibraryCategoryCard({
  title,
  eyebrow,
  folderCount,
  trackCount,
  href,
  gradient,
  icon: Icon,
  cta,
  resolveSlug,
  singularFolderLabel = "subpasta",
  badge,
  index = 0,
  className = "",
}: LibraryCategoryCardProps) {
  const hasFolders = typeof folderCount === "number" && folderCount > 0;
  const hasTracks = typeof trackCount === "number" && trackCount > 0;

  function prefetch() {
    if (!resolveSlug) return;
    prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`);
  }

  return (
    <Link
      href={href}
      aria-label={`Abrir ${title}`}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className={`brs-folder-card group/card animate-fade-in-up relative mx-auto flex h-[300px] w-full max-w-[240px] flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-gradient-to-b ${gradient.surface} opacity-0 shadow-[0_18px_40px_rgba(0,0,0,0.28)] outline-none transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-white/[0.14] hover:shadow-[0_24px_48px_rgba(0,0,0,0.34)] focus-visible:ring-2 focus-visible:ring-white/30 sm:h-[390px] ${gradient.ring} ${className}`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b ${gradient.edge} opacity-60`} />
      <div className={`pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full ${gradient.glow} blur-3xl`} />
      <div className={`pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full ${gradient.glow} blur-3xl`} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(0,0,0,0.42)_100%)]" />

      <Icon
        className="pointer-events-none absolute bottom-5 right-4 h-[72px] w-[72px] text-white opacity-[0.08] sm:bottom-6 sm:right-5 sm:h-[84px] sm:w-[84px]"
        strokeWidth={1.25}
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
              {eyebrow}
            </p>
            {badge ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/80">
                {badge}
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 text-center">
          <h3 className="text-[17px] font-bold leading-[1.1] tracking-[-0.03em] text-white sm:text-[19px]">
            {title}
          </h3>

          {(hasFolders || hasTracks) && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.1] bg-black/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md sm:mt-6">
              <div className="flex items-stretch divide-x divide-white/[0.08]">
                {hasFolders ? (
                  <StatCell
                    value={folderCount}
                    label={folderUnit(folderCount, singularFolderLabel)}
                    icon={FolderOpen}
                  />
                ) : null}
                {hasTracks ? (
                  <StatCell
                    value={trackCount}
                    label={trackCount === 1 ? "faixa" : "faixas"}
                    icon={Music2}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-4">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/90 transition-transform duration-200 group-hover/card:translate-x-0.5 sm:text-[13px]">
            {cta}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover/card:translate-x-[3px]"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
