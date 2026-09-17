/**
 * OAuth do dono do Drive — necessário quando a cota pública
 * (`downloadQuotaExceeded` / "Too many users have downloaded") bloqueia API key e link.
 *
 * Env:
 * - GOOGLE_DRIVE_OAUTH_CLIENT_ID
 * - GOOGLE_DRIVE_OAUTH_CLIENT_SECRET
 * - GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";

type CachedToken = {
  accessToken: string;
  expiresAtMs: number;
};

let cached: CachedToken | null = null;

export function hasGoogleDriveOAuth(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN?.trim(),
  );
}

export async function getGoogleDriveAccessToken(): Promise<string | null> {
  if (!hasGoogleDriveOAuth()) return null;

  const now = Date.now();
  if (cached && cached.expiresAtMs > now + 60_000) {
    return cached.accessToken;
  }

  const clientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID!.trim();
  const clientSecret = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET!.trim();
  const refreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN!.trim();

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[google-drive-oauth] token refresh failed", res.status, text.slice(0, 300));
    cached = null;
    return null;
  }

  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!json.access_token) {
    cached = null;
    return null;
  }

  const expiresInSec = Number.isFinite(json.expires_in) ? Number(json.expires_in) : 3500;
  cached = {
    accessToken: json.access_token,
    expiresAtMs: now + expiresInSec * 1000,
  };
  return cached.accessToken;
}

export function googleDriveMediaUrl(fileId: string): string {
  return `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
}
