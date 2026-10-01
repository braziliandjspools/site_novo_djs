import { getGoogleDriveAccessToken, hasGoogleDriveOAuth } from "./google-drive-auth";
import { uploadCatalogImage } from "./music-studio/storage";
import { BRS_PRODUCTION_VERSIONS } from "./brs-productions";

const AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/aiff",
  "audio/x-aiff",
]);

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function productionsFolderId() {
  return process.env.GOOGLE_DRIVE_PRODUCTIONS_FOLDER_ID?.trim() || null;
}

export async function uploadProductionFile(file: File, kind: "audio" | "cover") {
  const token = await getGoogleDriveAccessToken();
  if (!hasGoogleDriveOAuth() || !token) {
    throw new Error("OAuth do Google Drive não está configurado no servidor.");
  }
  const allowed = kind === "audio" ? AUDIO_TYPES : IMAGE_TYPES;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const extOk =
    kind === "audio"
      ? ["mp3", "wav", "flac", "aiff", "aif"].includes(ext)
      : ["jpg", "jpeg", "png", "webp"].includes(ext);
  if (!allowed.has(file.type) && !extOk) {
    throw new Error(kind === "audio" ? "Envie MP3, WAV, FLAC ou AIFF." : "Envie JPG, PNG ou WEBP.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const boundary = `brs_${Date.now()}`;
  const metadata: { name: string; parents?: string[] } = { name: file.name };
  const folder = productionsFolderId();
  if (folder) metadata.parents = [folder];
  const meta = Buffer.from(JSON.stringify(metadata));
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
    meta,
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`),
    bytes,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao enviar para o Drive (${res.status}). ${text.slice(0, 180)}`);
  }
  const json = (await res.json()) as { id?: string; name?: string };
  if (!json.id) throw new Error("O Drive não devolveu o arquivo.");

  let sheet: { duration?: string; bpm?: string; format?: string; bitrate?: string } = {};
  if (kind === "audio") {
    sheet = await readAudioSheet(bytes, file.type);
  }
  return { fileId: json.id, fileName: json.name || file.name, ...sheet };
}

async function readAudioSheet(bytes: Buffer, mime: string) {
  try {
    const { parseBuffer } = await import("music-metadata");
    const meta = await parseBuffer(bytes, mime || undefined);
    const seconds = meta.format.duration;
    const duration =
      seconds && Number.isFinite(seconds)
        ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
        : undefined;
    const bitrate = meta.format.bitrate
      ? `${Math.round(meta.format.bitrate / 1000)} kbps`
      : undefined;
    const format = (meta.format.container || meta.format.codec || "").toUpperCase() || undefined;
    const bpm = meta.common.bpm ? String(Math.round(meta.common.bpm)) : undefined;
    return { duration, bitrate, format, bpm };
  } catch {
    return {};
  }
}


export async function recognizeProductionAudioFile(file: File, audioFileId: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const { parseBuffer } = await import("music-metadata");
    const meta = await parseBuffer(bytes, file.type || undefined, { skipCovers: false, skipPostHeaders: false });
    const seconds = meta.format.duration;
    const duration = seconds && Number.isFinite(seconds)
      ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
      : null;
    const bitrate = meta.format.bitrate ? `${Math.round(meta.format.bitrate / 1000)} kbps` : null;
    const format = (meta.format.container || meta.format.codec || file.name.split(".").pop() || "").toUpperCase();
    const bpm = meta.common.bpm ? String(Math.round(meta.common.bpm)) : null;
    const artist = meta.common.artist?.trim() || null;
    const title = meta.common.title?.trim() || null;
    const genre = meta.common.genre?.[0]?.trim() || null;
    const text = `${meta.common.comment?.join(" ") ?? ""} ${file.name}`.toLowerCase();
    const versionType =
      BRS_PRODUCTION_VERSIONS.find((item) => text.includes(item.toLowerCase())) ??
      (text.includes("extended") ? "Extended" : text.includes("remix") ? "Remix" : text.includes("edit") ? "Edit" : text.includes("mashup") ? "Mashup" : text.includes("bootleg") ? "Bootleg" : "Original Mix");
    let coverFileId: string | null = null;
    let coverUrl: string | null = null;
    const picture = meta.common.picture?.[0];
    if (picture?.data?.length) {
      const coverBytes = new Uint8Array(picture.data);\n      const imageFile = new File([coverBytes.buffer as ArrayBuffer], `cover-${audioFileId}.jpg`, { type: picture.format || "image/jpeg" });
      const uploaded = await uploadCatalogImage(imageFile, "capas");
      coverFileId = uploaded.key;
      coverUrl = uploaded.url;
    }
    return { audioFileId, fileName: file.name, title, artist, duration, bpm, format, bitrate, genre, versionType, versionLabel: versionType, coverFileId, coverUrl };
  } catch {
    return {
      audioFileId,
      fileName: file.name,
      title: null,
      artist: null,
      duration: null,
      bpm: null,
      format: file.name.split(".").pop()?.toUpperCase() || null,
      bitrate: null,
      genre: null,
      versionType: "Original Mix",
      versionLabel: null,
      coverFileId: null,
      coverUrl: null,
    };
  }
}
