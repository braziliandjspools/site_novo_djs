import { NextResponse } from "next/server";
import { getMostDownloadedTracksCached } from "../../../lib/top-downloads";

export const dynamic = "force-dynamic";

/** Ranking público das mais baixadas (polling em tempo quase real). */
export async function GET() {
  try {
    const tracks = await getMostDownloadedTracksCached(12);
    return NextResponse.json(
      { tracks, updatedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch {
    return NextResponse.json({ tracks: [], updatedAt: new Date().toISOString() });
  }
}
