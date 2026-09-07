import { timingSafeEqual } from "crypto";
import { getHotmartWebhookSecret } from "./config";

export function readHotmartHottok(headers: Headers) {
  return (
    headers.get("x-hotmart-hottok")?.trim() ||
    headers.get("X-HOTMART-HOTTOK")?.trim() ||
    ""
  );
}

export function isValidHotmartWebhookToken(received: string, secret = getHotmartWebhookSecret()) {
  if (!secret || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
