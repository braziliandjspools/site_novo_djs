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

type CapMediaImage = { src: string; sizes?: string; type?: string };
type CapPlaybackState = "none" | "paused" | "playing";
type CapAction =
  | "play"
  | "pause"
  | "seekbackward"
  | "seekforward"
  | "previoustrack"
  | "nexttrack"
  | "seekto"
  | "stop";

type CapMediaSessionPlugin = {
  setMetadata: (options: {
    title?: string;
    artist?: string;
    album?: string;
    artwork?: CapMediaImage[];
  }) => Promise<void>;
  setPlaybackState: (options: { playbackState: CapPlaybackState }) => Promise<void>;
  setActionHandler: (
    options: { action: CapAction },
    handler: ((details: { action: CapAction; seekTime?: number | null }) => void) | null,
  ) => Promise<void>;
  setPositionState: (options: {
    duration?: number;
    playbackRate?: number;
    position?: number;
  }) => Promise<void>;
};

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

function buildArtwork(coverUrl?: string | null): CapMediaImage[] {
  const src = absoluteUrl((coverUrl?.trim() || PLACEHOLDER.trackCover).trim());
  const lower = src.toLowerCase();
  const type = lower.includes(".png")
    ? "image/png"
    : lower.includes(".webp")
      ? "image/webp"
      : "image/jpeg";

  return ARTWORK_SIZES.map((sizes) => ({ src, sizes, type }));
}

/** Plugin nativo do APK Capacitor — o WebView Android não implementa Media Session Web API. */
function getNativeMediaSession(): CapMediaSessionPlugin | null {
  if (typeof window === "undefined") return null;
  const Cap = (window as unknown as {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: { MediaSession?: CapMediaSessionPlugin };
    };
  }).Capacitor;
  if (!Cap?.isNativePlatform?.()) return null;
  return Cap.Plugins?.MediaSession ?? null;
}

function safeSetWebActionHandler(
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

async function clearSessions(native: CapMediaSessionPlugin | null) {
  if (native) {
    try {
      await native.setPlaybackState({ playbackState: "none" });
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
      "stop",
    ] as CapAction[]) {
      try {
        await native.setActionHandler({ action }, null);
      } catch {
        /* ignore */
      }
    }
    return;
  }

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
    safeSetWebActionHandler(action, null);
  }
}

/**
 * Integra Media Session ao player (notificação / tela de bloqueio).
 * No APK Capacitor usa plugin nativo; no Chrome usa a Web API.
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
    const native = getNativeMediaSession();
    if (!native && !("mediaSession" in navigator)) return;

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    if (!isActive) {
      clearTimerRef.current = setTimeout(() => {
        void clearSessions(native);
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
    const artwork = buildArtwork(coverUrl || activeTrack.coverUrl);

    if (native) {
      void native.setMetadata({
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        artwork,
      });

      const wire = (action: CapAction, fn: (seekTime?: number | null) => void) => {
        void native.setActionHandler({ action }, (details) => {
          fn(details.seekTime);
        });
      };

      wire("play", () => {
        void handlersRef.current.onPlay();
      });
      wire("pause", () => {
        handlersRef.current.onPause();
      });
      wire("previoustrack", () => {
        void handlersRef.current.onPrevious();
      });
      wire("nexttrack", () => {
        void handlersRef.current.onNext();
      });
      wire("seekbackward", () => {
        void handlersRef.current.onSeekBy?.(-10);
      });
      wire("seekforward", () => {
        void handlersRef.current.onSeekBy?.(10);
      });
      wire("seekto", (seekTime) => {
        if (typeof seekTime === "number" && Number.isFinite(seekTime)) {
          void handlersRef.current.onSeek?.(seekTime);
        }
      });
      return;
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        artwork: artwork as MediaImage[],
      });
    } catch {
      /* ignore */
    }

    safeSetWebActionHandler("play", () => {
      void handlersRef.current.onPlay();
    });
    safeSetWebActionHandler("pause", () => {
      handlersRef.current.onPause();
    });
    safeSetWebActionHandler("previoustrack", () => {
      void handlersRef.current.onPrevious();
    });
    safeSetWebActionHandler("nexttrack", () => {
      void handlersRef.current.onNext();
    });
    safeSetWebActionHandler("seekbackward", (details) => {
      const offset = -(details.seekOffset ?? 10);
      void handlersRef.current.onSeekBy?.(offset);
    });
    safeSetWebActionHandler("seekforward", (details) => {
      const offset = details.seekOffset ?? 10;
      void handlersRef.current.onSeekBy?.(offset);
    });
    safeSetWebActionHandler("seekto", (details) => {
      if (typeof details.seekTime === "number" && Number.isFinite(details.seekTime)) {
        void handlersRef.current.onSeek?.(details.seekTime);
      }
    });
  }, [trackId, coverUrl, albumTitle, isActive, input.track]);

  // playbackState — mantém "playing" também durante load da próxima faixa.
  useEffect(() => {
    const native = getNativeMediaSession();
    const state: CapPlaybackState =
      !isActive && !stickyTrackRef.current ? "none" : isPlaying ? "playing" : "paused";

    if (native) {
      void native.setPlaybackState({ playbackState: state }).catch(() => undefined);
      return;
    }

    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state === "none" ? "none" : state;
    } catch {
      /* ignore */
    }
  }, [isActive, isPlaying]);

  // Position state
  const lastPosRef = useRef({ duration: -1, position: -1, playing: false });
  useEffect(() => {
    if (!isActive && !stickyTrackRef.current) return;

    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    if (safeDuration <= 0) return;

    const safePosition = Math.max(0, Math.min(position, safeDuration));
    const prev = lastPosRef.current;
    const movedEnough = Math.abs(prev.position - safePosition) >= 0.9;
    const durationChanged = Math.abs(prev.duration - safeDuration) > 0.05;
    const playChanged = prev.playing !== isPlaying;

    if (!movedEnough && !durationChanged && !playChanged) return;
    lastPosRef.current = { duration: safeDuration, position: safePosition, playing: isPlaying };

    const native = getNativeMediaSession();
    if (native) {
      void native
        .setPositionState({
          duration: safeDuration,
          playbackRate: playbackRate > 0 ? playbackRate : 1,
          position: safePosition,
        })
        .catch(() => undefined);
      return;
    }

    if (!("mediaSession" in navigator)) return;
    if (!(typeof navigator.mediaSession.setPositionState === "function")) return;
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
      void clearSessions(getNativeMediaSession());
    };
  }, []);
}
