"use client";

import { useEffect, useMemo, useState } from "react";
import {
  displayFolderName,
  parseMonthFolderDate,
  parseMonthStatus,
  parseWeekNumber,
} from "../../lib/vip-music-slugs";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import {
  formatLiveCalendarTitle,
  formatLiveClock,
  formatPackWeekRangeLabel,
  getPackWeekDayRange,
  isCurrentPackWeek,
} from "../../lib/week-calendar";
import { LibraryFolderList, type LibraryFolderItem } from "./LibraryFolderGrid";

type WeekFolderGridProps = {
  parentSegments: string[];
  monthName: string;
  weeks: VipMusicCatalogItem[];
  newWeekIds?: Set<string>;
};

function useLiveNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function WeekFolderGrid({
  parentSegments,
  monthName,
  weeks,
  newWeekIds,
}: WeekFolderGridProps) {
  const now = useLiveNow(1000);
  const monthDate = parseMonthFolderDate(monthName);

  const items = useMemo((): LibraryFolderItem[] => {
    const ranked = weeks
      .map((week) => {
        const weekNumber = parseWeekNumber(week.name) ?? 999;
        const isCurrent =
          weekNumber !== 999 && monthDate
            ? isCurrentPackWeek(monthDate.year, monthDate.month, weekNumber, now)
            : false;
        return { week, weekNumber, isCurrent };
      })
      .sort((a, b) => {
        if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
        return a.weekNumber - b.weekNumber;
      });

    return ranked.map(({ week, weekNumber, isCurrent }) => {
      const days =
        weekNumber !== 999 && monthDate
          ? getPackWeekDayRange(monthDate.year, monthDate.month, weekNumber, now)
          : [];
      const rangeLabel = formatPackWeekRangeLabel(days);
      const weekStatus = parseMonthStatus(week.name);
      const weekTitle =
        weekNumber !== 999
          ? `Semana ${String(weekNumber).padStart(2, "0")}`
          : displayFolderName(week.name);

      let badge: string | null = null;
      if (weekStatus.status === "em-atualizacao") {
        badge = "Em atualização";
      } else if (isCurrent) {
        badge = "Esta semana";
      } else if (newWeekIds?.has(week.id)) {
        badge = "Mais recente";
      }

      return {
        id: week.id,
        name: week.name,
        title: weekTitle,
        folderCount: week.folderCount,
        trackCount: week.trackCount,
        coverUrl: week.coverUrl ?? null,
        detail: rangeLabel || null,
        badge,
        badgeTone:
          isCurrent || weekStatus.status === "em-atualizacao" || newWeekIds?.has(week.id)
            ? "green"
            : undefined,
      };
    });
  }, [monthDate, now, weeks, newWeekIds]);

  return (
    <LibraryFolderList
      className="mb-8"
      folders={items}
      slugSegments={parentSegments}
      newFolderIds={newWeekIds}
      layout="buttons"
      fillColumn
      emptyMessage="Nenhuma semana neste mês. No Drive, use pastas como SEMANA 01, SEMANA 02…"
      before={
        monthDate ? (
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#1a2332] to-[#14181E] px-4 py-3 ring-1 ring-white/5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ed760]">
                Calendário
              </p>
              <p className="mt-1 text-sm font-semibold capitalize text-white">
                {formatLiveCalendarTitle(now)}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Semana 01 = dias 1–7 · Semana 02 = 8–14…
              </p>
            </div>
            <p className="rounded-lg bg-black/40 px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-[#1ed760] ring-1 ring-[#1ed760]/25">
              {formatLiveClock(now)}
            </p>
          </div>
        ) : null
      }
    />
  );
}
