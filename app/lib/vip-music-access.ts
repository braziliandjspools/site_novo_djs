import { getAuthenticatedPortalUser } from "./portal";
import type { PortalUser } from "./portal-users";
import { userHasPools } from "./portal-users";

/** Prévia gratuita para não-assinantes (segundos). */
export const VIP_MUSIC_PREVIEW_SECONDS = 60;

/**
 * Limite de bytes do stream em modo preview (~60–90s de MP3 típico).
 * O player também corta em VIP_MUSIC_PREVIEW_SECONDS.
 */
export const VIP_MUSIC_PREVIEW_MAX_BYTES = 3 * 1024 * 1024;

export type VipMusicSession =
  | { authenticated: false; canPlay: false; canDownload: false; canPreview: true }
  | { authenticated: true; user: PortalUser; canPlay: boolean; canDownload: boolean; canPreview: true };

export async function getVipMusicSession(): Promise<VipMusicSession> {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return { authenticated: false, canPlay: false, canDownload: false, canPreview: true };
  }
  const canPlay = userHasPools(user);
  return { authenticated: true, user, canPlay, canDownload: canPlay, canPreview: true };
}

/** Flags de UI/API: todos ouvem (preview ou full); download só VIP. */
export function vipMusicClientAccess(session: VipMusicSession) {
  const canPlayFull = session.canPlay;
  return {
    authenticated: session.authenticated,
    canPlay: true,
    canPlayFull,
    canDownload: session.canDownload,
    canPreview: session.canPreview,
    previewSeconds: canPlayFull ? null : VIP_MUSIC_PREVIEW_SECONDS,
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
  return { ok: true as const, user: access.user };
}

/** Stream: VIP ouve completo; demais recebem preview limitado. */
export async function resolveVipMusicStreamAccess() {
  const session = await getVipMusicSession();
  if (session.canPlay) {
    return {
      ok: true as const,
      mode: "full" as const,
      user: session.authenticated ? session.user : null,
    };
  }
  return {
    ok: true as const,
    mode: "preview" as const,
    user: session.authenticated ? session.user : null,
    maxBytes: VIP_MUSIC_PREVIEW_MAX_BYTES,
    previewSeconds: VIP_MUSIC_PREVIEW_SECONDS,
  };
}
