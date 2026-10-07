import { NextResponse } from "next/server";
import { readCatalogImage } from "../../../lib/music-studio/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ key: string[] }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { key: parts } = await context.params;
    const key = parts.join("/");
    const image = await readCatalogImage(key);
    return new NextResponse(image.body, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }
}
