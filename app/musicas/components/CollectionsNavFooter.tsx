"use client";

import Link from "next/link";
import { Home } from "lucide-react";

type CollectionsNavFooterProps = {
  href: string;
  label: string;
};

/** Rodapé de navegação Home nas páginas de Coleções. */
export function CollectionsNavFooter({ href, label }: CollectionsNavFooterProps) {
  return (
    <div className="border-t border-white/[0.06] pt-6 pb-2">
      <Link
        href={href}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-700/80 bg-[#181818] px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-[#1ed760]/40 hover:text-[#1ed760] sm:w-auto sm:min-w-[240px]"
      >
        <Home className="h-4 w-4 flex-shrink-0" />
        <span>{label}</span>
      </Link>
    </div>
  );
}
