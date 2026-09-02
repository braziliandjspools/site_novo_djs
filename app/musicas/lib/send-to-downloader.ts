import { ensureAudioExtension, type PreviewTrack } from "../../lib/google-drive";

export type DownloaderJobPayload = {
  fileId: string;
  fileName: string;
  relativePath?: string;
  provider: "google_drive";
};

export function buildDownloaderJobPayload(
  track: PreviewTrack,
  relativePath?: string,
): DownloaderJobPayload {
  const payload: DownloaderJobPayload = {
    fileId: track.id,
    fileName: ensureAudioExtension(track.fileName ?? track.title),
    provider: "google_drive",
  };

  if (relativePath?.trim()) {
    payload.relativePath = relativePath.trim();
  }

  return payload;
}

async function parseDownloaderResponse(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Não foi possível enviar para o Downloader.");
  }
  return data;
}

export async function sendTrackToDownloader(track: PreviewTrack, relativePath?: string) {
  const response = await fetch("/api/downloader/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(buildDownloaderJobPayload(track, relativePath)),
  });
  return parseDownloaderResponse(response);
}

export async function sendTracksToDownloaderBatch(tracks: PreviewTrack[], relativePath?: string) {
  const response = await fetch("/api/downloader/jobs/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      jobs: tracks.map((track) => buildDownloaderJobPayload(track, relativePath)),
    }),
  });
  return parseDownloaderResponse(response);
}
