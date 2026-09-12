"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Loader2, Pause, Play, Radio } from "lucide-react";
import { useProtectedPlayer } from "../hooks/useProtectedPlayer";
import { getTrackDisplayMetadata } from "../lib/track-display-metadata";
import type { TopDownloadTrack } from "../lib/top-downloads";
import { PLACEHOLDER } from "../lib/theme";

type TopDownloadsTableProps = {
  tracks: TopDownloadTrack[];
};

function formatCount(n: number) {
  return n.toLocaleString("pt-BR");
}

function tracksSignature(tracks: TopDownloadTrack[]) {
  return tracks.map((t) => `${t.id}:${t.downloadCount}`).join("|");
}

export function TopDownloadsTable({ tracks: initialTracks }: TopDownloadsTableProps) {
  const [tracks, setTracks] = useState(initialTracks);
  const [live, setLive] = useState(true);
  const player = useProtectedPlayer({ streamEndpoint: "/api/music/top-downloads/stream" });
  const [coverFailed, setCoverFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setTracks(initialTracks);
  }, [initialTracks]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/music/top-downloads", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { tracks?: TopDownloadTrack[] };
        if (cancelled || !data.tracks) return;
        setTracks((prev) => {
          if (tracksSignature(prev) === tracksSignature(data.tracks!)) return prev;
          return data.tracks!;
        });
        setLive(true);
      } catch {
        if (!cancelled) setLive(false);
      }
    }

    const id = window.setInterval(() => void refresh(), 8_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const active = useMemo(
    () => tracks.find((t) => t.id === player.playingId) ?? null,
    [player.playingId, tracks],
  );
  const activeDisplay = active ? getTrackDisplayMetadata(active) : null;
  const busy = Boolean(player.loadingId);

  if (!tracks.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#141414] px-6 py-14 text-center text-sm text-zinc-500">
        Nenhuma faixa ranqueada ainda. Explore as{" "}
        <Link href="/musicas/atualizacoes" className="font-semibold text-[#1ed760] hover:underline">
          atualizações
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-4 sm:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff4fd8]">Mais baixadas</p>
          <p className="mt-0.5 font-display text-base font-bold text-white sm:text-lg">Ouça o acervo agora</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Sem login · ranking ao vivo conforme os downloads</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-zinc-300">
          <Radio className={`h-3.5 w-3.5 ${live ? "text-[#1ed760]" : "text-zinc-500"}`} />
          {live ? "Ao vivo" : "Reconectando…"}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
              <th className="w-10 px-3 py-2.5 text-center sm:w-12 sm:px-4">#</th>
              <th className="px-2 py-2.5">Faixa</th>
              <th className="hidden px-2 py-2.5 md:table-cell">Pasta</th>
              <th className="w-28 px-3 py-2.5 text-right sm:px-4">
                <span className="inline-flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  Downloads
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, index) => {
              const display = getTrackDisplayMetadata(track);
              const isPlaying = player.playingId === track.id;
              const isLoading = player.loadingId === track.id;
              const isBusy = busy && !isLoading;
              const coverSrc =
                !coverFailed[track.id] && track.coverUrl ? track.coverUrl : PLACEHOLDER.trackCover;

              return (
                <tr
                  key={track.id}
                  className={`group border-b border-white/[0.04] transition-colors last:border-b-0 ${
                    isPlaying ? "bg-[#1ed760]/10" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <td className="px-3 py-2.5 text-center align-middle sm:px-4">
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        index < 3 ? "font-bold text-[#FFDF00]" : "text-zinc-600"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 align-middle">
                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => void player.toggle(track.id)}
                        disabled={isBusy}
                        aria-label={isPlaying ? `Pausar ${display.title}` : `Ouvir ${display.title}`}
                        className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10 transition hover:ring-[#1ed760]/50 disabled:opacity-40 sm:h-14 sm:w-14"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverSrc}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={() => setCoverFailed((prev) => ({ ...prev, [track.id]: true }))}
                        />
                        <span
                          className={`absolute inset-0 flex items-center justify-center transition ${
                            isPlaying ? "bg-[#1ed760]/85" : "bg-black/45 group-hover:bg-black/55"
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          ) : isPlaying ? (
                            <Pause className="h-4 w-4 text-black" fill="currentColor" />
                          ) : (
                            <Play className="ml-0.5 h-4 w-4 text-white" fill="currentColor" />
                          )}
                        </span>
                      </button>
                      <div className="min-w-0">
                        <Link
                          href={track.href}
                          className={`block truncate text-sm font-medium transition hover:underline ${
                            isPlaying ? "text-[#1ed760]" : "text-white"
                          }`}
                        >
                          {display.title}
                        </Link>
                        <p className="truncate text-xs text-zinc-500">{display.artist}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-2 py-2.5 align-middle md:table-cell">
                    <Link
                      href={track.href}
                      className="line-clamp-1 max-w-[240px] text-xs text-zinc-400 transition hover:text-white"
                    >
                      {track.pack}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-right align-middle sm:px-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 font-mono text-xs tabular-nums text-zinc-200">
                      {formatCount(track.downloadCount)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {active && activeDisplay ? (
        <div className="border-t border-white/10 bg-[#121212] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void player.toggle(active.id)}
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1ed760] text-black"
              aria-label="Play/Pause"
            >
              {player.loadingId === active.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pause className="h-4 w-4" fill="currentColor" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{activeDisplay.title}</p>
              <p className="truncate text-xs text-zinc-500">
                {activeDisplay.artist} · {active.pack}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#009739] to-[#1ed760] transition-[width] duration-200"
                  style={{ width: `${player.progress}%` }}
                />
              </div>
            </div>
            {player.error ? (
              <p className="max-w-[40%] text-right text-[11px] text-red-400">{player.error}</p>
            ) : (
              <Link
                href="/musicas/atualizacoes"
                className="hidden text-[11px] font-bold uppercase tracking-[0.12em] text-[#1ed760] hover:underline sm:inline"
              >
                Ver atualizações
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
