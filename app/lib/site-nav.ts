import type { LucideIcon } from "lucide-react";
import { Home, Mic2, Music, UserCircle, Video } from "lucide-react";

export type SiteNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
};

export const SITE_NAV_LINKS: SiteNavLink[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/deemix", label: "Deemix", icon: Music },
  { href: "/allavsoft", label: "Allavsoft", icon: Video },
  { href: "/musicproducer", label: "Producer", icon: Mic2 },
  { href: "/portal", label: "Portal", icon: UserCircle },
];
