import { NextResponse } from "next/server";
import { buildVipMusicHomeSnapshot } from "../../../lib/vip-music-home";
import { withDownloaderCorsJson } from "../../../lib/downloader-cors";

export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const data = await buildVipMusicHomeSnapshot();
    return withDownloaderCorsJson(request, data);
  } catch (error) {
    console.error("[musicas/home]", error);
    return withDownloaderCorsJson(request, { error: "Não foi possível carregar a home." }, { status: 500 });
  }
}
