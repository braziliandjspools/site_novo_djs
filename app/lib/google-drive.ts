import {
  GOOGLE_DRIVE_API_KEY,
  GOOGLE_DRIVE_MUSIC_PRODUCER_DELIVERIES_FOLDER_ID,
  GOOGLE_DRIVE_MUSIC_PRODUCER_FOLDER_ID,
  GOOGLE_DRIVE_PREVIEW_FOLDER_ID,
} from "./site";
import { resolveMusicProducerStory } from "./music-producer-stories";

const AUDIO_MIME_PREFIX = "audio/";
const AUDIO_EXTENSIONS = /\.(mp3|wav|flac|m4a|aac|ogg)$/i;
const FOLDER_MIME = "application/vnd.google-apps.folder";

export type PreviewTrack = {
  id: string;
  title: string;
  artist: string;
  pack: string;
  /** Nome original do arquivo no Google Drive (com extensão). */
  fileName?: string;
  bpm: string | null;
  bpmFrom: number | null;
  bpmTo: number | null;
  version: string | null;
  editType: string | null;
  /** Breve história — usada nas demos /musicproducer */
  story?: string | null;
};

export type PreviewPlaylist = {
  id: string;
  name: string;
  tracks: PreviewTrack[];
};

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
};

type DriveFolder = {
  id: string;
  name: string;
};

const TEXT_EXTENSION = /\.txt$/i;

function fileBaseName(name: string) {
  return decodeHtmlEntities(name.replace(AUDIO_EXTENSIONS, "").replace(TEXT_EXTENSION, "").trim());
}

function parseMusicProducerTrackMeta(fileName: string): Omit<PreviewTrack, "id" | "pack"> {
  const title = fileBaseName(fileName);
  return {
    title,
    artist: "",
    bpm: null,
    bpmFrom: null,
    bpmTo: null,
    version: null,
    editType: null,
    story: null,
  };
}

async function fetchTextFileContent(fileId: string, apiKey: string): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return "";
  return (await res.text()).trim();
}

async function buildStoryMapFromTxtFiles(files: DriveFile[], apiKey: string): Promise<Map<string, string>> {
  const storyMap = new Map<string, string>();
  const txtFiles = files.filter((file) => TEXT_EXTENSION.test(file.name));

  await Promise.all(
    txtFiles.map(async (file) => {
      const content = await fetchTextFileContent(file.id, apiKey);
      if (!content) return;
      storyMap.set(fileBaseName(file.name).toLowerCase(), content);
    }),
  );

  return storyMap;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function sanitizeDriveFilename(name: string) {
  const base = decodeHtmlEntities(name)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .trim();
  return base || "faixa.mp3";
}

export function ensureAudioExtension(filename: string) {
  const clean = sanitizeDriveFilename(filename);
  if (AUDIO_EXTENSIONS.test(clean)) return clean;
  return `${clean}.mp3`;
}

export function contentTypeForFilename(filename: string) {
  const ext = filename.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  switch (ext) {
    case "wav":
      return "audio/wav";
    case "flac":
      return "audio/flac";
    case "m4a":
      return "audio/mp4";
    case "aac":
      return "audio/aac";
    case "ogg":
      return "audio/ogg";
    default:
      return "audio/mpeg";
  }
}

export function contentDispositionAttachment(filename: string) {
  const safe = ensureAudioExtension(filename);
  const asciiFallback =
    safe
      .replace(/["\\]/g, "_")
      .replace(/[^\x20-\x7E]/g, "_")
      .trim() || "faixa.mp3";
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

async function fetchDriveFileName(fileId: string, apiKey: string): Promise<string | null> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name&key=${apiKey}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { name?: string };
  return data.name ? sanitizeDriveFilename(data.name) : null;
}

function isAudioFile(name: string, mimeType: string) {
  if (mimeType.startsWith(AUDIO_MIME_PREFIX)) return true;
  return AUDIO_EXTENSIONS.test(name);
}

export function parseTrackMeta(fileName: string): Omit<PreviewTrack, "id" | "pack"> {
  const base = decodeHtmlEntities(fileName.replace(AUDIO_EXTENSIONS, "").trim());

  let version: string | null = null;
  let bpmFrom: number | null = null;
  let bpmTo: number | null = null;
  let editType: string | null = null;

  let working = base;
  const metaMatch = working.match(/\((Mixshow Edit[^)]*)\)\s*$/i);
  if (metaMatch) {
    const meta = metaMatch[1];
    working = working.slice(0, metaMatch.index).trim();

    const versionMatch = meta.match(/\b(Clean|Dirty)\b/i);
    if (versionMatch) version = versionMatch[1];

    const bpmMatch = meta.match(/(\d{2,3})\s*-\s*(\d{2,3})/);
    if (bpmMatch) {
      bpmFrom = Number.parseInt(bpmMatch[1], 10);
      bpmTo = Number.parseInt(bpmMatch[2], 10);
    }

    editType = meta
      .replace(/\b(Clean|Dirty)\b/gi, "")
      .replace(/\d{2,3}\s*-\s*\d{2,3}/g, "")
      .replace(/\s+/g, " ")
      .trim();
  } else {
    const bpmOnly = working.match(/\(([^)]*(\d{2,3})\s*-\s*(\d{2,3})[^)]*)\)\s*$/);
    if (bpmOnly) {
      bpmFrom = Number.parseInt(bpmOnly[2], 10);
      bpmTo = Number.parseInt(bpmOnly[3], 10);
      const versionMatch = bpmOnly[1].match(/\b(Clean|Dirty)\b/i);
      if (versionMatch) version = versionMatch[1];
      working = working.slice(0, bpmOnly.index).trim();
    }
  }

  const dashIdx = working.indexOf(" - ");
  const artist = dashIdx > 0 ? working.slice(0, dashIdx).trim() : "Unknown Artist";
  const title = dashIdx > 0 ? working.slice(dashIdx + 3).trim() : working;

  const bpm =
    bpmFrom !== null && bpmTo !== null ? `${bpmFrom} → ${bpmTo}` : bpmFrom !== null ? String(bpmFrom) : null;

  return {
    title,
    artist,
    bpm,
    bpmFrom,
    bpmTo,
    version,
    editType,
  };
}

