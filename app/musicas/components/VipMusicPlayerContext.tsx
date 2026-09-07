"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useProtectedPlayer } from "../../hooks/useProtectedPlayer";
import type { PreviewTrack } from "../../lib/google-drive";
import { VIP_MUSIC_PREVIEW_SECONDS } from "../../lib/vip-music-access";

type FolderPlaybackState = {
  tracks: PreviewTrack[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
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
  setFolderPlayback: (folderId: string, state: FolderPlaybackState) => void;
  registerTrackMeta: (track: PreviewTrack) => void;
  toggleTrack: (folderId: string, trackId: string) => Promise<void>;
  playQueue: (folderId: string, trackId: string, tracks: PreviewTrack[]) => Promise<void>;
  pause: () => void;
  seek: (ratio: number) => Promise<void>;
  clearPreviewEnded: () => void;
  isFolderPlaying: (folderId: string) => boolean;
};

const VipMusicPlayerContext = createContext<VipMusicPlayerContextValue | null>(null);

type VipMusicPlayerProviderProps = {
  children: React.ReactNode;
  /** Faixa completa (assinante VIP). Sem isso, só prévia. */
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
  const [previewEnded, setPreviewEnded] = useState(false);
  const playingFolderIdRef = useRef<string | null>(null);
  const playRef = useRef<(trackId: string) => Promise<void>>(async () => {});
  const canPlayFullRef = useRef(canPlayFull);
  canPlayFullRef.current = canPlayFull;
  const previewSecondsRef = useRef(previewSeconds);
  previewSecondsRef.current = previewSeconds;

  const isPreviewMode = !canPlayFull;

  const handleEnded = useCallback(async (endedTrackId: string) => {
    if (!canPlayFullRef.current) {
      setPreviewEnded(true);
      return;
    }

    const folderId = playingFolderIdRef.current;
    if (!folderId) return;

    const folder = foldersRef.current.get(folderId);
    if (!folder) return;

    let tracks = folder.tracks;
    let index = tracks.findIndex((track) => track.id === endedTrackId);

    try {
      if (index >= 0 && index < tracks.length - 1) {
        await playRef.current(tracks[index + 1].id);
        return;
      }

      if (folder.hasMore && index === tracks.length - 1) {
        await folder.loadMore();
        const updated = foldersRef.current.get(folderId);
        if (!updated) return;
        tracks = updated.tracks;
        index = tracks.findIndex((track) => track.id === endedTrackId);
        if (index >= 0 && index < tracks.length - 1) {
          await playRef.current(tracks[index + 1].id);
        }
      }
    } catch {
      /* falha no auto-next — erro já refletido no player */
    }
  }, []);

  const player = useProtectedPlayer({
    getStreamUrl: (id) => `/api/musicas/stream/${id}`,
    onEnded: (trackId) => {
      void handleEnded(trackId);
    },
  });

  playRef.current = async (trackId: string) => {
    setPreviewEnded(false);
    try {
      await player.play(trackId);
    } catch {
      /* erro registrado no state do player */
    }
  };

  const setFolderPlayback = useCallback((folderId: string, state: FolderPlaybackState) => {
    foldersRef.current.set(folderId, state);
    for (const track of state.tracks) {
      trackMetaRef.current.set(track.id, track);
    }
  }, []);

  const registerTrackMeta = useCallback((track: PreviewTrack) => {
    trackMetaRef.current.set(track.id, track);
  }, []);

  const playQueue = useCallback(
    async (folderId: string, trackId: string, tracks: PreviewTrack[]) => {
      for (const track of tracks) {
        trackMetaRef.current.set(track.id, track);
      }
      foldersRef.current.set(folderId, {
        tracks,
        hasMore: false,
        loadMore: async () => {},
      });
      playingFolderIdRef.current = folderId;
      setPlayingFolderId(folderId);
      setCurrentTrack(tracks.find((track) => track.id === trackId) ?? null);
      setPreviewEnded(false);
      try {
        await player.play(trackId);
      } catch {
        /* erro registrado no state do player */
      }
    },
    [player],
  );

  const toggleTrack = useCallback(
    async (folderId: string, trackId: string) => {
      if (player.playingId === trackId && playingFolderIdRef.current === folderId) {
        player.pause();
        return;
      }
      playingFolderIdRef.current = folderId;
      setPlayingFolderId(folderId);
      setCurrentTrack(trackMetaRef.current.get(trackId) ?? null);
      setPreviewEnded(false);
      try {
        await player.play(trackId);
      } catch {
        /* erro registrado no state do player */
      }
    },
    [player],
  );

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

  // Corta a prévia em N segundos no cliente (além do limite de bytes no stream).
  useEffect(() => {
    if (canPlayFull || !player.playingId) return;
    if (player.currentTime < previewSeconds) return;
    player.pause();
    setPreviewEnded(true);
  }, [canPlayFull, player.currentTime, player.playingId, player.pause, previewSeconds]);

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

  const value = useMemo(
    () => ({
      playingFolderId,
      playingId: player.playingId,
      loadingId: player.loadingId,
      currentTime: Math.min(player.currentTime, displayDuration),
      duration: displayDuration,
      progress: displayProgress,
      error: player.error,
      canPlay: true,
      canPlayFull,
      isPreviewMode,
      previewSeconds,
      previewEnded,
      currentTrack,
      isPlaying: player.playingId !== null && player.loadingId === null,
      setFolderPlayback,
      registerTrackMeta,
      toggleTrack,
      playQueue,
      pause: player.pause,
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
      setFolderPlayback,
      registerTrackMeta,
      toggleTrack,
      playQueue,
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
