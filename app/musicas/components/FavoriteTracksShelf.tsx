"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { FavoriteTrack } from "../lib/music-library-storage";
import { toggleFavoriteTrack } from "../lib/music-library-storage";
import { MusicLibraryShelf, libraryTileTone } from "./MusicLibraryTiles";

/** Prateleira de faixas salvas pelo usuário (favoritos locais). */
export function FavoriteTracksShelf({ tracks }: { tracks: FavoriteTrack[] }) {
  if (tracks.length === 0) return null;

  function handleRemove(event: React.MouseEvent, track: FavoriteTrack) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavoriteTrack(track);
  }

  return (
    <MusicLibraryShelf title="Seus favoritos">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          className="group relative flex w-[240px] flex-shrink-0 flex-col overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/[0.08] hover:ring-white/20 sm:w-[260px]"
        >
          <Link href={track.href} prefetch={false} className="contents">
            <div
              className={`relative flex h-[120px] items-end bg-gradient-to-br p-3 ${libraryTileTone(index + 2)}`}
            >
              <p className="line-clamp-2 text-[13px] font-bold leading-snug text-white drop-shadow-sm">
                {track.title}
              </p>
            </div>
            <div className="min-w-0 px-3 py-2.5">
              <p className="truncate text-[12px] font-semibold text-white/70">{track.artist}</p>
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.08em] text-white/40">
                {[track.styleName, track.monthName].filter(Boolean).join(" · ")}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={(event) => handleRemove(event, track)}
            aria-label="Remover dos favoritos"
            className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-[#1ed760] backdrop-blur-sm transition hover:bg-black/60"
          >
            <Heart className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
          </button>
        </div>
      ))}
    </MusicLibraryShelf>
  );
}
