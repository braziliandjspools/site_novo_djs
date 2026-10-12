"use client";

import type { ReactNode } from "react";
import type { AtualizacoesBrowseNavSidebarProps } from "./AtualizacoesBrowseNavSidebar";

type MusicLibraryBrowseShellProps = AtualizacoesBrowseNavSidebarProps & {
  children: ReactNode;
  /** Mantido para compatibilidade com as páginas que compõem este shell. */
  hideSidebar?: boolean;
};

/** Área de navegação do catálogo em largura total, sem painel lateral ou drawer. */
export function MusicLibraryBrowseShell({ children }: MusicLibraryBrowseShellProps) {
  return (
    <section className="relative isolate min-w-0 w-full overflow-hidden rounded-[24px] border border-white/[0.07] bg-[linear-gradient(145deg,rgba(19,23,28,0.92),rgba(10,12,15,0.82)_45%,rgba(12,15,18,0.95))] shadow-[0_24px_70px_-42px_rgba(0,0,0,0.9)] sm:rounded-[28px]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/45 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-28 -z-10 h-72 w-72 rounded-full bg-sky-300/[0.035] blur-3xl"
        aria-hidden
      />
      <div className="relative min-w-0 px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
        {children}
      </div>
    </section>
  );
}
