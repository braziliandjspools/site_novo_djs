import type { GeneratedSong } from "@prisma/client";

export type PublicGeneratedSong = {
  id: string;
  songGroupId: string;
  versionNumber: number;
  title: string;
  style: string | null;
  mood: string | null;
  voice: string | null;
  language: string | null;
  bpm: number | null;
  instrumental: boolean;
  prompt: string;
  lyrics: string | null;
  status: GeneratedSong["status"];
  errorMessage: string | null;
  model: string;
  audioUrl: string | null;
  audioPath: string | null;
  artworkUrl: string | null;
  durationSeconds: number | null;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export function serializeGeneratedSong(song: GeneratedSong): PublicGeneratedSong {
  const hasAudio =
    song.status === "COMPLETED" &&
    Boolean(song.audioUrl || song.audioStorageKey || song.audioBase64);

  return {
    id: song.id,
    songGroupId: song.songGroupId,
    versionNumber: song.versionNumber,
    title: song.title,
    style: song.style,
    mood: song.mood,
    voice: song.voice,
    language: song.language,
    bpm: song.bpm,
    instrumental: song.instrumental,
    prompt: song.prompt,
    lyrics: song.lyrics,
    status: song.status,
    errorMessage: song.errorMessage,
    model: song.model,
    audioUrl: song.audioUrl,
    audioPath: hasAudio ? `/api/music/songs/${song.id}/audio` : null,
    artworkUrl: song.artworkUrl,
    durationSeconds: song.durationSeconds,
    favorite: song.favorite,
    createdAt: song.createdAt.toISOString(),
    updatedAt: song.updatedAt.toISOString(),
  };
}
