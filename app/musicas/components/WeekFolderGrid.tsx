"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { displayFolderName, folderHref, parseWeekNumber, slugifyFolderName } from "../../lib/vip-music-slugs";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";

type WeekFolderGridProps = {
  monthSlug: string;
  monthName: string;
  weeks: VipMusicCatalogItem[];
  newWeekIds?: Set<string>;
};

export function WeekFolderGrid({ monthSlug, monthName, weeks, newWeekIds }: WeekFolderGridProps) {
  if (weeks.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-4 py-8 text-center text-sm text-zinc-500">
        Nenhuma semana neste mês. No Drive, use pastas como SEMANA 01, SEMANA 02…
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {weeks.map((week) => {
        const weekSlug = slugifyFolderName(week.name);
        const label = displayFolderName(week.name);
        const weekNumber = parseWeekNumber(week.name);
        const href = folderHref([monthSlug, weekSlug]);
        const isNew = newWeekIds?.has(week.id);

        return (
          <Link
            key={week.id}
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-4 transition-colors hover:border-[#1ed760]/35 hover:bg-[#1f1f1f]"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#1ed760]/12 text-[#1ed760]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-bold text-white group-hover:text-[#1ed760]">
                  {weekNumber != null ? `Semana ${String(weekNumber).padStart(2, "0")}` : label}
                </p>
                {isNew && (
                  <span className="rounded-md bg-[#1ed760] px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
                    Novo
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {monthName} · estilos e faixas
              </p>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-[#1ed760]" />
          </Link>
        );
      })}
    </div>
  );
}
