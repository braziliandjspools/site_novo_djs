export type PortalView =
  | "dashboard"
  | "services"
  | "service-pools"
  | "service-deemix"
  | "service-allavsoft"
  | "service-music-producer"
  | "account"
  | "support";

export const PORTAL_BASE = "/portal";

/** Slug público na URL ↔ view interna do portal. */
const VIEW_TO_SLUG: Record<PortalView, string> = {
  dashboard: "",
  services: "servicos",
  "service-pools": "pools",
  "service-deemix": "deemix",
  "service-allavsoft": "allavsoft",
  "service-music-producer": "producoes",
  account: "conta",
  support: "suporte",
};

const SLUG_ALIASES: Record<string, PortalView> = {
  "": "dashboard",
  painel: "dashboard",
  dashboard: "dashboard",
  servicos: "services",
  services: "services",
  pools: "service-pools",
  "pools-vip": "service-pools",
  "service-pools": "service-pools",
  deemix: "service-deemix",
  "service-deemix": "service-deemix",
  allavsoft: "service-allavsoft",
  "service-allavsoft": "service-allavsoft",
  producoes: "service-music-producer",
  "music-producer": "service-music-producer",
  "service-music-producer": "service-music-producer",
  conta: "account",
  account: "account",
  suporte: "support",
  support: "support",
};

const ALL_VIEWS = Object.keys(VIEW_TO_SLUG) as PortalView[];

export function isPortalView(value: string): value is PortalView {
  return ALL_VIEWS.includes(value as PortalView);
}

export function portalPath(view: PortalView): string {
  const slug = VIEW_TO_SLUG[view];
  return slug ? `${PORTAL_BASE}/${slug}` : PORTAL_BASE;
}

export function parsePortalSlug(segment: string | undefined | null): PortalView | null {
  if (segment == null || segment === "") return "dashboard";
  const normalized = decodeURIComponent(segment).trim().toLowerCase();
  return SLUG_ALIASES[normalized] ?? null;
}

export function viewFromPortalPathname(pathname: string): PortalView {
  const trimmed = pathname.replace(/\/+$/, "") || PORTAL_BASE;
  if (trimmed === PORTAL_BASE) return "dashboard";
  if (!trimmed.startsWith(`${PORTAL_BASE}/`)) return "dashboard";
  const segment = trimmed.slice(PORTAL_BASE.length + 1).split("/")[0] ?? "";
  return parsePortalSlug(segment) ?? "dashboard";
}
