"use client";

import Link from "next/link";
import { Download, MonitorDown, Pause, Play } from "lucide-react";
import { PLACEHOLDER } from "../../lib/theme";
import { getTrackDisplayMetadata } from "../../lib/track-display-metadata";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
import { useMusicasSession } from "./MusicasSessionContext";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Mantido para reuso eventual; o layout atual não renderiza o player de rodapé. */
export function VipMiniPlayerBar() {
  const { hasVip } = useMusicasSession();
  const player = useVipMusicPlayer();

  if (!player.currentTrack) return null;

  const track = player.currentTrack;
  const isPlaying = player.isPlaying;
  const display = getTrackDisplayMetadata(track);
  const artistLine = [display.artist, track.album?.trim() || track.pack?.trim()].filter(Boolean).join(" · ");
  const coverSrc =
    track.coverUrl?.trim() || player.currentCoverUrl?.trim() || PLACEHOLDER.trackCover;

  return (
    <div className="player-shell fixed bottom-0 left-0 right-0 z-50 rounded-none border-x-0 border-b-0 px-3 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center gap-3 font-[family-name:var(--font-player)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverSrc}
          alt=""
          className="h-11 w-11 flex-shrink-0 rounded-lg object-cover ring-1 ring-white/10"
        />
        <button
          type="button"
          onClick={() => {
            if (isPlaying) player.pause();
            else if (track && player.playingFolderId) {
              void player.toggleTrack(player.playingFolderId, track.id);
            }
          }}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-[0_8px_20px_rgba(30,215,96,0.28)] transition-transform hover:scale-[1.04]"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 pl-0.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-track-title truncate text-white" title={display.title}>
            {display.title}
          </p>
          <p className="text-track-artist truncate" title={artistLine}>
            {artistLine}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div
              className="player-progress-track flex-1 cursor-pointer"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const ratio = (event.clientX - rect.left) / rect.width;
                void player.seek(ratio);
              }}
            >
              <div className="player-progress-fill" style={{ width: `${player.progress}%` }} />
            </div>
            <span className="text-[10px] tabular-nums text-zinc-500">
              {formatTime(player.currentTime)} / {formatTime(player.duration)}
            </span>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          {track && hasVip ? (
            <>
              <Link
                href={`/api/musicas/download/${track.id}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-zinc-300 transition-colors hover:border-[#1ed760]/40 hover:text-white"
                title="Baixar"
              >
                <Download className="h-4 w-4" />
              </Link>
              <span
                className="rounded-xl border border-[#1ed760]/40 bg-[#1ed760]/10 p-2 text-[#1ed760]"
                title="Enviar via lista"
              >
                <MonitorDown className="h-4 w-4" />
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
