import { apiFetch } from "./client";

export type DownloadAbuseStatus = {
  banned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  alerted: boolean;
  alertReason: string | null;
  alertedAt: string | null;
  onTestPlan: boolean;
  code: string | null;
  message: string | null;
};

export async function fetchDownloadAbuseStatus(token: string) {
  return apiFetch<{ ok: true; abuse: DownloadAbuseStatus }>("/api/downloader/abuse", {
    method: "GET",
    token,
  });
}

export function isAbuseBanPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const data = payload as { code?: string; abuse?: { banned?: boolean } };
  return data.code === "DOWNLOAD_ABUSE_BANNED" || data.abuse?.banned === true;
}

export function abuseMessageFromPayload(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const data = payload as {
    error?: string;
    abuse?: { message?: string | null };
  };
  return data.abuse?.message || data.error || fallback;
}
