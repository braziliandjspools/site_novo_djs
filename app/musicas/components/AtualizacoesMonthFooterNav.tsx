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
  return `inline-flex min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center justify-center gap-1 border px-2 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] transition-colors sm:basis-auto sm:max-w-[220px] sm:gap-1.5 sm:px-3 sm:text-xs ${
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
      className="mt-8 grid grid-cols-2 gap-2 border-t border-zinc-800/90 pt-6 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3"
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
        className="col-span-2 inline-flex w-full items-center justify-center gap-1.5 border border-[#00ff9d]/40 bg-zinc-950 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#00ff9d] transition-colors hover:border-[#00ff9d] hover:bg-zinc-900 sm:col-span-1 sm:w-auto sm:flex-shrink-0 sm:text-xs"
        title="Voltar para atualizações"
      >
        <Home className="h-4 w-4 flex-shrink-0" />
        <span>Home</span>
      </Link>

      {next ? (
        <Link href={next.href} className={`${navButtonClass(true)} col-start-2 row-start-1 sm:col-auto sm:row-auto`}>
          <span className="truncate">{next.label}</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </Link>
      ) : (
        <span className={`${navButtonClass(false)} col-start-2 row-start-1 sm:col-auto sm:row-auto`} aria-disabled="true">
          <span className="truncate">—</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </span>
      )}
    </nav>
  );
}
