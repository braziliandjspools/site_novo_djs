import { NextResponse } from "next/server";
import { handleAppCorsPreflight, withAppCors, withAppCorsJson } from "../../../../../lib/downloader-cors";
import { requireVipMusicAccess } from "../../../../../lib/vip-music-access";
import { getOwnedSong } from "../../../../../lib/music-studio/service";

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

  if (song.status !== "COMPLETED") {
    return withAppCorsJson(request, { error: "Áudio ainda não disponível." }, { status: 409 });
  }

  if (song.audioUrl) {
    return withAppCors(request, NextResponse.redirect(song.audioUrl, 302));
  }

  if (song.audioBase64) {
    const mime = song.audioMimeType || "audio/mpeg";
    const buffer = Buffer.from(song.audioBase64, "base64");
    return withAppCors(
      request,
      new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Content-Length": String(buffer.length),
          "Cache-Control": "private, max-age=3600",
          "Accept-Ranges": "bytes",
        },
      }),
    );
  }

  if (song.audioStorageKey && process.env.R2_PUBLIC_BASE_URL) {
    const url = `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${song.audioStorageKey}`;
    return withAppCors(request, NextResponse.redirect(url, 302));
  }

  return withAppCorsJson(request, { error: "Áudio não encontrado." }, { status: 404 });
}
