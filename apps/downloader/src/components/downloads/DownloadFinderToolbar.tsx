import { Search } from "lucide-react";
import type { DownloadFinderCounts, DownloadFinderFilter } from "../../lib/download/job-finder";
import {
  FINDER_COUNT_LABELS,
  FINDER_FILTER_LABELS,
  FINDER_FILTER_ORDER,
} from "../../lib/download/job-finder";

const SEARCH_INPUT_CLASS =
  "w-full rounded-xl border border-white/[0.08] bg-[#121212] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#1db954]/50 focus:ring-1 focus:ring-[#1db954]/25";

type DownloadFinderToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  filter: DownloadFinderFilter;
  onFilterChange: (filter: DownloadFinderFilter) => void;
  counts: DownloadFinderCounts;
};

export function DownloadFinderToolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  counts,
}: DownloadFinderToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar downloads..."
          className={SEARCH_INPUT_CLASS}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FINDER_FILTER_ORDER.map((key) => {
          const active = filter === key;
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange(key)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                active
                  ? "bg-[#1db954]/15 text-[#1db954] ring-1 ring-[#1db954]/35"
                  : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200"
              }`}
              aria-pressed={active}
            >
              <span>{FINDER_FILTER_LABELS[key]}</span>
              <span className={`ml-1.5 tabular-nums ${active ? "text-[#1db954]" : "text-zinc-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
        {(
          [
            "downloading",
            "queued",
            "completed",
            "failed",
            "paused",
          ] as const satisfies Exclude<DownloadFinderFilter, "all">[]
        ).map((key) => (
          <span key={key} className="tabular-nums">
            {FINDER_COUNT_LABELS[key]} {counts[key]}
          </span>
        ))}
      </div>
    </div>
  );
}
