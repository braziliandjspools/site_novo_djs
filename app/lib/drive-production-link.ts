import { parseBuffer } from "music-metadata";
import { parseTrackMeta } from "./google-drive";
import { getAudioSourceUrl } from "./google-drive";
import { GOOGLE_DRIVE_API_KEY } from "./site";
import { getGoogleDriveAccessToken, googleDriveMediaUrl } from "./google-drive-auth";
import { BRS_PRODUCTION_VERSIONS } from "./brs-productions";

const HEAD_BYTES = 1024 * 1024;

export type RecognizedProductionFile = {
  audioFileId: string;
  fileName: string;
  title: string | null;
  artist: string | null;
  duration: string | null;
  bpm: string | null;
  format: string | null;
  bitrate: string | null;
  genre: string | null;
  versionType: string | null;
  versionLabel: string | null;
  coverUrl: string | null;
};

export function extractDriveFileId(value: string): { id: string | null; folder: boolean } {
  const trimmed = value.trim();
  if (!trimmed) return { id: null, folder: false };
  if (/\/folders\/([a-zA-Z0-9_-]+)/.test(trimmed) && !/\/file\/d\//.test(trimmed)) {
    return { id: trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] ?? null, folder: true };
  }
  const fromUrl =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ??
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ??
    trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ??
    null;
  if (fromUrl) return { id: fromUrl, folder: false };
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return { id: trimmed, folder: false };
  return { id: null, folder: false };
}

function clock(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function extensionFormat(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "mp3") return "MP3";
  if (ext === "wav") return "WAV";
  if (ext === "flac") return "FLAC";
  if (ext === "aiff" || ext === "aif") return "AIFF";
  return ext ? ext.toUpperCase() : null;
}

function versionFrom(text: string) {
  const value = text.toLowerCase();
  const found = BRS_PRODUCTION_VERSIONS.find((item) => value.includes(item.toLowerCase()));
  if (found) return found;
  if (value.includes("extended")) return "Extended";
  if (value.includes("mashup")) return "Mashup";
  if (value.includes("bootleg")) return "Bootleg";
  if (value.includes("remix")) return "Remix";
  if (/\bedit\b/.test(value)) return "Edit";
  if (value.includes("original")) return "Original Mix";
  return null;
}

async function driveFileName(fileId: string) {
  const token = await getGoogleDriveAccessToken().catch(() => null);
  const url = token
    ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=name,mimeType&supportsAllDrives=true`
    : GOOGLE_DRIVE_API_KEY
      ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=name,mimeType&supportsAllDrives=true&key=${encodeURIComponent(GOOGLE_DRIVE_API_KEY)}`
      : null;
  if (!url) return null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { name?: string; mimeType?: string };
  if (json.mimeType === "application/vnd.google-apps.folder") {
    return { name: json.name ?? "", folder: true as const };
  }
  return { name: json.name?.trim() || `${fileId}.mp3`, folder: false as const };
}

export async function recognizeProductionDriveLink(link: string): Promise<RecognizedProductionFile> {
  const parsed = extractDriveFileId(link);
  if (parsed.folder) {
    throw new Error("Esse link é da pasta. Cole o link do arquivo de áudio.");
  }
  if (!parsed.id) throw new Error("Não reconheci o link do Google Drive.");

  const info = await driveFileName(parsed.id);
  if (!info) throw new Error("Não consegui ler esse arquivo no Drive.");
  if (info.folder) throw new Error("Esse link é de uma pasta. Cole o link do arquivo.");

  const named = parseTrackMeta(info.name);
  const titleFromName =
    named.artist && named.title.startsWith(`${named.artist} - `)
      ? named.title.slice(named.artist.length + 3).trim()
      : named.title.trim();
  let title = titleFromName || null;
  let artist = named.artist?.trim() || null;
  let bpm = named.bpm?.includes("→") ? named.bpmFrom?.toString() ?? null : named.bpm;
  let duration: string | null = null;
  let format = extensionFormat(info.name);
  let bitrate: string | null = null;
  let genre: string | null = null;
  let coverUrl: string | null = null;

  const token = await getGoogleDriveAccessToken().catch(() => null);
  if (token || GOOGLE_DRIVE_API_KEY) {
    try {
      const media = token ? googleDriveMediaUrl(parsed.id) : getAudioSourceUrl(parsed.id);
      const res = await fetch(media, {
        headers: {
          Range: `bytes=0-${HEAD_BYTES - 1}`,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
      if (res.ok || res.status === 206) {
        const buffer = Buffer.from(await res.arrayBuffer());
        const metadata = await parseBuffer(buffer, undefined, { skipCovers: false, skipPostHeaders: false });
        title = metadata.common.title?.trim() || title;
        artist = metadata.common.artist?.trim() || artist;
        const tagBpm = metadata.common.bpm ? String(Math.round(metadata.common.bpm)) : null;
        bpm = tagBpm || bpm;
        if (metadata.format.duration && Number.isFinite(metadata.format.duration)) {
          duration = clock(metadata.format.duration);
        }
        if (metadata.format.bitrate) bitrate = `${Math.round(metadata.format.bitrate / 1000)} kbps`;
        format = extensionFormat(info.name) || (metadata.format.container || "").toUpperCase() || format;
        genre = metadata.common.genre?.[0]?.trim() || null;
        if (metadata.common.picture?.length) coverUrl = `/api/musicas/tag-cover/${parsed.id}`;
      }
    } catch {
      /* nome do arquivo já preenche o que der */
    }
  }

  const versionType = versionFrom(`${named.editType ?? ""} ${named.version ?? ""} ${info.name}`);
  return {
    audioFileId: parsed.id,
    fileName: info.name,
    title,
    artist,
    duration,
    bpm,
    format,
    bitrate,
    genre,
    versionType,
    versionLabel: named.editType || named.version,
    coverUrl,
  };
}
