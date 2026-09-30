import { NextResponse } from "next/server";
import { readCatalogImage } from "../../../lib/music-studio/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const key = (await context.params).key.join("/");
  try {
    const image = await readCatalogImage(key);
    return new NextResponse(image.body, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }
}
