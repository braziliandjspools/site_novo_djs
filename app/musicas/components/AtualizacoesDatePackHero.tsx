"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Calendar, FolderOpen, Music2 } from "lucide-react";
import { PLACEHOLDER } from "../../lib/theme";
import { formatDateFolderLabel } from "../../lib/vip-music-slugs";

type AtualizacoesDatePackHeroProps = {
  folderName: string;
  yearLabel?: string;
  poolCount: number;
  isNew?: boolean;
  hasVip: boolean;
  actions?: ReactNode;
};

export function AtualizacoesDatePackHero({
  folderName,
  yearLabel,
  poolCount,
  isNew = false,
  hasVip,
  actions,
}: AtualizacoesDatePackHeroProps) {
  const dateLabel = formatDateFolderLabel(folderName);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#181818]">
      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-stretch sm:gap-6 sm:p-5">
        <div className="relative mx-auto aspect-square w-full max-w-[200px] flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:mx-0 sm:w-[180px] sm:max-w-none">
          <Image
            src={PLACEHOLDER.trackCover}
            alt=""
            fill
            className="object-cover"
            sizes="200px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {isNew && (
            <span className="absolute left-2 top-2 rounded-md bg-[#1ed760] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              Novo
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            {yearLabel && (
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {yearLabel}
              </span>
            )}
            <span className="rounded-md border border-[#1ed760]/30 bg-[#1ed760]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1ed760]">
              Áudio
            </span>
          </div>

          <h1
            className="mt-2 truncate font-display text-2xl font-black tracking-tight text-white sm:text-3xl"
            title={dateLabel}
          >
            {dateLabel}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5" title={dateLabel}>
              <Calendar className="h-3.5 w-3.5 text-zinc-600" />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5 text-zinc-600" />
              {poolCount} pool{poolCount === 1 ? "" : "s"}
            </span>
            {!hasVip && (
              <span className="inline-flex items-center gap-1.5 text-amber-400/90">
                <Music2 className="h-3.5 w-3.5" />
                Preview limitado
              </span>
            )}
          </div>

          {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
