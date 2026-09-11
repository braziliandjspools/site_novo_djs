import type { LucideIcon } from "lucide-react";
import { CreditCard, Home, Mic2, Type, UserCircle, Video } from "lucide-react";

export type SiteNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
};

export const SITE_NAV_LINKS: SiteNavLink[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/plans", label: "Planos", icon: CreditCard },
  { href: "/allavsoft", label: "Allavsoft", icon: Video },
  { href: "/musicproducer", label: "Producer", icon: Mic2 },
  { href: "/gerador-maiusculas", label: "Maiúsculas", icon: Type },
  { href: "/portal", label: "Portal", icon: UserCircle },
];
