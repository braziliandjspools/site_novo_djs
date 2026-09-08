"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useProtectedPlayer } from "../../hooks/useProtectedPlayer";
import type { PreviewTrack } from "../../lib/google-drive";
import { VIP_MUSIC_PREVIEW_SECONDS } from "../../lib/vip-music-preview";

type FolderPlaybackState = {
  tracks: PreviewTrack[];
  hasMore: boolean;
  loadMore: () => Promise<{ tracks: PreviewTrack[]; hasMore: boolean } | null | undefined | void>;
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
  const advancingRef = useRef(false);

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

  playRef.current = async (trackId: string) => {
    setPreviewEnded(false);
    setCurrentTrack(trackMetaRef.current.get(trackId) ?? null);
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

  // Corta a prévia em N segundos e avança automaticamente para a próxima.
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
