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
import { LibraryFolderList, type LibraryFolderItem } from "./LibraryFolderList";

type WeekFolderGridProps = {
  monthSlug: string;
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

export function WeekFolderGrid({ monthSlug, monthName, weeks, newWeekIds }: WeekFolderGridProps) {
  const now = useLiveNow(1000);
  const monthDate = parseMonthFolderDate(monthName);

  const items = useMemo((): LibraryFolderItem[] => {
    return weeks.map((week) => {
      const weekNumber = parseWeekNumber(week.name);
      const days =
        weekNumber != null && monthDate
          ? getPackWeekDayRange(monthDate.year, monthDate.month, weekNumber, now)
          : [];
      const rangeLabel = formatPackWeekRangeLabel(days);
      const isCurrent =
        weekNumber != null && monthDate
          ? isCurrentPackWeek(monthDate.year, monthDate.month, weekNumber, now)
          : false;
      const weekStatus = parseMonthStatus(week.name);
      const weekTitle =
        weekNumber != null ? `Semana ${String(weekNumber).padStart(2, "0")}` : displayFolderName(week.name);

      let badge: string | null = null;
      let badgeTone: LibraryFolderItem["badgeTone"] = "green";
      if (weekStatus.status === "em-atualizacao") {
        badge = "Em atualização";
        badgeTone = "amber";
      } else if (isCurrent) {
        badge = "Esta semana";
        badgeTone = "green";
      }

      return {
        id: week.id,
        name: week.name,
        title: weekTitle,
        folderCount: week.folderCount,
        trackCount: week.trackCount,
        detail: rangeLabel || null,
        badge,
        badgeTone: badge ? badgeTone : undefined,
      };
    });
  }, [monthDate, now, weeks]);

  return (
    <LibraryFolderList
      className="mb-6"
      folders={items}
      slugSegments={[monthSlug]}
      newFolderIds={newWeekIds}
      title="Semanas"
      description={`Semanas de ${monthName}`}
      descriptionMobile={monthName}
      emptyMessage="Nenhuma semana neste mês. No Drive, use pastas como SEMANA 01, SEMANA 02…"
      before={
        monthDate ? (
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-[20px] border border-white/5 bg-[#0f1012] px-4 py-3">
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
            <p className="rounded-full border border-[#1ed760]/25 bg-black/40 px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-[#1ed760]">
              {formatLiveClock(now)}
            </p>
          </div>
        ) : null
      }
    />
  );
}
