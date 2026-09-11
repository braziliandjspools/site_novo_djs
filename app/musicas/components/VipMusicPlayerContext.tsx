"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useProtectedPlayer } from "../../hooks/useProtectedPlayer";
import type { PreviewTrack } from "../../lib/google-drive";
import { VIP_MUSIC_PREVIEW_SECONDS } from "../../lib/vip-music-preview";
import { useMediaSession } from "../lib/media-session";

type FolderPlaybackState = {
  tracks: PreviewTrack[];
  hasMore: boolean;
  loadMore: () => Promise<{ tracks: PreviewTrack[]; hasMore: boolean } | null | undefined | void>;
  /** Capa da pasta/álbum para Media Session / UI. */
  coverUrl?: string | null;
  /** Título do álbum/coleção exibido na notificação. */
  albumTitle?: string | null;
};

type VipMusicPlayerContextValue = {
  playingFolderId: string | null;
  playingId: string | null;
  loadingId: string | null;
  currentTime: number;
  duration: number;
  progress: number;
  error: string | null;
  canPlay: boolean;
  canPlayFull: boolean;
  isPreviewMode: boolean;
  previewSeconds: number;
  previewEnded: boolean;
  currentTrack: PreviewTrack | null;
  isPlaying: boolean;
  currentCoverUrl: string | null;
  setFolderPlayback: (folderId: string, state: FolderPlaybackState) => void;
  registerTrackMeta: (track: PreviewTrack) => void;
  toggleTrack: (folderId: string, trackId: string) => Promise<void>;
  playQueue: (folderId: string, trackId: string, tracks: PreviewTrack[]) => Promise<void>;
  /** Marca faixa para tocar após a atual (menu Adicionar à fila). */
  queueTrackNext: (folderId: string, trackId: string) => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  pause: () => void;
  /** Para a reprodução e limpa o estado do player (ex.: ao sair da pasta). */
  stop: () => void;
  seek: (ratio: number) => Promise<void>;
  clearPreviewEnded: () => void;
  isFolderPlaying: (folderId: string) => boolean;
};

const VipMusicPlayerContext = createContext<VipMusicPlayerContextValue | null>(null);

type VipMusicPlayerProviderProps = {
  children: React.ReactNode;
  canPlayFull?: boolean;
  previewSeconds?: number;
};

