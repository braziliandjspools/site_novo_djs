import type { LucideIcon } from "lucide-react";
import { CreditCard, Home, Mic2, Music, UserCircle, Video } from "lucide-react";
import { DEEMIX_ENABLED } from "./feature-flags";

export type SiteNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
};

const ALL_SITE_NAV_LINKS: SiteNavLink[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/plans", label: "Planos", icon: CreditCard },
  { href: "/deemix", label: "Deemix", icon: Music },
  { href: "/allavsoft", label: "Allavsoft", icon: Video },
  { href: "/musicproducer", label: "Producer", icon: Mic2 },
  { href: "/portal", label: "Portal", icon: UserCircle },
];

export const SITE_NAV_LINKS: SiteNavLink[] = ALL_SITE_NAV_LINKS.filter(
  (link) => DEEMIX_ENABLED || link.href !== "/deemix",
);
