"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  displayFolderName,
  folderHref,
  parseMonthFolderDate,
  parseWeekNumber,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import {
  formatLiveCalendarTitle,
  formatLiveClock,
  formatPackWeekRangeLabel,
  getPackWeekDayRange,
  isCurrentPackWeek,
  type CalendarDay,
} from "../../lib/week-calendar";
import { CopyPackLinkButton } from "./CopyPackLinkButton";

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

function WeekDayStrip({ days }: { days: CalendarDay[] }) {
  if (days.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-7 gap-1.5">
      {days.map((day) => (
        <div
          key={day.iso}
          className={`flex flex-col items-center rounded-lg px-1 py-2 text-center transition-colors ${
            day.isToday
              ? "bg-[#1ed760] text-black shadow-[0_0_20px_rgba(30,215,96,0.35)]"
              : "bg-black/35 text-zinc-400"
          }`}
        >
          <span
            className={`text-[9px] font-bold uppercase tracking-wide ${
              day.isToday ? "text-black/70" : "text-zinc-500"
            }`}
          >
            {day.weekdayShort}
          </span>
          <span className={`mt-0.5 text-sm font-black tabular-nums ${day.isToday ? "text-black" : "text-white"}`}>
            {day.day}
          </span>
        </div>
      ))}
    </div>
  );
}

export function WeekFolderGrid({ monthSlug, monthName, weeks, newWeekIds }: WeekFolderGridProps) {
  const now = useLiveNow(1000);
  const monthDate = parseMonthFolderDate(monthName);

  if (weeks.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-4 py-8 text-center text-sm text-zinc-500">
        Nenhuma semana neste mês. No Drive, use pastas como SEMANA 01, SEMANA 02…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {monthDate && (
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-white/[0.06] bg-gradient-to-r from-[#12261a] via-[#161616] to-[#121212] px-4 py-4 sm:px-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#1ed760]">
              Calendário em tempo real
            </p>
            <p className="mt-1 text-base font-semibold capitalize text-white sm:text-lg">
              {formatLiveCalendarTitle(now)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Semana 01 = dias 1–7 · Semana 02 = 8–14 · e assim por diante
            </p>
          </div>
          <p className="rounded-xl border border-[#1ed760]/25 bg-black/40 px-3 py-2 font-mono text-sm font-bold tabular-nums text-[#1ed760]">
            {formatLiveClock(now)}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {weeks.map((week) => {
          const weekSlug = slugifyFolderName(week.name);
          const label = displayFolderName(week.name);
          const weekNumber = parseWeekNumber(week.name);
          const href = folderHref([monthSlug, weekSlug]);
          const isNew = newWeekIds?.has(week.id);
          const days =
            weekNumber != null && monthDate
              ? getPackWeekDayRange(monthDate.year, monthDate.month, weekNumber, now)
              : [];
          const rangeLabel = formatPackWeekRangeLabel(days);
          const isCurrent =
            weekNumber != null && monthDate
              ? isCurrentPackWeek(monthDate.year, monthDate.month, weekNumber, now)
              : false;
          const weekTitle =
            weekNumber != null ? `Semana ${String(weekNumber).padStart(2, "0")}` : label;

          return (
            <div
              key={week.id}
              className={`group relative overflow-hidden rounded-2xl border transition-colors ${
                isCurrent
                  ? "border-[#1ed760]/45 bg-gradient-to-br from-[#1ed760]/12 via-[#1a1a1a] to-[#121212]"
                  : "border-white/[0.06] bg-[#1a1a1a] hover:border-[#1ed760]/35 hover:bg-[#1f1f1f]"
              }`}
            >
              <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#1ed760]/10 blur-2xl" />

              <div className="relative flex items-start gap-2 p-4 sm:p-5">
                <Link href={href} className="min-w-0 flex-1">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl ${
                        isCurrent ? "bg-[#1ed760] text-black" : "bg-[#1ed760]/12 text-[#1ed760]"
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Sem</span>
                      <span className="text-2xl font-black tabular-nums leading-none">
                        {weekNumber != null ? String(weekNumber).padStart(2, "0") : "—"}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black tracking-tight text-white group-hover:text-[#1ed760]">
                          {weekTitle}
                        </p>
                        {isCurrent && (
                          <span className="rounded-md bg-[#1ed760] px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
                            Esta semana
                          </span>
                        )}
                        {isNew && !isCurrent && (
                          <span className="rounded-md bg-[#1ed760] px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
                            Novo
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {monthName}
                        {rangeLabel ? ` · ${rangeLabel}` : " · estilos e faixas"}
                      </p>
                    </div>

                    <ChevronRight className="mt-2 h-4 w-4 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-[#1ed760]" />
                  </div>

                  <WeekDayStrip days={days} />
                </Link>

                <CopyPackLinkButton
                  slugSegments={[monthSlug, weekSlug]}
                  className="!h-8 !w-8"
                  label="Copiar link da semana para o Downloader"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