function toPreviewTrack(file: DriveFile, packName: string): PreviewTrack {
  return {
    id: file.id,
    pack: packName,
    ...parseTrackMeta(file.name),
  };
}

async function listChildrenViaApi(folderId: string, apiKey: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType)",
      pageSize: "100",
      orderBy: "folder,name",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`Drive API error: ${res.status}`);

    const data = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

function collectFoldersFromHtml(html: string, parentFolderId?: string) {
  const folders = new Map<string, string>();
  const entryBlocks = html.split('<div class="flip-entry"');

  for (const block of entryBlocks.slice(1)) {
    const isFolder =
      block.includes("/drive/folders/") ||
      block.includes("drive-sprite-folder") ||
      block.includes('application/vnd.google-apps.folder');

    if (!isFolder) continue;

    const folderMatch = block.match(/\/drive\/folders\/([a-zA-Z0-9_-]+)/);
    const entryIdMatch = block.match(/id="entry-([a-zA-Z0-9_-]+)"/);
    const nameMatch = block.match(/flip-entry-title">([^<]+)</);
    if (!nameMatch) continue;

    const id = folderMatch?.[1] ?? entryIdMatch?.[1];
    if (!id || id === parentFolderId) continue;

    folders.set(id, decodeHtmlEntities(nameMatch[1].trim()));
  }

  return [...folders.entries()].map(([id, name]) => ({ id, name }));
}

function collectFilesFromHtml(html: string, files: Map<string, DriveFile>) {
  const entryBlocks = html.split('<div class="flip-entry"');
  for (const block of entryBlocks.slice(1)) {
    if (
      block.includes("/drive/folders/") ||
      block.includes("drive-sprite-folder")
    ) {
      continue;
    }

    const idMatch =
      block.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ?? block.match(/id="entry-([a-zA-Z0-9_-]+)"/);
    const nameMatch = block.match(/flip-entry-title">([^<]+)</);
    if (!idMatch || !nameMatch) continue;

    const id = idMatch[1];
    const name = decodeHtmlEntities(nameMatch[1].trim());
    if (isAudioFile(name, "")) {
      files.set(id, { id, name, mimeType: "audio/mpeg" });
    }
  }

  if (files.size > 0) return;

  const idNameRegex = /\["([a-zA-Z0-9_-]+)"[^\]]*?"([^"]+\.(?:mp3|wav|flac|m4a|aac|ogg))"/gi;
  let idMatch: RegExpExecArray | null;
  while ((idMatch = idNameRegex.exec(html)) !== null) {
    const [, id, name] = idMatch;
    files.set(id, { id, name: decodeHtmlEntities(name), mimeType: "audio/mpeg" });
  }
}