export function VipMusicPlayerProvider({
  children,
  canPlayFull = false,
  previewSeconds = VIP_MUSIC_PREVIEW_SECONDS,
}: VipMusicPlayerProviderProps) {
  const foldersRef = useRef<Map<string, FolderPlaybackState>>(new Map());
  const trackMetaRef = useRef<Map<string, PreviewTrack>>(new Map());
  const [playingFolderId, setPlayingFolderId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<PreviewTrack | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [currentAlbumTitle, setCurrentAlbumTitle] = useState<string | null>(null);
  const [previewEnded, setPreviewEnded] = useState(false);
  const playingFolderIdRef = useRef<string | null>(null);
  const playRef = useRef<(trackId: string) => Promise<void>>(async () => {});
  const canPlayFullRef = useRef(canPlayFull);
  canPlayFullRef.current = canPlayFull;
  const previewSecondsRef = useRef(previewSeconds);
  previewSecondsRef.current = previewSeconds;
  const currentTimeRef = useRef(0);
  /** Próxima faixa forçada pelo menu "Adicionar à fila". */
  const pendingNextIdRef = useRef<string | null>(null);

  /** Prévia de áudio desativada: sem VIP não reproduz. */
  const isPreviewMode = false;
  const advancingRef = useRef(false);

  const syncFolderVisuals = useCallback((folderId: string | null) => {
    if (!folderId) {
      setCurrentCoverUrl(null);
      setCurrentAlbumTitle(null);
      return;
    }
    const folder = foldersRef.current.get(folderId);
    setCurrentCoverUrl(folder?.coverUrl?.trim() || null);
    setCurrentAlbumTitle(folder?.albumTitle?.trim() || null);
  }, []);

  const playNextAfter = useCallback(async (endedTrackId: string) => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    try {
      const folderId = playingFolderIdRef.current;
      if (!folderId) {
        if (!canPlayFullRef.current) setPreviewEnded(true);
        return;
      }

      const folder = foldersRef.current.get(folderId);
      if (!folder) {
        if (!canPlayFullRef.current) setPreviewEnded(true);
        return;
      }

      const pendingId = pendingNextIdRef.current;
      if (pendingId) {
        pendingNextIdRef.current = null;
        const pending = folder.tracks.find((track) => track.id === pendingId);
        if (pending) {
          setPreviewEnded(false);
          setCurrentTrack(pending);
          await playRef.current(pending.id);
          return;
        }
      }

      let tracks = folder.tracks;
      let index = tracks.findIndex((track) => track.id === endedTrackId);

      if (index >= 0 && index < tracks.length - 1) {
        const next = tracks[index + 1];
        setPreviewEnded(false);
        setCurrentTrack(next);
        await playRef.current(next.id);
        return;
      }

      if (folder.hasMore && index === tracks.length - 1) {
        const loaded = await folder.loadMore();
        if (loaded) {
          tracks = loaded.tracks;
          foldersRef.current.set(folderId, {
            ...folder,
            tracks: loaded.tracks,
            hasMore: loaded.hasMore,
          });
        } else {
          const updated = foldersRef.current.get(folderId);
          if (!updated) {
            if (!canPlayFullRef.current) setPreviewEnded(true);
            return;
          }
          tracks = updated.tracks;
        }
        index = tracks.findIndex((track) => track.id === endedTrackId);
        if (index >= 0 && index < tracks.length - 1) {
          const next = tracks[index + 1];
          setPreviewEnded(false);
          setCurrentTrack(next);
          await playRef.current(next.id);
          return;
        }
      }

      if (!canPlayFullRef.current) setPreviewEnded(true);
    } catch {
      if (!canPlayFullRef.current) setPreviewEnded(true);
    } finally {
      advancingRef.current = false;
    }
  }, []);

  const handleEnded = useCallback(
    (endedTrackId: string) => {
      void playNextAfter(endedTrackId);
    },
    [playNextAfter],
  );

  const player = useProtectedPlayer({
    getStreamUrl: (id) => `/api/musicas/stream/${id}`,
    onEnded: (trackId) => {
      void handleEnded(trackId);
    },
  });

  currentTimeRef.current = player.currentTime;

  playRef.current = async (trackId: string) => {
    setPreviewEnded(false);
    setCurrentTrack(trackMetaRef.current.get(trackId) ?? null);
    try {
      await player.play(trackId);
    } catch {
      /* erro registrado no state do player */
    }
  };

  const setFolderPlayback = useCallback(
    (folderId: string, state: FolderPlaybackState) => {
      foldersRef.current.set(folderId, state);
      for (const track of state.tracks) {
        trackMetaRef.current.set(track.id, track);
      }
      if (playingFolderIdRef.current === folderId) {
        syncFolderVisuals(folderId);
      }
    },
    [syncFolderVisuals],
  );

  const registerTrackMeta = useCallback((track: PreviewTrack) => {
    trackMetaRef.current.set(track.id, track);
  }, []);

  const playQueue = useCallback(
    async (folderId: string, trackId: string, tracks: PreviewTrack[]) => {
      if (!canPlayFullRef.current) return;
      for (const track of tracks) {
        trackMetaRef.current.set(track.id, track);
      }
      const existing = foldersRef.current.get(folderId);
      foldersRef.current.set(folderId, {
        tracks,
        hasMore: false,
        loadMore: async () => {},
        coverUrl: existing?.coverUrl,
        albumTitle: existing?.albumTitle,
      });
      playingFolderIdRef.current = folderId;
      setPlayingFolderId(folderId);
      syncFolderVisuals(folderId);
      setCurrentTrack(tracks.find((track) => track.id === trackId) ?? null);
      setPreviewEnded(false);
      try {
        await player.play(trackId);
      } catch {
        /* erro registrado no state do player */
      }
    },
    [player, syncFolderVisuals],
  );

  const toggleTrack = useCallback(
    async (folderId: string, trackId: string) => {
      if (!canPlayFullRef.current) return;
      if (player.playingId === trackId && playingFolderIdRef.current === folderId) {
        player.pause();
        return;
      }
      playingFolderIdRef.current = folderId;
      setPlayingFolderId(folderId);
      syncFolderVisuals(folderId);
      setCurrentTrack(trackMetaRef.current.get(trackId) ?? null);
      setPreviewEnded(false);
      try {
        await player.play(trackId);
      } catch {
        /* erro registrado no state do player */
      }
    },
    [player, syncFolderVisuals],
  );

  const queueTrackNext = useCallback((folderId: string, trackId: string) => {
    if (!canPlayFullRef.current) return;
    if (playingFolderIdRef.current !== folderId || !player.playingId) {
      void toggleTrack(folderId, trackId);
      return;
    }
    pendingNextIdRef.current = trackId;
  }, [player.playingId, toggleTrack]);

  const playNext = useCallback(async () => {
    const id = player.playingId ?? currentTrack?.id;
    if (!id) return;
    await playNextAfter(id);
  }, [player.playingId, currentTrack?.id, playNextAfter]);

  const playPrevious = useCallback(async () => {
    const folderId = playingFolderIdRef.current;
    if (!folderId) return;
    const folder = foldersRef.current.get(folderId);
    if (!folder) return;

    const activeId = player.playingId ?? currentTrack?.id;
    if (!activeId) return;

    if (currentTimeRef.current > 3) {
      await player.seek(0);
      if (!player.playingId) {
        try {
          await player.play(activeId);
        } catch {
          /* ignore */
        }
      }
      return;
    }

    const index = folder.tracks.findIndex((track) => track.id === activeId);
    if (index <= 0) {
      await player.seek(0);
      if (!player.playingId) {
        try {
          await player.play(activeId);
        } catch {
          /* ignore */
        }
      }
      return;
    }

    const prev = folder.tracks[index - 1];
    if (!prev) return;
    setPreviewEnded(false);
    setCurrentTrack(prev);
    try {
      await player.play(prev.id);
    } catch {
      /* ignore */
    }
  }, [player, currentTrack?.id]);

  const seek = useCallback(
    async (ratio: number) => {
      const rawDuration = player.duration;
      const limit = previewSecondsRef.current;

      if (!canPlayFullRef.current) {
        const effectiveDuration =
          Number.isFinite(rawDuration) && rawDuration > 0 ? Math.min(rawDuration, limit) : limit;
        const targetTime = Math.max(0, Math.min(1, ratio)) * effectiveDuration;
        const fullDuration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : limit;
        await player.seek(Math.min(1, targetTime / fullDuration));
        return;
      }

      await player.seek(ratio);
    },
    [player],
  );

  const seekToSeconds = useCallback(
    async (seconds: number) => {
      const rawDuration = player.duration;
      if (!Number.isFinite(rawDuration) || rawDuration <= 0) return;
      const clamped = Math.max(0, Math.min(seconds, rawDuration));
      await player.seek(clamped / rawDuration);
    },
    [player],
  );

  const seekBySeconds = useCallback(
    async (offset: number) => {
      await seekToSeconds(currentTimeRef.current + offset);
    },
    [seekToSeconds],
  );

  useEffect(() => {
    if (canPlayFull || !player.playingId) return;
    if (player.currentTime < previewSeconds) return;
    const endedId = player.playingId;
    player.pause();
    void playNextAfter(endedId);
  }, [canPlayFull, player.currentTime, player.playingId, player.pause, previewSeconds, playNextAfter]);

  const isFolderPlaying = useCallback(
    (folderId: string) =>
      playingFolderId === folderId && (player.playingId !== null || player.loadingId !== null),
    [playingFolderId, player.playingId, player.loadingId],
  );

  useEffect(() => {
    if (player.playingId) {
      setCurrentTrack(trackMetaRef.current.get(player.playingId) ?? null);
    }
  }, [player.playingId]);

  const displayDuration = useMemo(() => {
    if (!isPreviewMode) return player.duration;
    if (Number.isFinite(player.duration) && player.duration > 0) {
      return Math.min(player.duration, previewSeconds);
    }
    return previewSeconds;
  }, [isPreviewMode, player.duration, previewSeconds]);

  const displayProgress = useMemo(() => {
    if (displayDuration <= 0) return 0;
    return Math.min(100, (Math.min(player.currentTime, displayDuration) / displayDuration) * 100);
  }, [displayDuration, player.currentTime]);

  const clearPreviewEnded = useCallback(() => setPreviewEnded(false), []);

  const stop = useCallback(() => {
    player.pause();
    playingFolderIdRef.current = null;
    setPlayingFolderId(null);
    setCurrentTrack(null);
    syncFolderVisuals(null);
    setPreviewEnded(false);
  }, [player.pause, syncFolderVisuals]);

  const isPlaying = player.playingId !== null && player.loadingId === null;
  // Notificação Android: permanece "playing"/ativa enquanto a próxima faixa carrega.
  const mediaSessionPlaying =
    Boolean(currentTrack) &&
    (player.loadingId !== null || player.playingId !== null);
  const mediaActive =
    Boolean(currentTrack) || Boolean(player.loadingId) || Boolean(player.playingId);

  useMediaSession({
    track: currentTrack,
    coverUrl: currentTrack?.coverUrl?.trim() || currentCoverUrl,
    albumTitle: currentAlbumTitle || currentTrack?.album || currentTrack?.pack || null,
    isPlaying: mediaSessionPlaying,
    isActive: mediaActive,
    duration: displayDuration,
    position: Math.min(player.currentTime, displayDuration),
    handlers: {
      onPlay: async () => {
        if (!canPlayFullRef.current) return;
        const id = currentTrack?.id;
        if (!id) return;
        try {
          await player.play(id);
        } catch {
          /* ignore */
        }
      },
      onPause: () => {
        player.pause();
      },
      onNext: () => playNext(),
      onPrevious: () => playPrevious(),
      onSeek: (seconds) => seekToSeconds(seconds),
      onSeekBy: (offset) => seekBySeconds(offset),
    },
  });

  const value = useMemo(
    () => ({
      playingFolderId,
      playingId: player.playingId,
      loadingId: player.loadingId,
      currentTime: Math.min(player.currentTime, displayDuration),
      duration: displayDuration,
      progress: displayProgress,
      error: player.error,
      canPlay: canPlayFull,
      canPlayFull,
      isPreviewMode,
      previewSeconds,
      previewEnded,
      currentTrack,
      isPlaying,
      currentCoverUrl,
      setFolderPlayback,
      registerTrackMeta,
      toggleTrack,
      playQueue,
      queueTrackNext,
      playNext,
      playPrevious,
      pause: player.pause,
      stop,
      seek,
      clearPreviewEnded,
      isFolderPlaying,
    }),
    [
      playingFolderId,
      player.playingId,
      player.loadingId,
      player.currentTime,
      player.error,
      player.pause,
      displayDuration,
      displayProgress,
      canPlayFull,
      isPreviewMode,
      previewSeconds,
      previewEnded,
      currentTrack,
      isPlaying,
      currentCoverUrl,
      setFolderPlayback,
      registerTrackMeta,
      toggleTrack,
      playQueue,
      queueTrackNext,
      playNext,
      playPrevious,
      stop,
      seek,
      clearPreviewEnded,
      isFolderPlaying,
    ],
  );

  return <VipMusicPlayerContext.Provider value={value}>{children}</VipMusicPlayerContext.Provider>;
}

export function useVipMusicPlayer() {
  const ctx = useContext(VipMusicPlayerContext);
  if (!ctx) throw new Error("useVipMusicPlayer must be used within VipMusicPlayerProvider");
  return ctx;
}
