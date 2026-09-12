import { NextResponse } from "next/server";
import { handleAppCorsPreflight, withAppCorsJson } from "../../../../../lib/downloader-cors";
import { requireVipMusicAccess } from "../../../../../lib/vip-music-access";
import {
  assertMusicGenerationQuota,
  createGeneratedSong,
  getOwnedSong,
} from "../../../../../lib/music-studio/service";

export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

export async function OPTIONS(request: Request) {
  return handleAppCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

/** Nova versão (V2, V3…) a partir de uma faixa existente. */
export async function POST(request: Request, ctx: Ctx) {
  const access = await requireVipMusicAccess();
  if (!access.ok) {
    return withAppCorsJson(request, { error: access.error }, { status: access.status });
  }

  const { id } = await ctx.params;
  const base = await getOwnedSong(access.user.id, id);
  if (!base) {
    return withAppCorsJson(request, { error: "Música não encontrada." }, { status: 404 });
  }

  let body: { idempotencyKey?: string; prompt?: string } = {};
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      body = (await request.json()) as typeof body;
    }
  } catch {
    body = {};
  }

  const quota = await assertMusicGenerationQuota(access.user.id);
  if (!quota.ok) {
    return withAppCorsJson(request, { error: quota.error }, { status: 429 });
  }

  try {
    const result = await createGeneratedSong({
      portalUserId: access.user.id,
      title: base.title,
      style: base.style,
      mood: base.mood,
      voice: base.voice,
      language: base.language,
      bpm: base.bpm,
      instrumental: base.instrumental,
      prompt: body.prompt?.trim() || base.prompt,
      lyrics: base.lyrics,
      idempotencyKey: body.idempotencyKey,
      songGroupId: base.songGroupId,
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
    const message = err instanceof Error ? err.message : "Erro ao gerar nova versão.";
    return withAppCorsJson(request, { error: message }, { status: 400 });
  }
}
