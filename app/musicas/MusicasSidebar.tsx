"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, LogIn, LogOut, Menu, RefreshCw } from "lucide-react";
import { BrsLogo } from "../components/BrsLogo";
import { DownloaderDevicePanel } from "./components/DownloaderDevicePanel";
import { SITE_NAV_LINKS } from "../lib/site-nav";

type MusicasSidebarProps = {
  authenticated: boolean;
  userName: string;
  hasVip: boolean;
  onLogout: () => void;
  onLogin: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

const PLATFORM_NAV = [
  { href: "/musicas/home", label: "Início", icon: Home },
  { href: "/musicas/atualizacoes", label: "Atualizações", icon: RefreshCw },
  { href: "/musicas/colecoes", label: "Coleções", icon: Layers },
] as const;

export function MusicasSidebar({
  authenticated,
  userName,
  hasVip,
  onLogout,
  onLogin,
  mobileOpen,
  onMobileOpenChange,
}: MusicasSidebarProps) {
  const pathname = usePathname();
  const firstName = authenticated ? userName.split(" ")[0] : "Visitante";

  const sidebarContent = (
    <>
      <div className="px-5 py-6">
        <BrsLogo href="/musicas/home" className="h-10 w-auto max-w-[220px] object-contain object-left" />
        <p className="mt-2 text-xs text-zinc-500">Sua biblioteca de músicas</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Menu</p>
        {PLATFORM_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/musicas/home" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onMobileOpenChange(false)}
              className={`flex items-center gap-4 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                active ? "bg-[#282828] text-white" : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}

        <p className="mt-6 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Site</p>
        {SITE_NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = href !== "/" && pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onMobileOpenChange(false)}
              className={`flex items-center gap-4 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                active ? "bg-[#282828] text-white" : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {hasVip && authenticated && <DownloaderDevicePanel />}

      <div className="border-t border-zinc-800/80 p-3">
        <p className="mb-2 truncate px-2 text-xs text-zinc-500">
          {firstName} · {hasVip ? "Premium" : authenticated ? "Gratuito" : "Visitante"}
        </p>
        {authenticated ? (
          <button
            type="button"
            onClick={() => void onLogout()}
            className="flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-sm font-semibold text-zinc-400 transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-sm font-semibold text-zinc-400 transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <LogIn className="h-5 w-5" />
            Entrar
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-black transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/80 lg:hidden"
          onClick={() => onMobileOpenChange(false)}
        />
      )}
    </>
  );
}

export function MusicasMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="rounded-full p-2 text-zinc-400 hover:bg-[#282828] hover:text-white lg:hidden" onClick={onClick}>
      <Menu className="h-5 w-5" />
    </button>
  );
}
