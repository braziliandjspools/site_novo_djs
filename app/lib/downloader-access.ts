import { getAuthenticatedPortalUser } from "./portal";
import { isDownloaderPlanExpired } from "./plan-billing";
import { userHasPools } from "./portal-users";
import { assertDownloadsAllowed, abuseJsonBody } from "./download-abuse";

export async function requireDownloaderAccess() {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return { ok: false as const, status: 401, error: "Faça login para acessar o downloader." };
  }
  if (!userHasPools(user)) {
    return { ok: false as const, status: 403, error: "Plano VIP necessário para usar o downloader." };
  }
  if (isDownloaderPlanExpired(user)) {
    return {
      ok: false as const,
      status: 403,
      error: "Seu plano VIP está vencido. Renove no Portal para continuar usando o Downloader.",
    };
  }
  const abuse = await assertDownloadsAllowed(user.id);
  if (!abuse.ok) {
    return {
      ok: false as const,
      status: 403 as const,
      error: abuse.error,
      code: abuse.code,
      abuse: abuse.abuse,
    };
  }
  return { ok: true as const, user, abuseWarning: abuse.status };
}

export { abuseJsonBody };
