"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Heart, Home, RefreshCw, Search } from "lucide-react";

const LINKS = [
  { href: "/musicas", label: "Início", icon: Home },
  { href: "/musicas/atualizacoes", label: "Novidades", icon: RefreshCw },
  { href: "/musicas/atualizacoes#busca", label: "Buscar", icon: Search },
  { href: "/musicas#favoritos", label: "Favoritos", icon: Heart },
  { href: "/musicas#downloader-status", label: "Downloads", icon: Download },
] as const;

export function MusicasMobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação rápida da plataforma"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#1c1c1c]/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_28px_rgba(0,0,0,0.4)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 px-1.5 py-2">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/musicas"
              ? pathname === "/musicas"
              : href === "/musicas/atualizacoes"
                ? pathname.startsWith("/musicas/atualizacoes")
                : false;
          return (
            <Link
              key={label}
              href={href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-[6px] px-1 py-2 text-[10px] font-semibold transition ${
                active ? "bg-white/[0.08] text-white" : "text-[#9b9b9b] hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-[#60cdff]" : ""}`} strokeWidth={active ? 2.5 : 1.9} aria-hidden />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
