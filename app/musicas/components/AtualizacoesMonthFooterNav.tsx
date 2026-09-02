"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { displayFolderName, folderHref, slugifyFolderName } from "../../lib/vip-music-slugs";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";

type AtualizacoesMonthFooterNavProps = {
  monthSlug: string;
  months: VipMusicFolder[];
};

function navButtonClass(enabled: boolean) {
  return `inline-flex max-w-[min(100%,200px)] min-w-[108px] flex-1 items-center justify-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] transition-colors sm:max-w-[220px] sm:min-w-[140px] sm:text-xs ${
    enabled
      ? "border-zinc-600 bg-zinc-950 text-zinc-200 hover:border-[#00ff9d]/50 hover:text-[#00ff9d]"
      : "cursor-not-allowed border-zinc-800 bg-black text-zinc-600"
  }`;
}

export function AtualizacoesMonthFooterNav({ monthSlug, months }: AtualizacoesMonthFooterNavProps) {
  const slugs = months.map((folder) => ({
    slug: slugifyFolderName(folder.name),
    label: displayFolderName(folder.name),
  }));

  const currentIndex = slugs.findIndex((month) => month.slug === monthSlug);
  const previous = currentIndex > 0 ? slugs[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < slugs.length - 1 ? slugs[currentIndex + 1] : null;

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-zinc-800/90 pt-6 sm:gap-3"
      aria-label="Navegação entre meses"
    >
      {previous ? (
        <Link href={folderHref([previous.slug])} className={navButtonClass(true)}>
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
        <Link href={folderHref([next.slug])} className={navButtonClass(true)}>
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
