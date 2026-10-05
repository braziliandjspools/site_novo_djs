"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const WINDOW_SIZE = 10;

function padPage(page: number) {
  return String(page).padStart(2, "0");
}

function pageWindow(current: number, lastPage: number) {
  if (lastPage <= WINDOW_SIZE) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }
  const half = Math.floor(WINDOW_SIZE / 2);
  let start = Math.max(1, current - half);
  let end = start + WINDOW_SIZE - 1;
  if (end > lastPage) {
    end = lastPage;
    start = Math.max(1, end - WINDOW_SIZE + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
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
  if (pageCount <= 1) return null;

  const pages = pageWindow(page, pageCount);
  const atStart = page <= 1;
  const atEnd = page >= pageCount;

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

      {pages.map((item) => {
        const active = item === page;
        return (
          <button
            key={item}
            type="button"
            disabled={loading}
            aria-current={active ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-bold tabular-nums transition disabled:cursor-wait ${
              active
                ? "bg-[#60cdff] text-black"
                : "border border-white/10 text-zinc-300 hover:border-[#60cdff]/40 hover:bg-[#60cdff]/10 hover:text-white"
            }`}
          >
            {padPage(item)}
          </button>
        );
      })}

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
