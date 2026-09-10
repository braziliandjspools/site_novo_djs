"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  displayFolderName,
  folderHref,
  formatDayFolderHeading,
  parseMonthFolderDate,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import { CopyPackLinkButton } from "./CopyPackLinkButton";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { poolPanelClass, poolPanelHeaderClass } from "./atualizacoes-pool-ui";
import { prefetchMusicasJson } from "../lib/musicas-fetch-cache";

type DayFolderGridProps = {
  monthSlug: string;
  monthName: string;
  days: VipMusicCatalogItem[];
  newDayIds?: Set<string>;
};

export function DayFolderGrid({ monthSlug, monthName, days, newDayIds }: DayFolderGridProps) {
  const monthDate = parseMonthFolderDate(monthName);

  if (days.length === 0) {
    return (
      <p className={`${poolPanelClass} px-4 py-8 text-center text-sm text-[color:var(--pool-text-muted)]`}>
        Nenhum dia neste mês. No Drive, use pastas como DIA 01, DIA 10…
      </p>
    );
  }

  return (
    <div className={poolPanelClass}>
      <div className={poolPanelHeaderClass}>
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--pool-text)]">Dias</h2>
        <p className="text-[11px] text-[color:var(--pool-text-muted)]">{monthName}</p>
      </div>
      <ul className="divide-y divide-[color:var(--pool-border)]">
        {days.map((day) => {
          const daySlug = slugifyFolderName(day.name);
          const href = folderHref([monthSlug, daySlug]);
          const isNew = newDayIds?.has(day.id);
          const heading = formatDayFolderHeading(day.name, monthDate);
          return (
            <li key={day.id}>
              <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
                <Link
                  href={href}
                  onMouseEnter={() =>
                    prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(`${monthSlug}/${daySlug}`)}`)
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 text-[color:var(--pool-text)] hover:text-[#009739]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold capitalize">
                      {heading}
                      {isNew ? (
                        <span className="ml-2 rounded-full bg-[#1ed760]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#009739]">
                          Novo
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[color:var(--pool-text-muted)]">
                      {displayFolderName(day.name)} · pools e estilos
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-[color:var(--pool-text-muted)]" />
                </Link>
                <SendPackToDownloaderButton slug={`${monthSlug}/${daySlug}`} compact label="Enviar dia ao Downloader" />
                <CopyPackLinkButton slugSegments={[monthSlug, daySlug]} label="Copiar link do dia" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
