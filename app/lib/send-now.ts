/**
 * Pasta de teste hospedada no send.now.
 * O restante do acervo continua no Google Drive.
 *
 * SEND_NOW_API_KEY — chave da conta (parâmetro `key`)
 * SEND_NOW_FOLDER_ID — `fld_id` numérico; se vazio, usa a pasta
 *   https://send.now/s/A1ML/ATUALIZAÇOES (fld_id 468669)
 * SEND_NOW_FOLDER_NAME — nome opcional no site
 */

const API_BASE = "https://send.now/api";
const DEFAULT_FOLDER_ID = "468669";
const DEFAULT_FOLDER_NAME = "SEND.NOW";
export const SEND_NOW_FILE_PREFIX = "sn-";
export const SEND_NOW_FOLDER_PREFIX = "sendnow-";
export const SEND_NOW_ROOT_STORAGE_ID = "sendnow-root";

const AUDIO_EXTENSIONS = /\.(mp3|wav|flac|m4a|aac|ogg)$/i;

type SendNowFolder = {
  fld_id?: number | string;
  name?: string;
};

type SendNowFile = {
  name?: string;
  file_code?: string;
  uploaded?: string;
  size?: number | string;
};

type FolderListResponse = {
  status?: number;
  msg?: string;
  result?: {
    folders?: SendNowFolder[];
    files?: SendNowFile[];
  };
};

type DirectLinkResponse = {
  status?: number;
  msg?: string;
  result?: { url?: string; size?: number };
};

export function sendNowApiKey() {
  return process.env.SEND_NOW_API_KEY?.trim() || "";
}

export function sendNowFolderId() {
  const configured = process.env.SEND_NOW_FOLDER_ID?.trim() || "";
  return /^\d+$/.test(configured) ? configured : DEFAULT_FOLDER_ID;
}

export function sendNowFolderUrl() {
  return process.env.SEND_NOW_FOLDER_URL?.trim() || "";
}

export function isSendNowConfigured() {
  const explicitFolderId = process.env.SEND_NOW_FOLDER_ID?.trim() || "";
  return Boolean(sendNowApiKey() && (sendNowFolderUrl() || /^\d+$/.test(explicitFolderId)));
}

export function sendNowRootStorageId() {
  return sendNowFolderUrl() ? SEND_NOW_ROOT_STORAGE_ID : sendNowFolderStorageId(sendNowFolderId());
}

export function sendNowFolderStorageId(fldId = sendNowFolderId()) {
  return `${SEND_NOW_FOLDER_PREFIX}${fldId}`;
}

export function isSendNowFolderStorageId(folderId: string) {
  return folderId.startsWith(SEND_NOW_FOLDER_PREFIX);
}

export function sendNowFldIdFromStorageId(folderId: string) {
  return folderId.slice(SEND_NOW_FOLDER_PREFIX.length);
}

async function resolveSendNowFolderId(folderId: string) {
  if (/^\d+$/.test(folderId)) return folderId;

  // SEND_NOW_FOLDER_URL é o link público da pasta (/s/...), não um endpoint
  // JSON da API. Não fazemos fetch dessa página aqui: além de ser HTML, ela
  // pode passar por proteção/redirect e causar o erro "HTML em vez de JSON".
  // Se o ID numérico não estiver explicitamente configurado, usamos o ID
  // padrão da pasta BRS definida nesta integração.
  return sendNowFolderId();
}

export function sendNowFileStorageId(fileCode: string) {
  return `${SEND_NOW_FILE_PREFIX}${fileCode}`;
}

export function isSendNowFileId(fileId: string) {
  return fileId.startsWith(SEND_NOW_FILE_PREFIX) && fileId.length > SEND_NOW_FILE_PREFIX.length;
}

export function sendNowFileCode(fileId: string) {
  return fileId.slice(SEND_NOW_FILE_PREFIX.length);
}

export function sendNowFolderLabel() {
  return process.env.SEND_NOW_FOLDER_NAME?.trim() || DEFAULT_FOLDER_NAME;
}

function apiUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${API_BASE}/${path}`);
  url.searchParams.set("key", sendNowApiKey());
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  return url;
}

async function sendNowGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const response = await fetch(apiUrl(path, params), { cache: "no-store" });
  const json = (await response.json()) as T & { status?: number; msg?: string };
  if (!response.ok || (json.status && json.status !== 200)) {
    throw new Error(json.msg || `send.now HTTP ${response.status}`);
  }
  return json;
}

export async function listSendNowFolder(fldId: string) {
  const resolvedFldId =
    fldId === "root" || fldId === SEND_NOW_ROOT_STORAGE_ID
      ? await resolveSendNowFolderId("root")
      : await resolveSendNowFolderId(fldId);
  const payload = await sendNowGet<FolderListResponse>("folder/list", { fld_id: resolvedFldId });
  const folders = (payload.result?.folders ?? []).filter((folder) => folder.fld_id != null && folder.name);
  const files = (payload.result?.files ?? []).filter(
    (file) => file.file_code && file.name && AUDIO_EXTENSIONS.test(file.name),
  );
  return { folders, files };
}

/** URL direta da CDN, sem a chave da API. */
export async function getSendNowDirectUrl(fileCode: string) {
  const payload = await sendNowGet<DirectLinkResponse>("file/direct_link", { file_code: fileCode });
  const url = payload.result?.url?.trim();
  if (!url) throw new Error("send.now não devolveu o link direto.");
  return url;
}
