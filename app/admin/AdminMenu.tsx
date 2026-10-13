"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Music2, ScrollText, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

const links = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/producoes", label: "Produções", icon: Music2 },
  { href: "/admin/produtores", label: "Produtores", icon: UsersRound },
  { href: "/admin/scripts", label: "Scripts", icon: ScrollText },
];

export function AdminMenu({ children }: { children?: ReactNode }) {
  const pathname = usePathname();

  return (
    <nav className="admin-premium-nav w-full overflow-hidden rounded-2xl border border-white/10 bg-[#090b0d] shadow-2xl" aria-label="Menu administrativo">
      <div className="flex min-w-0 flex-col gap-2 p-2 sm:flex-row sm:items-center">
        <div className="admin-premium-nav-links flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`admin-premium-nav-link inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold ${active ? "is-active" : "text-white/60"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
        {children ? <div className="admin-premium-nav-extra flex shrink-0 items-center gap-1">{children}</div> : null}
      </div>
    </nav>
  );
}
