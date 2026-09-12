import "server-only";
import { createId } from "./ids";
import { prisma } from "../prisma";
import { generateMusicWithOpenRouter, getOpenRouterMusicModel } from "../openrouter/music";
import { buildMusicPrompt } from "./prompt";
import { storeGeneratedAudio } from "./storage";
import { serializeGeneratedSong, type PublicGeneratedSong } from "./serialize";

export type CreateSongInput = {
  portalUserId: number;
  title: string;
  style?: string | null;
  mood?: string | null;
  voice?: string | null;
  language?: string | null;
  bpm?: number | null;
  instrumental?: boolean;
  prompt?: string | null;
  lyrics?: string | null;
  idempotencyKey?: string | null;
  /** Se informado, cria nova versão no mesmo grupo. */
  songGroupId?: string | null;
};

const MAX_GENERATIONS_PER_HOUR = 8;

export async function assertMusicGenerationQuota(portalUserId: number) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.generatedSong.count({
    where: {
      portalUserId,
      createdAt: { gte: since },
      status: { in: ["QUEUED", "GENERATING", "COMPLETED"] },
    },
  });
  if (count >= MAX_GENERATIONS_PER_HOUR) {
    return {
      ok: false as const,
      error: `Limite de ${MAX_GENERATIONS_PER_HOUR} gerações por hora atingido. Tente mais tarde.`,
    };
  }
  return { ok: true as const };
}

async function processSongGeneration(songId: string) {
  const song = await prisma.generatedSong.findUnique({ where: { id: songId } });
  if (!song) return;

  if (song.status === "COMPLETED" && (song.audioBase64 || song.audioUrl || song.audioStorageKey)) {
    return;
  }

  await prisma.generatedSong.update({
    where: { id: songId },
    data: { status: "GENERATING", errorMessage: null },
  });

  try {
    const modelPrompt =
      song.modelPrompt ||
      buildMusicPrompt({
        title: song.title,
        style: song.style,
        mood: song.mood,
        voice: song.voice,
        language: song.language,
        bpm: song.bpm,
        instrumental: song.instrumental,
        prompt: song.prompt,
        lyrics: song.lyrics,
      });

    const result = await generateMusicWithOpenRouter(modelPrompt);
    const stored = await storeGeneratedAudio({
      portalUserId: song.portalUserId,
      songId: song.id,
      audioBase64: result.audioBase64,
      mimeType: result.mimeType,
    });

    await prisma.generatedSong.update({
      where: { id: songId },
      data: {
        status: "COMPLETED",
        modelPrompt,
        model: result.model,
        generationId: result.generationId,
        lyrics: result.lyrics ?? song.lyrics,
        audioUrl: stored.audioUrl,
        audioStorageKey: stored.audioStorageKey,
        audioBase64: stored.audioBase64,
        audioMimeType: stored.audioMimeType,
        errorMessage: null,
      },
    });

    await prisma.musicGenerationUsage.create({
      data: {
        portalUserId: song.portalUserId,
        songId: song.id,
        model: result.model,
        status: "COMPLETED",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao gerar música.";
    await prisma.generatedSong.update({
      where: { id: songId },
      data: { status: "FAILED", errorMessage: message.slice(0, 500) },
    });
    await prisma.musicGenerationUsage.create({
      data: {
        portalUserId: song.portalUserId,
        songId: song.id,
        model: song.model || getOpenRouterMusicModel(),
        status: "FAILED",
      },
    });
  }
}

export async function createGeneratedSong(input: CreateSongInput): Promise<{
  song: PublicGeneratedSong;
  reused: boolean;
}> {
  const title = input.title.trim();
  if (!title) throw new Error("Informe um título.");

  if (input.idempotencyKey?.trim()) {
    const existing = await prisma.generatedSong.findUnique({
      where: { idempotencyKey: input.idempotencyKey.trim() },
    });
    if (existing) {
      if (existing.portalUserId !== input.portalUserId) {
        throw new Error("Chave de idempotência inválida.");
      }
      if (existing.status === "QUEUED" || existing.status === "GENERATING") {
        await processSongGeneration(existing.id);
      }
      const refreshed = await prisma.generatedSong.findUniqueOrThrow({ where: { id: existing.id } });
      return { song: serializeGeneratedSong(refreshed), reused: true };
    }
  }

  let songGroupId = input.songGroupId?.trim() || createId();
  let versionNumber = 1;

  if (input.songGroupId?.trim()) {
    const parent = await prisma.generatedSong.findFirst({
      where: { songGroupId, portalUserId: input.portalUserId },
      orderBy: { versionNumber: "desc" },
    });
    if (!parent) throw new Error("Música base não encontrada.");
    versionNumber = parent.versionNumber + 1;
    songGroupId = parent.songGroupId;
  }

  const modelPrompt = buildMusicPrompt({
    title,
    style: input.style,
    mood: input.mood,
    voice: input.voice,
    language: input.language,
    bpm: input.bpm,
    instrumental: input.instrumental,
    prompt: input.prompt,
    lyrics: input.lyrics,
  });

  const created = await prisma.generatedSong.create({
    data: {
      portalUserId: input.portalUserId,
      songGroupId,
      versionNumber,
      title,
      style: input.style?.trim() || null,
      mood: input.mood?.trim() || null,
      voice: input.voice?.trim() || null,
      language: input.language?.trim() || "pt-BR",
      bpm: input.bpm ?? null,
      instrumental: Boolean(input.instrumental),
      prompt: input.prompt?.trim() || "",
      lyrics: input.lyrics?.trim() || null,
      modelPrompt,
      status: "QUEUED",
      provider: "openrouter",
      model: getOpenRouterMusicModel(),
      idempotencyKey: input.idempotencyKey?.trim() || null,
    },
  });

  await processSongGeneration(created.id);
  const refreshed = await prisma.generatedSong.findUniqueOrThrow({ where: { id: created.id } });
  return { song: serializeGeneratedSong(refreshed), reused: false };
}

export async function listGeneratedSongs(portalUserId: number, opts?: { favorite?: boolean }) {
  const songs = await prisma.generatedSong.findMany({
    where: {
      portalUserId,
      ...(opts?.favorite ? { favorite: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return songs.map(serializeGeneratedSong);
}

export async function getOwnedSong(portalUserId: number, songId: string) {
  const song = await prisma.generatedSong.findFirst({
    where: { id: songId, portalUserId },
  });
  return song;
}

export async function deleteOwnedSong(portalUserId: number, songId: string) {
  const song = await getOwnedSong(portalUserId, songId);
  if (!song) return false;
  await prisma.generatedSong.delete({ where: { id: song.id } });
  return true;
}

export async function setSongFavorite(portalUserId: number, songId: string, favorite: boolean) {
  const song = await getOwnedSong(portalUserId, songId);
  if (!song) return null;
  const updated = await prisma.generatedSong.update({
    where: { id: song.id },
    data: { favorite },
  });
  return serializeGeneratedSong(updated);
}
