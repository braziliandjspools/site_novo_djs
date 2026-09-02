import { cookies } from "next/headers";
import { MAX_BRIEFING_AI_GENERATIONS } from "./music-producer-constants";

export { MAX_BRIEFING_AI_GENERATIONS };
export const BRIEFING_AI_COOKIE = "bp_mp_ai_gens";
export async function getBriefingAiGenerationsUsed() {
  const store = await cookies();
  const raw = store.get(BRIEFING_AI_COOKIE)?.value;
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function briefingAiCookieOptions(maxAge = 60 * 60 * 4) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function assertCanGenerateBriefingIdea() {
  const used = await getBriefingAiGenerationsUsed();
  const remaining = MAX_BRIEFING_AI_GENERATIONS - used;

  if (remaining <= 0) {
    return {
      allowed: false as const,
      used,
      remaining: 0,
    };
  }

  return {
    allowed: true as const,
    used,
    remaining,
  };
}

export function nextBriefingAiGenerationCount(current: number) {
  return Math.min(current + 1, MAX_BRIEFING_AI_GENERATIONS);
}
