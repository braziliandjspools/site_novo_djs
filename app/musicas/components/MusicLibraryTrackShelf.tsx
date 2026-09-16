"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { HomeTrackItem } from "../../lib/vip-music-home";
import { getTrackDisplayMetadata } from "../../lib/track-display-metadata";
import { MusicLibraryShelf, libraryTileTone } from "./MusicLibraryTiles";

type MusicLibraryTrackShelfProps = {
  title: string;
  tracks: HomeTrackItem[];
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function MusicLibraryTrackShelf({
  title,
  tracks,
  actionHref,
  actionLabel,
  className = "",
}: MusicLibraryTrackShelfProps) {
  if (tracks.length === 0) return null;

  return (
    <MusicLibraryShelf
      title={title}
      actionHref={actionHref}
      actionLabel={actionLabel}
      className={className}
    >
      {tracks.map((track, index) => {
        const display = getTrackDisplayMetadata(track);
        return (
          <Link
            key={`${track.id}-${index}`}
            href={track.href}
            prefetch={false}
            className="group flex w-[240px] flex-shrink-0 flex-col overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/[0.08] hover:ring-white/20 sm:w-[260px]"
          >
            <div
              className={`relative flex h-[120px] items-end bg-gradient-to-br p-3 ${libraryTileTone(index + 4)}`}
            >
              <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white opacity-0 transition group-hover:opacity-100">
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
              </span>
              <p className="line-clamp-2 text-[13px] font-bold leading-snug text-white drop-shadow-sm">
                {display.title}
              </p>
            </div>
            <div className="min-w-0 px-3 py-2.5">
              <p className="truncate text-[12px] font-semibold text-white/70">{display.artist}</p>
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.08em] text-white/40">
                {[track.styleName, track.monthName].filter(Boolean).join(" · ")}
              </p>
            </div>
          </Link>
        );
      })}
    </MusicLibraryShelf>
  );
}
