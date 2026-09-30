import { NextResponse } from "next/server";
import { listPublishedProductions } from "../../lib/brs-productions";

export async function GET() {
  try {
    const items = await listPublishedProductions(12);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
