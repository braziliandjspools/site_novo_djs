"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FolderTree, X } from "lucide-react";
import { AtualizacoesBrowseNavSidebar } from "./AtualizacoesBrowseNavSidebar";
import type { AtualizacoesBrowseNavSidebarProps } from "./AtualizacoesBrowseNavSidebar";

type MusicLibraryBrowseShellProps = AtualizacoesBrowseNavSidebarProps & {
  children: ReactNode;
};

/**
 * Desktop: nav lateral.
 * Mobile: conteúdo full-bleed + sheet “Explorar” (sem sidebar escondida).
 */
export function MusicLibraryBrowseShell({
  children,
  ...navProps
}: MusicLibraryBrowseShellProps) {
  const [open, setOpen] = useState(false);
  const slugKey = navProps.slugSegments.join("/");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [slugKey]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-7.5rem)] lg:self-start lg:overflow-hidden">
        <AtualizacoesBrowseNavSidebar {...navProps} />
      </div>

      <div className="min-w-0">
        <div className="mb-3 flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-[13px] font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15"
          >
            <FolderTree className="h-4 w-4 text-[#1ed760]" aria-hidden />
            Explorar pastas
          </button>
        </div>
        {children}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Explorar pastas">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden rounded-t-3xl border border-white/10 bg-[#0e1110] shadow-[0_-20px_60px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-[15px] font-bold text-white">Explorar</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80"
                aria-label="Fechar navegação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(88dvh-3.5rem)] overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))] [&_aside]:max-h-none [&_aside]:rounded-xl [&_aside]:shadow-none">
              <AtualizacoesBrowseNavSidebar {...navProps} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
