import { NextResponse } from "next/server";
import { handleAppCorsPreflight, withAppCorsJson } from "../../../../lib/downloader-cors";
import { requireVipMusicAccess } from "../../../../lib/vip-music-access";
import {
  deleteOwnedSong,
  getOwnedSong,
  setSongFavorite,
} from "../../../../lib/music-studio/service";
import { serializeGeneratedSong } from "../../../../lib/music-studio/serialize";

type Ctx = { params: Promise<{ id: string }> };

export async function OPTIONS(request: Request) {
  return handleAppCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request, ctx: Ctx) {
  const access = await requireVipMusicAccess();
  if (!access.ok) {
    return withAppCorsJson(request, { error: access.error }, { status: access.status });
  }

  const { id } = await ctx.params;
  const song = await getOwnedSong(access.user.id, id);
  if (!song) {
    return withAppCorsJson(request, { error: "Música não encontrada." }, { status: 404 });
  }

  return withAppCorsJson(request, { song: serializeGeneratedSong(song) });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const access = await requireVipMusicAccess();
  if (!access.ok) {
    return withAppCorsJson(request, { error: access.error }, { status: access.status });
  }

  const { id } = await ctx.params;
  let body: { favorite?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return withAppCorsJson(request, { error: "Requisição inválida." }, { status: 400 });
  }

  if (typeof body.favorite !== "boolean") {
    return withAppCorsJson(request, { error: "Informe favorite." }, { status: 400 });
  }

  const song = await setSongFavorite(access.user.id, id, body.favorite);
  if (!song) {
    return withAppCorsJson(request, { error: "Música não encontrada." }, { status: 404 });
  }

  return withAppCorsJson(request, { song });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const access = await requireVipMusicAccess();
  if (!access.ok) {
    return withAppCorsJson(request, { error: access.error }, { status: access.status });
  }

  const { id } = await ctx.params;
  const deleted = await deleteOwnedSong(access.user.id, id);
  if (!deleted) {
    return withAppCorsJson(request, { error: "Música não encontrada." }, { status: 404 });
  }

  return withAppCorsJson(request, { ok: true });
}
