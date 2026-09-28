import { getGoogleDriveAccessToken } from "./google-drive-auth";
import { isGmailAccount, verifyVipDriveFile, type DriveMetadata } from "./vip-drive-view-policy";
import { GOOGLE_DRIVE_API_KEY, GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID } from "./site";
import { isDownloaderPlanExpired } from "./plan-billing";
import { requireVipMusicAccess } from "./vip-music-access";

async function getMetadata(fileId: string): Promise<DriveMetadata | null> {
  const token = await getGoogleDriveAccessToken();
  if (!token && !GOOGLE_DRIVE_API_KEY) throw new Error("Drive metadata access unavailable");
  const params = new URLSearchParams({ fields: "id,name,mimeType,parents,trashed", supportsAllDrives: "true" });
  if (!token) params.set("key", GOOGLE_DRIVE_API_KEY);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Drive metadata request failed: ${response.status}`);
  return (await response.json()) as DriveMetadata;
}

/** Verify the file and its ancestry server side; a client supplied ID is never authority. */
export async function getAuthorizedVipDriveTrack(fileId: string) {
  const access = await requireVipMusicAccess();
  if (!access.ok) return { ok: false as const, status: access.status, error: access.error };
  if (isDownloaderPlanExpired(access.user) || !isGmailAccount(access.user.email)) {
    return { ok: false as const, status: 403, error: "Acesso ao Drive exige plano ativo e conta Gmail cadastrada na BRS." };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId) || !GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID) {
    return { ok: false as const, status: 404, error: "Faixa não encontrada." };
  }

  try {
    const name = await verifyVipDriveFile(fileId, GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID, getMetadata);
    if (name) return { ok: true as const, name };
    return { ok: false as const, status: 404, error: "Faixa fora do acervo BRS." };
  } catch (error) {
    console.error("[vip-drive-view] metadata check failed", error);
    return { ok: false as const, status: 503, error: "Não foi possível validar o arquivo agora." };
  }
}
