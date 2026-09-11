"use client";

import { useEffect, useRef } from "react";
import type { PreviewTrack } from "../../lib/google-drive";
import { getTrackDisplayMetadata } from "../../lib/track-display-metadata";
import { PLACEHOLDER } from "../../lib/theme";

export type MediaSessionHandlers = {
  onPlay: () => void | Promise<void>;
  onPause: () => void;
  onNext: () => void | Promise<void>;
  onPrevious: () => void | Promise<void>;
  onSeek?: (positionSeconds: number) => void | Promise<void>;
  onSeekBy?: (offsetSeconds: number) => void | Promise<void>;
};

export type MediaSessionInput = {
  track: PreviewTrack | null;
  /** Capa da pasta/álbum (URL relativa ou absoluta). */
  coverUrl?: string | null;
  /** Álbum/coleção explícito; fallback = track.pack */
  albumTitle?: string | null;
  isPlaying: boolean;
  /** Há faixa carregada (mesmo pausada). */
  isActive: boolean;
  duration: number;
  position: number;
  playbackRate?: number;
  handlers: MediaSessionHandlers;
};

const ARTWORK_SIZES = ["96x96", "128x128", "192x192", "256x256", "384x384", "512x512"] as const;

function absoluteUrl(src: string) {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (typeof window === "undefined") return src;
  const path = src.startsWith("/") ? src : `/${src}`;
  return `${window.location.origin}${path}`;
}

/** Metadados para Media Session (mesma regra de exibição da UI). */
export function resolveTrackMediaMetadata(
  track: PreviewTrack,
  albumTitle?: string | null,
): { title: string; artist: string; album: string } {
  const display = getTrackDisplayMetadata(track);

  const album =
    (albumTitle ?? "").trim() ||
    (track.album ?? "").trim() ||
    (track.pack ?? "").trim() ||
    "Brazilian Remix Service";

  return {
    title: display.title,
    artist: display.artist,
    album,
  };
}

function buildArtwork(coverUrl?: string | null): MediaImage[] {
  const src = absoluteUrl((coverUrl?.trim() || PLACEHOLDER.trackCover).trim());
  const lower = src.toLowerCase();
  const type = lower.includes(".png")
    ? "image/png"
    : lower.includes(".webp")
      ? "image/webp"
      : "image/jpeg";

  return ARTWORK_SIZES.map((sizes) => ({ src, sizes, type }));
}

function safeSetActionHandler(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null,
) {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    /* ação não suportada neste navegador */
  }
}

function clearMediaSession() {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
  } catch {
    /* ignore */
  }
  for (const action of [
    "play",
    "pause",
    "previoustrack",
    "nexttrack",
    "seekbackward",
    "seekforward",
    "seekto",
  ] as MediaSessionAction[]) {
    safeSetActionHandler(action, null);
  }
}

/**
 * Integra Media Session API ao player existente (notificação / tela de bloqueio no Android).
 * Feature detection + try/catch — não quebra FB/IG in-app nem desktop sem suporte.
 */
export function useMediaSession(input: MediaSessionInput) {
  const handlersRef = useRef(input.handlers);
  handlersRef.current = input.handlers;

  /** Mantém última faixa para não dropar a notificação no Android durante o load. */
  const stickyTrackRef = useRef<PreviewTrack | null>(input.track);
  if (input.track) stickyTrackRef.current = input.track;

  const stickyCoverRef = useRef(input.coverUrl ?? null);
  if (input.coverUrl) stickyCoverRef.current = input.coverUrl;

  const stickyAlbumRef = useRef(input.albumTitle ?? null);
  if (input.albumTitle) stickyAlbumRef.current = input.albumTitle;

  const track = input.track ?? stickyTrackRef.current;
  const trackId = track?.id ?? null;
  const coverUrl = input.coverUrl ?? stickyCoverRef.current;
  const albumTitle = input.albumTitle ?? stickyAlbumRef.current;
  const isPlaying = input.isPlaying;
  const isActive = input.isActive;
  const duration = input.duration;
  const position = input.position;
  const playbackRate = input.playbackRate ?? 1;
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Metadados + handlers quando a faixa muda / ativa.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    if (!isActive) {
      // Atrasa limpeza: troca de faixa pode ficar inativa por um instante no load.
      clearTimerRef.current = setTimeout(() => {
        clearMediaSession();
        stickyTrackRef.current = null;
        stickyCoverRef.current = null;
        stickyAlbumRef.current = null;
        clearTimerRef.current = null;
      }, 400);
      return () => {
        if (clearTimerRef.current) {
          clearTimeout(clearTimerRef.current);
          clearTimerRef.current = null;
        }
      };
    }

    const activeTrack = input.track ?? stickyTrackRef.current;
    if (!activeTrack) return;

    const meta = resolveTrackMediaMetadata(activeTrack, albumTitle);
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        artwork: buildArtwork(coverUrl || activeTrack.coverUrl),
      });
    } catch {
      /* ignore */
    }

    safeSetActionHandler("play", () => {
      void handlersRef.current.onPlay();
    });
    safeSetActionHandler("pause", () => {
      handlersRef.current.onPause();
    });
    safeSetActionHandler("previoustrack", () => {
      void handlersRef.current.onPrevious();
    });
    safeSetActionHandler("nexttrack", () => {
      void handlersRef.current.onNext();
    });
    safeSetActionHandler("seekbackward", (details) => {
      const offset = -(details.seekOffset ?? 10);
      void handlersRef.current.onSeekBy?.(offset);
    });
    safeSetActionHandler("seekforward", (details) => {
      const offset = details.seekOffset ?? 10;
      void handlersRef.current.onSeekBy?.(offset);
    });
    safeSetActionHandler("seekto", (details) => {
      if (typeof details.seekTime === "number" && Number.isFinite(details.seekTime)) {
        void handlersRef.current.onSeek?.(details.seekTime);
      }
    });
  }, [trackId, coverUrl, albumTitle, isActive, input.track]);

  // playbackState — mantém "playing" também durante load da próxima faixa.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      if (!isActive && !stickyTrackRef.current) {
        navigator.mediaSession.playbackState = "none";
      } else {
        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      }
    } catch {
      /* ignore */
    }
  }, [isActive, isPlaying]);

  // Position state (throttle ~1s via timeupdate-like deps from parent)
  const lastPosRef = useRef({ duration: -1, position: -1, playing: false });
  useEffect(() => {
    if (!("mediaSession" in navigator) || (!isActive && !stickyTrackRef.current)) return;
    if (!(typeof navigator.mediaSession.setPositionState === "function")) return;

    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    if (safeDuration <= 0) return;

    const safePosition = Math.max(0, Math.min(position, safeDuration));
    const prev = lastPosRef.current;
    const movedEnough = Math.abs(prev.position - safePosition) >= 0.9;
    const durationChanged = Math.abs(prev.duration - safeDuration) > 0.05;
    const playChanged = prev.playing !== isPlaying;

    if (!movedEnough && !durationChanged && !playChanged) return;
    lastPosRef.current = { duration: safeDuration, position: safePosition, playing: isPlaying };

    try {
      navigator.mediaSession.setPositionState({
        duration: safeDuration,
        playbackRate: playbackRate > 0 ? playbackRate : 1,
        position: safePosition,
      });
    } catch {
      /* ignore */
    }
  }, [duration, position, playbackRate, isActive, isPlaying]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearMediaSession();
    };
  }, []);
}
