import { getAuthenticatedPortalUser } from "./portal";
import { userHasPools } from "./portal-users";

export async function requireDownloaderAccess() {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return { ok: false as const, status: 401, error: "Faça login para acessar o downloader." };
  }
  if (!userHasPools(user)) {
    return { ok: false as const, status: 403, error: "Plano VIP necessário para usar o downloader." };
  }
  return { ok: true as const, user };
}
