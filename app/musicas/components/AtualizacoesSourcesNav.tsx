"use client";

import Image from "next/image";
import Link from "next/link";
import {
  childrenAreDateFolders,
  displayFolderName,
  folderHref,
  formatDateFolderLabel,
  slugifyFolderName,
  sortFoldersByDateFolder,
  sortFoldersByYear,
} from "../../lib/vip-music-slugs";
import { PLACEHOLDER } from "../../lib/theme";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";

type AtualizacoesSourcesNavProps = {
  years: VipMusicFolder[];
  dates: VipMusicFolder[];
  activeYearSlug?: string;
  activeDateSlug?: string;
  /** Contagem de pools por id da pasta de data (opcional). */
  poolCountByDateId?: Record<string, number>;
  newDateIds?: Set<string>;
};

export function AtualizacoesSourcesNav({
  years,
  dates,
  activeYearSlug,
  activeDateSlug,
  poolCountByDateId = {},
  newDateIds,
}: AtualizacoesSourcesNavProps) {
  const sortedYears = sortFoldersByYear(years, true);
  const sortedDates = childrenAreDateFolders(dates)
    ? sortFoldersByDateFolder(dates, true)
    : [...dates].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <aside className="w-full min-w-0 md:w-[260px] md:flex-shrink-0">
      <div className="rounded-2xl border border-white/[0.06] bg-[#181818] p-3 md:sticky md:top-4">
        {sortedYears.length > 0 && (
          <div className="mb-3">
            <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Ano</p>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
              {sortedYears.map((year) => {
                const slug = slugifyFolderName(year.name);
                const active = activeYearSlug === slug;
                const label = displayFolderName(year.name);
                return (
                  <Link
                    key={year.id}
                    href={folderHref([slug])}
                    title={label}
                    className={`min-w-0 truncate rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-[#1ed760]/15 text-[#1ed760]"
                        : "bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Sources</p>

        {sortedDates.length === 0 ? (
          <p className="mt-3 px-1 text-xs text-zinc-600">
            {activeYearSlug
              ? "Nenhuma data neste ano. Use pastas DATA DD/MM/AAAA no Drive."
              : "Selecione um ano para ver as datas."}
          </p>
        ) : (
          <ul className="mt-2 max-h-[min(60vh,28rem)] space-y-1 overflow-y-auto overscroll-contain md:max-h-[calc(100dvh-14rem)]">
            {sortedDates.map((dateFolder) => {
              const dateSlug = slugifyFolderName(dateFolder.name);
              const label = formatDateFolderLabel(dateFolder.name);
              const fullName = displayFolderName(dateFolder.name);
              const active = activeDateSlug === dateSlug;
              const poolCount = poolCountByDateId[dateFolder.id];
              const href = activeYearSlug
                ? folderHref([activeYearSlug, dateSlug])
                : folderHref([dateSlug]);
              const isNew = newDateIds?.has(dateFolder.id);

              return (
                <li key={dateFolder.id}>
                  <Link
                    href={href}
                    title={fullName}
                    className={`flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors ${
                      active
                        ? "bg-[#1ed760]/12 ring-1 ring-[#1ed760]/30"
                        : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10">
                      <Image
                        src={PLACEHOLDER.trackCover}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm font-semibold ${
                          active ? "text-[#1ed760]" : "text-white"
                        }`}
                      >
                        {label}
                      </span>
                      <span className="block truncate text-[11px] text-zinc-500">
                        {typeof poolCount === "number"
                          ? `${poolCount} pool${poolCount === 1 ? "" : "s"}`
                          : "Atualização"}
                        {isNew ? " · Novo" : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
