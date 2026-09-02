import { getAudioSourceUrl } from "./google-drive";

const DRIVE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function fetchDriveAudioUpstream(fileId: string, request?: Request) {
  const range = request?.headers.get("Range");
  const headers: HeadersInit = { "User-Agent": DRIVE_USER_AGENT };
  if (range) headers.Range = range;

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
  options?: { inline?: boolean },
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
  return headers;
}
