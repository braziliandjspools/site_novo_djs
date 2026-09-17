import { getAudioSourceUrl } from "./google-drive";
import {
  getGoogleDriveAccessToken,
  googleDriveMediaUrl,
  hasGoogleDriveOAuth,
} from "./google-drive-auth";
import { GOOGLE_DRIVE_API_KEY } from "./site";

const DRIVE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type DriveAudioUpstreamError = {
  error: string;
  status: number;
  code?: "quota" | "unavailable" | "forbidden";
};

export type DriveAudioUpstreamOk = {
  body: ReadableStream<Uint8Array>;
  status: number;
  contentType: string;
  contentLength: string | null;
  contentRange: string | null;
  acceptRanges: string | null;
};

function clampRangeToPreview(range: string | null, maxBytes: number): string {
  const match = range?.match(/^bytes=(\d+)-(\d*)$/i);
  if (!match) {
    return `bytes=0-${maxBytes - 1}`;
  }

  const start = Number.parseInt(match[1], 10);
  if (!Number.isFinite(start) || start < 0 || start >= maxBytes) {
    return `bytes=0-${maxBytes - 1}`;
  }

  const rawEnd = match[2] ? Number.parseInt(match[2], 10) : maxBytes - 1;
  const end = Number.isFinite(rawEnd) ? Math.min(rawEnd, maxBytes - 1) : maxBytes - 1;
  return `bytes=${start}-${Math.max(start, end)}`;
}

function isAudioContentType(contentType: string): boolean {
  if (!contentType) return true;
  if (
    contentType.includes("text/html") ||
    contentType.includes("application/json") ||
    contentType.includes("text/plain")
  ) {
    return false;
  }
  return true;
}

function isUsableAudioResponse(upstream: Response): boolean {
  if ((!upstream.ok && upstream.status !== 206) || !upstream.body) return false;
  return isAudioContentType(upstream.headers.get("Content-Type") ?? "");
}

async function detectQuotaError(upstream: Response): Promise<boolean> {
  const contentType = upstream.headers.get("Content-Type") ?? "";
  if (upstream.status !== 403 && upstream.status !== 429 && !contentType.includes("json") && !contentType.includes("html")) {
    return false;
  }
  try {
    const text = await upstream.clone().text();
    return /downloadQuotaExceeded|Quota exceeded|Too many users have viewed or downloaded/i.test(
      text,
    );
  } catch {
    return false;
  }
}

function userContentUrl(fileId: string): string {
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
}

async function fetchOnce(url: string, headers: Record<string, string>): Promise<Response> {
  return fetch(url, {
    redirect: "follow",
    headers,
    cache: "no-store",
  });
}

function buildRangeHeaders(
  request: Request | undefined,
  previewMaxBytes?: number,
): Record<string, string> {
  const headers: Record<string, string> = { "User-Agent": DRIVE_USER_AGENT };
  if (previewMaxBytes && previewMaxBytes > 0) {
    headers.Range = clampRangeToPreview(request?.headers.get("Range") ?? null, previewMaxBytes);
  } else {
    const range = request?.headers.get("Range");
    if (range) headers.Range = range;
  }
  return headers;
}

async function tryFetchAudio(
  url: string,
  headers: Record<string, string>,
): Promise<{ response: Response; quota: boolean }> {
  let response = await fetchOnce(url, headers);
  if (!isUsableAudioResponse(response) && headers.Range) {
    const { Range: _omit, ...withoutRange } = headers;
    response = await fetchOnce(url, withoutRange);
  }
  const quota = !isUsableAudioResponse(response) ? await detectQuotaError(response) : false;
  return { response, quota };
}

export async function fetchDriveAudioUpstream(
  fileId: string,
  request?: Request,
  options?: { previewMaxBytes?: number },
): Promise<DriveAudioUpstreamOk | DriveAudioUpstreamError> {
  const baseHeaders = buildRangeHeaders(request, options?.previewMaxBytes);
  let sawQuota = false;

  // 1) OAuth do dono (bypass da cota pública de download)
  if (hasGoogleDriveOAuth()) {
    const token = await getGoogleDriveAccessToken();
    if (token) {
      const { response, quota } = await tryFetchAudio(googleDriveMediaUrl(fileId), {
        ...baseHeaders,
        Authorization: `Bearer ${token}`,
      });
      sawQuota = sawQuota || quota;
      if (isUsableAudioResponse(response)) {
        return {
          body: response.body!,
          status: response.status,
          contentType: response.headers.get("Content-Type") || "application/octet-stream",
          contentLength: response.headers.get("Content-Length"),
          contentRange: response.headers.get("Content-Range"),
          acceptRanges: response.headers.get("Accept-Ranges"),
        };
      }
    }
  }

  // 2) API key (mesma cota pública — falha quando o arquivo estourou downloads)
  if (GOOGLE_DRIVE_API_KEY) {
    const { response, quota } = await tryFetchAudio(getAudioSourceUrl(fileId), baseHeaders);
    sawQuota = sawQuota || quota;
    if (isUsableAudioResponse(response)) {
      return {
        body: response.body!,
        status: response.status,
        contentType: response.headers.get("Content-Type") || "application/octet-stream",
        contentLength: response.headers.get("Content-Length"),
        contentRange: response.headers.get("Content-Range"),
        acceptRanges: response.headers.get("Accept-Ranges"),
      };
    }
  }

  // 3) Link público usercontent (também sofre a mesma cota)
  {
    const { response, quota } = await tryFetchAudio(userContentUrl(fileId), baseHeaders);
    sawQuota = sawQuota || quota;
    if (isUsableAudioResponse(response)) {
      return {
        body: response.body!,
        status: response.status,
        contentType: response.headers.get("Content-Type") || "application/octet-stream",
        contentLength: response.headers.get("Content-Length"),
        contentRange: response.headers.get("Content-Range"),
        acceptRanges: response.headers.get("Accept-Ranges"),
      };
    }
  }

  if (sawQuota) {
    return {
      error: hasGoogleDriveOAuth()
        ? "Cota do Google Drive ainda excedida. Tente de novo mais tarde."
        : "Cota de download do Google Drive excedida neste arquivo. Configure OAuth do dono (GOOGLE_DRIVE_OAUTH_*) ou aguarde até 24h.",
      status: 429,
      code: "quota",
    };
  }

  return {
    error: "Arquivo indisponível no Drive",
    status: 502,
    code: "unavailable",
  };
}

export function driveAudioResponseHeaders(
  upstream: {
    contentType: string;
    contentLength: string | null;
    contentRange: string | null;
    acceptRanges: string | null;
  },
  options?: { inline?: boolean; previewSeconds?: number | null },
) {
  const headers = new Headers();
  headers.set("Content-Type", upstream.contentType);
  headers.set("Cache-Control", "private, no-store, no-cache");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Disposition", "inline");
  if (upstream.contentLength) headers.set("Content-Length", upstream.contentLength);
  if (upstream.contentRange) headers.set("Content-Range", upstream.contentRange);
  if (upstream.acceptRanges) headers.set("Accept-Ranges", upstream.acceptRanges);
  else headers.set("Accept-Ranges", "bytes");
  if (options?.previewSeconds) {
    headers.set("X-BP-Preview-Seconds", String(options.previewSeconds));
  }
  return headers;
}
