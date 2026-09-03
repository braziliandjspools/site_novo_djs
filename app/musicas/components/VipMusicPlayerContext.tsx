"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useProtectedPlayer } from "../../hooks/useProtectedPlayer";
import type { PreviewTrack } from "../../lib/google-drive";

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
  currentTrack: PreviewTrack | null;
  isPlaying: boolean;
  setFolderPlayback: (folderId: string, state: FolderPlaybackState) => void;
  registerTrackMeta: (track: PreviewTrack) => void;
  toggleTrack: (folderId: string, trackId: string) => Promise<void>;
  playQueue: (folderId: string, trackId: string, tracks: PreviewTrack[]) => Promise<void>;
  pause: () => void;
  seek: (ratio: number) => Promise<void>;
  isFolderPlaying: (folderId: string) => boolean;
};

const VipMusicPlayerContext = createContext<VipMusicPlayerContextValue | null>(null);

type VipMusicPlayerProviderProps = {
  children: React.ReactNode;
  canPlay: boolean;
};

export function VipMusicPlayerProvider({
  children,
  canPlay,
}: VipMusicPlayerProviderProps) {
  const foldersRef = useRef<Map<string, FolderPlaybackState>>(new Map());
  const trackMetaRef = useRef<Map<string, PreviewTrack>>(new Map());
  const [playingFolderId, setPlayingFolderId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<PreviewTrack | null>(null);
  const playingFolderIdRef = useRef<string | null>(null);
  const playRef = useRef<(trackId: string) => Promise<void>>(async () => {});

  const handleEnded = useCallback(
    async (endedTrackId: string) => {
      const folderId = playingFolderIdRef.current;
      if (!folderId || !canPlay) return;

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
    },
    [canPlay],
  );

  const player = useProtectedPlayer({
    getStreamUrl: (id) => `/api/musicas/stream/${id}`,
    onEnded: (trackId) => {
      void handleEnded(trackId);
    },
  });

  playRef.current = async (trackId: string) => {
    if (!canPlay) return;
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
      if (!canPlay) return;
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
      try {
        await player.play(trackId);
      } catch {
        /* erro registrado no state do player */
      }
    },
    [canPlay, player],
  );

  const toggleTrack = useCallback(
    async (folderId: string, trackId: string) => {
      if (!canPlay) return;
      if (player.playingId === trackId && playingFolderIdRef.current === folderId) {
        player.pause();
        return;
      }
      playingFolderIdRef.current = folderId;
      setPlayingFolderId(folderId);
      setCurrentTrack(trackMetaRef.current.get(trackId) ?? null);
      try {
        await player.play(trackId);
      } catch {
        /* erro registrado no state do player */
      }
    },
    [canPlay, player],
  );

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

  const value = useMemo(
    () => ({
      playingFolderId,
      playingId: player.playingId,
      loadingId: player.loadingId,
      currentTime: player.currentTime,
      duration: player.duration,
      progress: player.progress,
      error: player.error,
      canPlay,
      currentTrack,
      isPlaying: player.playingId !== null && player.loadingId === null,
      setFolderPlayback,
      registerTrackMeta,
      toggleTrack,
      playQueue,
      pause: player.pause,
      seek: player.seek,
      isFolderPlaying,
    }),
    [
      playingFolderId,
      player.playingId,
      player.loadingId,
      player.duration,
      player.progress,
      player.error,
      player.pause,
      player.seek,
      canPlay,
      currentTrack,
      setFolderPlayback,
      registerTrackMeta,
      toggleTrack,
      playQueue,
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
