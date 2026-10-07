import { SITE_PRODUCTION_URL } from "./branding";

function isLocalHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "::1" ||
    /^127(?:\.\d{1,3}){3}$/.test(host)
  );
}

/** Keeps account links on a public host in production, even if SITE_URL is local. */
export function getPortalSiteBaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const isProduction = env.NODE_ENV === "production";
  const candidates = isProduction
    ? [env.NEXT_PUBLIC_SITE_URL, env.SITE_URL]
    : [env.SITE_URL, env.NEXT_PUBLIC_SITE_URL];

  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;

    try {
      const url = new URL(candidate.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      if (isLocalHostname(url.hostname)) continue;
      if (isProduction && url.protocol !== "https:") continue;
      return url.origin;
    } catch {
      // Ignore malformed environment values and use the next configured URL.
    }
  }

  return SITE_PRODUCTION_URL;
}
