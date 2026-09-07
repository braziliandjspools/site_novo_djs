import { getAudioSourceUrl } from "./google-drive";

const DRIVE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

export async function fetchDriveAudioUpstream(
  fileId: string,
  request?: Request,
  options?: { previewMaxBytes?: number },
) {
  const previewMaxBytes = options?.previewMaxBytes;
  const headers: HeadersInit = { "User-Agent": DRIVE_USER_AGENT };

  if (previewMaxBytes && previewMaxBytes > 0) {
    headers.Range = clampRangeToPreview(request?.headers.get("Range") ?? null, previewMaxBytes);
  } else {
    const range = request?.headers.get("Range");
    if (range) headers.Range = range;
  }

  const upstream = await fetch(getAudioSourceUrl(fileId), {
    redirect: "follow",
    headers,
  });

  if (!upstream.ok || !upstream.body) {
    return { error: "Stream indisponível", status: upstream.status } as const;
  }

  const contentType = upstream.headers.get("Content-Type") ?? "";
  if (
    contentType.includes("text/html") ||
    contentType.includes("application/json") ||
    contentType.includes("text/plain")
  ) {
    return { error: "Arquivo indisponível no Drive", status: 502 } as const;
  }

  return {
    body: upstream.body,
    status: upstream.status,
    contentType: contentType || "application/octet-stream",
    contentLength: upstream.headers.get("Content-Length"),
    contentRange: upstream.headers.get("Content-Range"),
    acceptRanges: upstream.headers.get("Accept-Ranges"),
  } as const;
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
  headers.set(
    "Content-Disposition",
    options?.inline ? "inline" : "inline",
  );
  if (upstream.contentLength) headers.set("Content-Length", upstream.contentLength);
  if (upstream.contentRange) headers.set("Content-Range", upstream.contentRange);
  if (upstream.acceptRanges) headers.set("Accept-Ranges", upstream.acceptRanges);
  else headers.set("Accept-Ranges", "bytes");
  if (options?.previewSeconds) {
    headers.set("X-BP-Preview-Seconds", String(options.previewSeconds));
  }
  return headers;
}
