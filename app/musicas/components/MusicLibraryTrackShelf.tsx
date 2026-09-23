"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Play } from "lucide-react";
import type { HomeTrackItem } from "../../lib/vip-music-home";
import { getTrackDisplayMetadata } from "../../lib/track-display-metadata";
import {
  isFavoriteTrack,
  subscribeFavoriteTracks,
  toggleFavoriteTrack,
} from "../lib/music-library-storage";
import { MusicLibraryShelf, libraryTileTone } from "./MusicLibraryTiles";

type MusicLibraryTrackShelfProps = {
  title: string;
  tracks: HomeTrackItem[];
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  /** Exibe numeração de chart (estilo Beatport Top 10) no canto da capa. */
  showRank?: boolean;
};

function TrackFavoriteToggle({
  track,
  display,
}: {
  track: HomeTrackItem;
  display: { title: string; artist: string };
}) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(isFavoriteTrack(track.id));
    return subscribeFavoriteTracks(() => setFavorite(isFavoriteTrack(track.id)));
  }, [track.id]);

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavoriteTrack({
      id: track.id,
      title: display.title,
      artist: display.artist,
      href: track.href,
      styleName: track.styleName,
      monthName: track.monthName,
    });
    setFavorite((value) => !value);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={favorite}
      className={`absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition hover:bg-black/60 ${
        favorite ? "text-[#1ed760]" : "text-white/70"
      }`}
    >
      <Heart className="h-3.5 w-3.5" fill={favorite ? "currentColor" : "none"} aria-hidden />
    </button>
  );
}

export function MusicLibraryTrackShelf({
  title,
  tracks,
  actionHref,
  actionLabel,
  className = "",
  showRank = false,
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
          <div
            key={`${track.id}-${index}`}
            className="group relative flex w-[240px] flex-shrink-0 flex-col overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/[0.08] hover:ring-white/20 sm:w-[260px]"
          >
            <Link href={track.href} prefetch={false} className="contents">
              <div
                className={`relative flex h-[120px] items-end bg-gradient-to-br p-3 ${libraryTileTone(index + 4)}`}
              >
                <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white opacity-0 transition group-hover:opacity-100">
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
                </span>
                <p className="line-clamp-2 text-[13px] font-bold leading-snug text-white drop-shadow-sm">
                  {display.title}
                </p>
                {showRank ? (
                  <span className="pointer-events-none absolute bottom-2 right-2.5 font-display text-2xl font-black italic leading-none text-white/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 px-3 py-2.5">
                <p className="truncate text-[12px] font-semibold text-white/70">{display.artist}</p>
                <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.08em] text-white/40">
                  {[track.styleName, track.monthName].filter(Boolean).join(" · ")}
                </p>
              </div>
            </Link>
            <TrackFavoriteToggle track={track} display={display} />
          </div>
        );
      })}
    </MusicLibraryShelf>
  );
}
