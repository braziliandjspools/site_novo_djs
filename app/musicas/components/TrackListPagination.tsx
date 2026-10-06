"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const DESKTOP_WINDOW_SIZE = 10;
const MOBILE_WINDOW_SIZE = 5;

function padPage(page: number) {
  return String(page).padStart(2, "0");
}

function pageWindow(current: number, lastPage: number, windowSize: number) {
  if (lastPage <= windowSize) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  let end = start + windowSize - 1;
  if (end > lastPage) {
    end = lastPage;
    start = Math.max(1, end - windowSize + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function mobilePageWindow(current: number, lastPage: number) {
  if (lastPage <= MOBILE_WINDOW_SIZE) {
    return pageWindow(current, lastPage, MOBILE_WINDOW_SIZE);
  }

  // Janela fixa de 5 páginas no mobile:
  // 01–05, depois 02–06, 03–07, 04–08...
  const start = current <= 4 ? 1 : current - 3;
  return Array.from({ length: MOBILE_WINDOW_SIZE }, (_, index) => start + index);
}

type TrackListPaginationProps = {
  page: number;
  pageCount: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

export function TrackListPagination({
  page,
  pageCount,
  loading = false,
  onPageChange,
}: TrackListPaginationProps) {
  const pages = pageWindow(page, pageCount, DESKTOP_WINDOW_SIZE);
  const mobilePages = mobilePageWindow(page, Math.max(pageCount, page + MOBILE_WINDOW_SIZE - 1));
  const atStart = page <= 1;
  const atEnd = page >= pageCount;

  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label="Paginação das músicas"
      className="flex flex-wrap items-center justify-center gap-1.5 border-t border-white/[0.06] bg-[#111] px-3 py-3 sm:px-4"
    >
      <button
        type="button"
        disabled={atStart || loading}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      <div className="hidden items-center gap-1.5 sm:flex">
        {pages.map((item) => {
          const active = item === page;
          const className =
            "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-bold tabular-nums transition disabled:cursor-wait " +
            (active
              ? "bg-[#60cdff] text-black"
              : "border border-white/10 text-zinc-300 hover:border-[#60cdff]/40 hover:bg-[#60cdff]/10 hover:text-white");
          return (
            <button
              key={item}
              type="button"
              disabled={loading}
              aria-current={active ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={className}
            >
              {padPage(item)}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 sm:hidden">
        {mobilePages.map((item) => {
          const active = item === page;
          const className =
            "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-bold tabular-nums transition disabled:cursor-wait " +
            (active
              ? "bg-[#60cdff] text-black"
              : "border border-white/10 text-zinc-300 hover:border-[#60cdff]/40 hover:bg-[#60cdff]/10 hover:text-white");
          return (
            <button
              key={item}
              type="button"
              disabled={loading}
              aria-current={active ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={className}
            >
              {padPage(item)}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={atEnd || loading}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <span className="hidden sm:inline">Próxima</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
}
