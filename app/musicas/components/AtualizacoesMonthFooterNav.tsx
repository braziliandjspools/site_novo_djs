"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import {
  displayFolderName,
  folderHref,
  slugifyFolderName,
  sortFoldersByWeek,
} from "../../lib/vip-music-slugs";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";

type NavItem = {
  href: string;
  label: string;
};

type AtualizacoesMonthFooterNavProps = {
  monthSlug: string;
  months: VipMusicFolder[];
  /** Semanas do mês atual (quando estamos dentro de uma semana). */
  weeks?: VipMusicFolder[];
  weekSlug?: string;
};

function navButtonClass(enabled: boolean) {
  return `inline-flex max-w-[min(100%,200px)] min-w-[108px] flex-1 items-center justify-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] transition-colors sm:max-w-[220px] sm:min-w-[140px] sm:text-xs ${
    enabled
      ? "border-zinc-600 bg-zinc-950 text-zinc-200 hover:border-[#00ff9d]/50 hover:text-[#00ff9d]"
      : "cursor-not-allowed border-zinc-800 bg-black text-zinc-600"
  }`;
}

function toMonthItems(months: VipMusicFolder[]) {
  return months.map((folder) => ({
    slug: slugifyFolderName(folder.name),
    label: displayFolderName(folder.name),
  }));
}

function toWeekItems(monthSlug: string, weeks: VipMusicFolder[]) {
  return sortFoldersByWeek(weeks).map((folder) => ({
    slug: slugifyFolderName(folder.name),
    label: displayFolderName(folder.name),
    href: folderHref([monthSlug, slugifyFolderName(folder.name)]),
  }));
}

export function AtualizacoesMonthFooterNav({
  monthSlug,
  months,
  weeks = [],
  weekSlug,
}: AtualizacoesMonthFooterNavProps) {
  const monthItems = toMonthItems(months);
  const currentMonthIndex = monthItems.findIndex((month) => month.slug === monthSlug);
  const previousMonth =
    currentMonthIndex > 0 ? monthItems[currentMonthIndex - 1] : null;
  const nextMonth =
    currentMonthIndex >= 0 && currentMonthIndex < monthItems.length - 1
      ? monthItems[currentMonthIndex + 1]
      : null;

  const weekItems = weekSlug && weeks.length > 0 ? toWeekItems(monthSlug, weeks) : [];
  const currentWeekIndex = weekItems.findIndex((week) => week.slug === weekSlug);

  let previous: NavItem | null = null;
  let next: NavItem | null = null;
  let ariaLabel = "Navegação entre meses";

  if (weekItems.length > 0 && currentWeekIndex >= 0) {
    ariaLabel = "Navegação entre semanas e meses";
    if (currentWeekIndex > 0) {
      previous = {
        href: weekItems[currentWeekIndex - 1].href,
        label: weekItems[currentWeekIndex - 1].label,
      };
    } else if (previousMonth) {
      previous = {
        href: folderHref([previousMonth.slug]),
        label: previousMonth.label,
      };
    }

    if (currentWeekIndex < weekItems.length - 1) {
      next = {
        href: weekItems[currentWeekIndex + 1].href,
        label: weekItems[currentWeekIndex + 1].label,
      };
    } else if (nextMonth) {
      next = {
        href: folderHref([nextMonth.slug]),
        label: nextMonth.label,
      };
    }
  } else {
    if (previousMonth) {
      previous = {
        href: folderHref([previousMonth.slug]),
        label: previousMonth.label,
      };
    }
    if (nextMonth) {
      next = {
        href: folderHref([nextMonth.slug]),
        label: nextMonth.label,
      };
    }
  }

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-zinc-800/90 pt-6 sm:gap-3"
      aria-label={ariaLabel}
    >
      {previous ? (
        <Link href={previous.href} className={navButtonClass(true)}>
          <ChevronLeft className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{previous.label}</span>
        </Link>
      ) : (
        <span className={navButtonClass(false)} aria-disabled="true">
          <ChevronLeft className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">—</span>
        </span>
      )}

      <Link
        href="/musicas/atualizacoes"
        className="inline-flex min-w-[96px] flex-shrink-0 items-center justify-center gap-1.5 border border-[#00ff9d]/40 bg-zinc-950 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#00ff9d] transition-colors hover:border-[#00ff9d] hover:bg-zinc-900 sm:min-w-[108px] sm:text-xs"
        title="Voltar para atualizações"
      >
        <Home className="h-4 w-4 flex-shrink-0" />
        <span>Home</span>
      </Link>

      {next ? (
        <Link href={next.href} className={navButtonClass(true)}>
          <span className="truncate">{next.label}</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </Link>
      ) : (
        <span className={navButtonClass(false)} aria-disabled="true">
          <span className="truncate">—</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </span>
      )}
    </nav>
  );
}
