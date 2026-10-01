import type { LucideIcon } from "lucide-react";
import { CreditCard, Home, Mic2, Type, UserCircle, Video, Wrench } from "lucide-react";

export type SiteNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
};

/** Links principais do header (sem ferramentas). */
export const SITE_PRIMARY_NAV: SiteNavLink[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/plans", label: "Planos", icon: CreditCard },
  { href: "/allavsoft", label: "Allavsoft", icon: Video },
  { href: "/musicproducer", label: "Producer", icon: Mic2 },
  { href: "/portal", label: "Portal", icon: UserCircle },
];

/** Itens do menu Ferramentas. */
export const SITE_TOOL_LINKS: SiteNavLink[] = [
  { href: "/gerador-maiusculas", label: "Maiúsculas", icon: Type },
];

export const SITE_TOOLS_MENU = {
  label: "Ferramentas",
  icon: Wrench,
  items: SITE_TOOL_LINKS,
} as const;

/** Lista plana (compat): nav principal + ferramentas. */
export const SITE_NAV_LINKS: SiteNavLink[] = [...SITE_PRIMARY_NAV, ...SITE_TOOL_LINKS];
