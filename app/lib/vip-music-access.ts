import { getAuthenticatedPortalUser } from "./portal";
import type { PortalUser } from "./portal-users";
import { userHasPools } from "./portal-users";
import {
  VIP_MUSIC_PREVIEW_MAX_BYTES,
  VIP_MUSIC_PREVIEW_SECONDS,
} from "./vip-music-preview";
import {
  assertDownloadsAllowed,
  abuseJsonBody,
  type DownloadAbuseStatus,
} from "./download-abuse";

export { VIP_MUSIC_PREVIEW_MAX_BYTES, VIP_MUSIC_PREVIEW_SECONDS };

export type VipMusicSession =
  | { authenticated: false; canPlay: false; canDownload: false; canPreview: false }
  | { authenticated: true; user: PortalUser; canPlay: boolean; canDownload: boolean; canPreview: false };

export async function getVipMusicSession(): Promise<VipMusicSession> {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return { authenticated: false, canPlay: false, canDownload: false, canPreview: false };
  }
  const canPlay = userHasPools(user);
  return { authenticated: true, user, canPlay, canDownload: canPlay, canPreview: false };
}

/** Flags de UI/API: só VIP ouve; visitantes/sem plano só navegam pastas e listas. */
export function vipMusicClientAccess(session: VipMusicSession) {
  const canPlayFull = session.canPlay;
  return {
    authenticated: session.authenticated,
    canPlay: canPlayFull,
    canPlayFull,
    canDownload: session.canDownload,
    canPreview: false,
    previewSeconds: null as number | null,
  };
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return { ok: false as const, status: 401, error: "Faça login para acessar o acervo." };
  }
  return { ok: true as const, user, canPlay: userHasPools(user) };
}

export async function requireVipMusicAccess() {
  const access = await requireAuthenticatedUser();
  if (!access.ok) return access;
  if (!access.canPlay) {
    return { ok: false as const, status: 403, error: "Plano VIP necessário para ouvir as faixas." };
  }
  const abuse = await assertDownloadsAllowed(access.user.id);
  if (!abuse.ok) {
    return {
      ok: false as const,
      status: 403 as const,
      error: abuse.error,
      code: abuse.code,
      abuse: abuse.abuse,
    };
  }
  return { ok: true as const, user: access.user, abuseWarning: abuse.status };
}

/** Stream: só VIP. Sem plano → 403. Ban de abuso → 403. */
export async function resolveVipMusicStreamAccess() {
  const session = await getVipMusicSession();
  if (session.canPlay && session.authenticated) {
    const abuse = await assertDownloadsAllowed(session.user.id);
    if (!abuse.ok) {
      return {
        ok: false as const,
        status: 403 as const,
        error: abuse.error,
        code: abuse.code,
        abuse: abuse.abuse,
      };
    }
    return {
      ok: true as const,
      mode: "full" as const,
      user: session.user,
      abuseWarning: abuse.status as DownloadAbuseStatus,
    };
  }
  return {
    ok: false as const,
    status: 403 as const,
    error: "Plano VIP necessário para ouvir as faixas.",
  };
}

export { abuseJsonBody };
