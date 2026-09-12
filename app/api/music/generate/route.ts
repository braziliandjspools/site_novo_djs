import { NextResponse } from "next/server";
import { handleAppCorsPreflight, withAppCorsJson } from "../../../lib/downloader-cors";
import { requireVipMusicAccess } from "../../../lib/vip-music-access";
import {
  assertMusicGenerationQuota,
  createGeneratedSong,
} from "../../../lib/music-studio/service";

export const maxDuration = 300;

export async function OPTIONS(request: Request) {
  return handleAppCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function POST(request: Request) {
  const access = await requireVipMusicAccess();
  if (!access.ok) {
    return withAppCorsJson(request, { error: access.error }, { status: access.status });
  }

  let body: {
    title?: string;
    style?: string;
    mood?: string;
    voice?: string;
    language?: string;
    bpm?: number;
    instrumental?: boolean;
    prompt?: string;
    lyrics?: string;
    idempotencyKey?: string;
    songGroupId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return withAppCorsJson(request, { error: "Requisição inválida." }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  if (!title) {
    return withAppCorsJson(request, { error: "Informe um título." }, { status: 400 });
  }

  const quota = await assertMusicGenerationQuota(access.user.id);
  if (!quota.ok) {
    return withAppCorsJson(request, { error: quota.error }, { status: 429 });
  }

  try {
    const result = await createGeneratedSong({
      portalUserId: access.user.id,
      title,
      style: body.style,
      mood: body.mood,
      voice: body.voice,
      language: body.language,
      bpm: typeof body.bpm === "number" ? body.bpm : null,
      instrumental: Boolean(body.instrumental),
      prompt: body.prompt,
      lyrics: body.lyrics,
      idempotencyKey: body.idempotencyKey,
      songGroupId: body.songGroupId,
    });

    const statusCode = result.song.status === "FAILED" ? 502 : 200;
    return withAppCorsJson(
      request,
      {
        song: result.song,
        reused: result.reused,
        error: result.song.status === "FAILED" ? result.song.errorMessage : undefined,
      },
      { status: statusCode },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao gerar música.";
    const status = message.includes("não configurada") ? 503 : 400;
    return withAppCorsJson(request, { error: message }, { status });
  }
}
