import { NextResponse } from "next/server";
import { processHotmartWebhook } from "../../../lib/hotmart/process-webhook";
import { isValidHotmartWebhookToken, readHotmartHottok } from "../../../lib/hotmart/verify";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const hottok = readHotmartHottok(request.headers);
  if (!isValidHotmartWebhookToken(hottok)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await processHotmartWebhook(payload);

  if (!result.ok) {
    return NextResponse.json({ error: "Processing failed" }, { status: result.status });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
