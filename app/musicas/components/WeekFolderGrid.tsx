"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  displayFolderName,
  folderHref,
  parseMonthFolderDate,
  parseMonthStatus,
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
} from "../../lib/week-calendar";
import { CopyPackLinkButton } from "./CopyPackLinkButton";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import {
  poolPanelClass,
  poolPanelHeaderClass,
} from "./atualizacoes-pool-ui";
import { prefetchMusicasJson } from "../lib/musicas-fetch-cache";

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

  if (weeks.length === 0) {
    return (
      <p className={`${poolPanelClass} px-4 py-8 text-center text-sm text-zinc-500`}>
        Nenhuma semana neste mês. No Drive, use pastas como SEMANA 01, SEMANA 02…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {monthDate && (
        <div className={`${poolPanelClass} flex flex-wrap items-end justify-between gap-3 px-4 py-3`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ed760]">Calendário</p>
            <p className="mt-1 text-sm font-semibold capitalize text-white">{formatLiveCalendarTitle(now)}</p>
            <p className="mt-0.5 text-xs text-zinc-500">Semana 01 = dias 1–7 · Semana 02 = 8–14…</p>
          </div>
          <p className="rounded border border-[#1ed760]/25 bg-black/40 px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-[#1ed760]">
            {formatLiveClock(now)}
          </p>
        </div>
      )}

      <div className={poolPanelClass}>
        <div className={poolPanelHeaderClass}>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">Semanas</h2>
          <p className="text-[11px] text-zinc-500">{monthName}</p>
        </div>
        <ul className="divide-y divide-white/[0.06]">
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
            const weekStatus = parseMonthStatus(week.name);

            return (
              <li
                key={week.id}
                className={`flex w-full min-w-0 items-center gap-2 px-3 py-3 sm:px-4 ${
                  isCurrent ? "player-track-row-active" : "bg-black/35"
                }`}
              >
                <Link
                  href={href}
                  onMouseEnter={() =>
                    prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(`${monthSlug}/${weekSlug}`)}`)
                  }
                  onFocus={() =>
                    prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(`${monthSlug}/${weekSlug}`)}`)
                  }
                  className="group flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="min-w-0 break-words text-sm font-semibold text-zinc-100 group-hover:text-[#1ed760]">
                      {weekTitle}
                    </span>
                    {weekStatus.status === "em-atualizacao" && (
                      <span className="flex-shrink-0 rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
                        Em atualização
                      </span>
                    )}
                    {isCurrent && weekStatus.status !== "em-atualizacao" && (
                      <span className="flex-shrink-0 rounded bg-[#1ed760] px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
                        Esta semana
                      </span>
                    )}
                    {isNew && !isCurrent && weekStatus.status !== "em-atualizacao" && (
                      <span className="flex-shrink-0 rounded bg-[#1ed760] px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
                        Novo
                      </span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600 group-hover:text-[#1ed760]" />
                  </span>
                  <span className="text-xs text-zinc-500 sm:whitespace-nowrap">{rangeLabel || "—"}</span>
                </Link>
                <div className="flex flex-shrink-0 items-center justify-end gap-1">
                  <SendPackToDownloaderButton
                    slug={`${monthSlug}/${weekSlug}`}
                    compact
                    label="Enviar semana ao Downloader"
                  />
                  <CopyPackLinkButton
                    slugSegments={[monthSlug, weekSlug]}
                    label="Copiar link da semana para o Downloader"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