async function fetchPublicFolderHtml(folderId: string) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  const urls = [
    `https://drive.google.com/embeddedfolderview?id=${folderId}#list`,
    `https://drive.google.com/drive/folders/${folderId}`,
  ];

  for (const url of urls) {
    const res = await fetch(url, { headers, next: { revalidate: 300 } });
    if (res.ok) return res.text();
  }

  throw new Error("Não foi possível ler a pasta pública do Google Drive");
}

async function listViaPublicFolder(folderId: string): Promise<DriveFile[]> {
  const html = await fetchPublicFolderHtml(folderId);
  const files = new Map<string, DriveFile>();
  collectFilesFromHtml(html, files);

  if (files.size === 0) {
    throw new Error("Não foi possível ler a pasta pública do Google Drive");
  }

  return [...files.values()];
}

async function listFoldersViaPublicFolder(folderId: string): Promise<DriveFolder[]> {
  const html = await fetchPublicFolderHtml(folderId);
  return collectFoldersFromHtml(html, folderId);
}

function buildPlaylist(folderId: string, folderName: string, files: DriveFile[]): PreviewPlaylist | null {
  const tracks = files
    .filter((file) => isAudioFile(file.name, file.mimeType))
    .map((file) => toPreviewTrack(file, folderName));

  if (!tracks.length) return null;

  return {
    id: folderId,
    name: folderName,
    tracks,
  };
}

function toMusicProducerTrack(
  file: DriveFile,
  folderName: string,
  storyMap: Map<string, string>,
): PreviewTrack {
  const baseName = fileBaseName(file.name);
  const meta = parseMusicProducerTrackMeta(file.name);
  const driveStory = storyMap.get(baseName.toLowerCase()) ?? null;

  return {
    id: file.id,
    pack: folderName,
    ...meta,
    artist: folderName,
    story: resolveMusicProducerStory(folderName, baseName, driveStory),
  };
}

async function buildMusicProducerPlaylist(
  folderId: string,
  folderName: string,
  files: DriveFile[],
  apiKey?: string,
): Promise<PreviewPlaylist | null> {
  const storyMap = apiKey ? await buildStoryMapFromTxtFiles(files, apiKey) : new Map<string, string>();
  const tracks = files
    .filter((file) => isAudioFile(file.name, file.mimeType))
    .map((file) => toMusicProducerTrack(file, folderName, storyMap));

  if (!tracks.length) return null;

  return {
    id: folderId,
    name: folderName,
    tracks,
  };
}

async function listAudioViaPublicFolder(folderId: string): Promise<DriveFile[]> {
  try {
    const html = await fetchPublicFolderHtml(folderId);
    const files = new Map<string, DriveFile>();
    collectFilesFromHtml(html, files);
    return [...files.values()];
  } catch {
    return [];
  }
}

async function listFoldersViaPublicFolderSafe(folderId: string): Promise<DriveFolder[]> {
  try {
    return await listFoldersViaPublicFolder(folderId);
  } catch {
    return [];
  }
}

async function walkMusicProducerFolderPublic(
  folderId: string,
  folderName: string,
): Promise<PreviewPlaylist[]> {
  const [files, subfolders] = await Promise.all([
    listAudioViaPublicFolder(folderId),
    listFoldersViaPublicFolderSafe(folderId),
  ]);

  const playlists: PreviewPlaylist[] = [];

  const playlist = await buildMusicProducerPlaylist(folderId, folderName, files);
  if (playlist) playlists.push(playlist);

  for (const subfolder of subfolders) {
    const nested = await walkMusicProducerFolderPublic(subfolder.id, subfolder.name);
    playlists.push(...nested);
  }

  return playlists;
}

async function walkMusicProducerFolderApi(
  folderId: string,
  folderName: string,
  apiKey: string,
): Promise<PreviewPlaylist[]> {
  const children = await listChildrenViaApi(folderId, apiKey);
  const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);

  const playlists: PreviewPlaylist[] = [];

  const playlist = await buildMusicProducerPlaylist(folderId, folderName, children, apiKey);
  if (playlist) playlists.push(playlist);

  for (const subfolder of subfolders) {
    const nested = await walkMusicProducerFolderApi(subfolder.id, subfolder.name, apiKey);
    playlists.push(...nested);
  }

  return playlists;
}

