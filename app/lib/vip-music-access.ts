import { getAuthenticatedPortalUser } from "./portal";
import type { PortalUser } from "./portal-users";
import { userHasPools } from "./portal-users";

export type VipMusicSession =
  | { authenticated: false; canPlay: false; canDownload: false }
  | { authenticated: true; user: PortalUser; canPlay: boolean; canDownload: boolean };

export async function getVipMusicSession(): Promise<VipMusicSession> {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return { authenticated: false, canPlay: false, canDownload: false };
  }
  const canPlay = userHasPools(user);
  return { authenticated: true, user, canPlay, canDownload: canPlay };
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
