"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
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
  setFolderPlayback: (folderId: string, state: FolderPlaybackState) => void;
  toggleTrack: (folderId: string, trackId: string) => Promise<void>;
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
  const [playingFolderId, setPlayingFolderId] = useState<string | null>(null);
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
  }, []);

  const toggleTrack = useCallback(
    async (folderId: string, trackId: string) => {
      if (!canPlay) return;
      if (player.playingId === trackId && playingFolderIdRef.current === folderId) {
        player.pause();
        return;
      }
      playingFolderIdRef.current = folderId;
      setPlayingFolderId(folderId);
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
      setFolderPlayback,
      toggleTrack,
      seek: player.seek,
      isFolderPlaying,
    }),
    [
      playingFolderId,
      player.playingId,
      player.loadingId,
      player.currentTime,
      player.duration,
      player.progress,
      player.error,
      player.seek,
      canPlay,
      setFolderPlayback,
      toggleTrack,
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