async function getMusicProducerPlaylistsViaApi(rootFolderId: string, apiKey: string): Promise<PreviewPlaylist[]> {
  const children = await listChildrenViaApi(rootFolderId, apiKey);
  const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const rootAudio = children.filter((item) => isAudioFile(item.name, item.mimeType));
  const playlists: PreviewPlaylist[] = [];

  if (rootAudio.length) {
    const rootPlaylist = await buildMusicProducerPlaylist(rootFolderId, "Demos gerais", children, apiKey);
    if (rootPlaylist) playlists.push(rootPlaylist);
  }

  for (const folder of subfolders) {
    const nested = await walkMusicProducerFolderApi(folder.id, folder.name, apiKey);
    playlists.push(...nested);
  }

  if (!playlists.length) {
    const fallback = await buildMusicProducerPlaylist(rootFolderId, "Demos", children, apiKey);
    if (fallback) playlists.push(fallback);
  }

  return playlists.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

async function getMusicProducerPlaylistsViaPublicFolder(rootFolderId: string): Promise<PreviewPlaylist[]> {
  const [rootFiles, subfolders] = await Promise.all([
    listAudioViaPublicFolder(rootFolderId),
    listFoldersViaPublicFolderSafe(rootFolderId),
  ]);

  const playlists: PreviewPlaylist[] = [];

  if (rootFiles.length) {
    const rootPlaylist = await buildMusicProducerPlaylist(rootFolderId, "Demos gerais", rootFiles);
    if (rootPlaylist) playlists.push(rootPlaylist);
  }

  for (const folder of subfolders) {
    const nested = await walkMusicProducerFolderPublic(folder.id, folder.name);
    playlists.push(...nested);
  }

  if (!playlists.length && rootFiles.length) {
    const fallback = await buildMusicProducerPlaylist(rootFolderId, "Demos", rootFiles);
    if (fallback) playlists.push(fallback);
  }

  return playlists;
}

async function getPlaylistsViaApi(rootFolderId: string, apiKey: string): Promise<PreviewPlaylist[]> {
  const children = await listChildrenViaApi(rootFolderId, apiKey);
  const folders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const rootAudio = children.filter((item) => isAudioFile(item.name, item.mimeType));
  const playlists: PreviewPlaylist[] = [];

  if (rootAudio.length) {
    const rootPlaylist = buildPlaylist(rootFolderId, "Faixas gerais", rootAudio);
    if (rootPlaylist) playlists.push(rootPlaylist);
  }

  for (const folder of folders) {
    const files = await listChildrenViaApi(folder.id, apiKey);
    const playlist = buildPlaylist(folder.id, folder.name, files);
    if (playlist) playlists.push(playlist);
  }

  if (!playlists.length && !folders.length) {
    const fallback = buildPlaylist(rootFolderId, "Preview", children);
    if (fallback) playlists.push(fallback);
  }

  return playlists;
}

async function getPlaylistsViaPublicFolder(rootFolderId: string): Promise<PreviewPlaylist[]> {
  const [rootFiles, subfolders] = await Promise.all([
    listViaPublicFolder(rootFolderId).catch(() => [] as DriveFile[]),
    listFoldersViaPublicFolder(rootFolderId).catch(() => [] as DriveFolder[]),
  ]);

  const playlists: PreviewPlaylist[] = [];

  if (rootFiles.length) {
    const rootPlaylist = buildPlaylist(rootFolderId, "Faixas gerais", rootFiles);
    if (rootPlaylist) playlists.push(rootPlaylist);
  }

  for (const folder of subfolders) {
    const files = await listViaPublicFolder(folder.id).catch(() => [] as DriveFile[]);
    const playlist = buildPlaylist(folder.id, folder.name, files);
    if (playlist) playlists.push(playlist);
  }

  if (!playlists.length) {
    const fallback = buildPlaylist(rootFolderId, "Preview", rootFiles);
    if (fallback) playlists.push(fallback);
  }

  return playlists;
}

export async function getPreviewPlaylists(): Promise<PreviewPlaylist[]> {
  const folderId = GOOGLE_DRIVE_PREVIEW_FOLDER_ID.trim();
  if (!folderId) return [];

  if (GOOGLE_DRIVE_API_KEY) {
    try {
      return await getPlaylistsViaApi(folderId, GOOGLE_DRIVE_API_KEY);
    } catch {
      return getPlaylistsViaPublicFolder(folderId);
    }
  }

  return getPlaylistsViaPublicFolder(folderId);
}

export async function getMusicProducerPlaylists(): Promise<PreviewPlaylist[]> {
  const folderId = GOOGLE_DRIVE_MUSIC_PRODUCER_FOLDER_ID.trim();
  if (!folderId) return [];

  if (GOOGLE_DRIVE_API_KEY) {
    try {
      return await getMusicProducerPlaylistsViaApi(folderId, GOOGLE_DRIVE_API_KEY);
    } catch {
      return getMusicProducerPlaylistsViaPublicFolder(folderId);
    }
  }

  return getMusicProducerPlaylistsViaPublicFolder(folderId);
}

export type MusicProducerDeliveryTrack = {
  id: string;
  fileName: string;
  title: string;
};

export type MusicProducerDeliveryFolder = {
  folderId: string;
  folderName: string;
  tracks: MusicProducerDeliveryTrack[];
};

export function normalizeDriveFolderName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

async function listDeliverySubfolders(rootFolderId: string): Promise<DriveFolder[]> {
  if (GOOGLE_DRIVE_API_KEY) {
    try {
      const children = await listChildrenViaApi(rootFolderId, GOOGLE_DRIVE_API_KEY);
      return children
        .filter((item) => item.mimeType === FOLDER_MIME)
        .map((item) => ({ id: item.id, name: item.name }));
    } catch {
      /* fallback abaixo */
    }
  }

  return listFoldersViaPublicFolderSafe(rootFolderId);
}

async function listDeliveryAudioFiles(folderId: string): Promise<DriveFile[]> {
  if (GOOGLE_DRIVE_API_KEY) {
    try {
      const children = await listChildrenViaApi(folderId, GOOGLE_DRIVE_API_KEY);
      return children.filter((item) => isAudioFile(item.name, item.mimeType));
    } catch {
      /* fallback abaixo */
    }
  }

  return listAudioViaPublicFolder(folderId);
}

export async function findMusicProducerDeliveryFolder(userName: string): Promise<DriveFolder | null> {
  const rootFolderId = GOOGLE_DRIVE_MUSIC_PRODUCER_DELIVERIES_FOLDER_ID.trim();
  if (!rootFolderId) return null;

  const normalizedUser = normalizeDriveFolderName(userName);
  const subfolders = await listDeliverySubfolders(rootFolderId);

  return subfolders.find((folder) => normalizeDriveFolderName(folder.name) === normalizedUser) ?? null;
}

export async function getMusicProducerDeliveriesForUser(
  userName: string,
): Promise<MusicProducerDeliveryFolder | null> {
  const folder = await findMusicProducerDeliveryFolder(userName);
  if (!folder) return null;

  const files = await listDeliveryAudioFiles(folder.id);
  const tracks = files
    .map((file) => ({
      id: file.id,
      fileName: file.name,
      title: fileBaseName(file.name),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

  return {
    folderId: folder.id,
    folderName: folder.name,
    tracks,
  };
}

export async function listMusicProducerDeliveryFolderNames(): Promise<DriveFolder[]> {
  const rootFolderId = GOOGLE_DRIVE_MUSIC_PRODUCER_DELIVERIES_FOLDER_ID.trim();
  if (!rootFolderId) return [];
  return listDeliverySubfolders(rootFolderId);
}

export async function listDriveSubfolders(parentFolderId: string): Promise<DriveFolder[]> {
  return listDeliverySubfolders(parentFolderId);
}

export async function listDriveAudioInFolder(folderId: string): Promise<DriveFile[]> {
  return listDeliveryAudioFiles(folderId);
}

export async function listDriveFolderChildren(folderId: string): Promise<DriveFile[]> {
  if (GOOGLE_DRIVE_API_KEY) {
    try {
      return await listChildrenViaApi(folderId, GOOGLE_DRIVE_API_KEY);
    } catch {
      /* fallback abaixo */
    }
  }

  const folders = await listFoldersViaPublicFolderSafe(folderId);
  const audio = await listAudioViaPublicFolder(folderId).catch(() => [] as DriveFile[]);
  return [
    ...folders.map((folder) => ({ id: folder.id, name: folder.name, mimeType: FOLDER_MIME })),
    ...audio,
  ];
}

/** @deprecated Use getPreviewPlaylists — mantido para compatibilidade */
export async function getPreviewTracks(): Promise<PreviewTrack[]> {
  const playlists = await getPreviewPlaylists();
  return playlists.flatMap((playlist) => playlist.tracks);
}

export function getAudioSourceUrl(fileId: string): string {
  if (GOOGLE_DRIVE_API_KEY) {
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_DRIVE_API_KEY}`;
  }
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
}

export async function getDriveFileName(fileId: string): Promise<string | null> {
  if (!GOOGLE_DRIVE_API_KEY) return null;
  return fetchDriveFileName(fileId, GOOGLE_DRIVE_API_KEY);
}
