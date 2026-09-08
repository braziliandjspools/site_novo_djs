"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Home, Layers, LogIn, LogOut, Menu, RefreshCw, X } from "lucide-react";
import { BrsLogo } from "../components/BrsLogo";
import { SITE_NAV_LINKS } from "../lib/site-nav";
import { checkoutUrl } from "../lib/site";
import { MusicasUserMenu } from "./components/MusicasUserMenu";
import { MusicasHeaderDownloader } from "./components/MusicasHeaderDownloader";
import { SiteNotificationBell } from "../components/notifications/SiteNotificationBell";

type MusicasTopNavProps = {
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

function navActive(pathname: string, href: string) {
  if (href === "/musicas/home") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MusicasTopNav({
  authenticated,
  userName,
  hasVip,
  onLogout,
  onLogin: _onLogin,
  mobileOpen,
  onMobileOpenChange,
}: MusicasTopNavProps) {
  const pathname = usePathname();
  const firstName = authenticated ? userName.split(" ")[0] : "Visitante";
  const [siteOpen, setSiteOpen] = useState(false);
  const siteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (siteRef.current && !siteRef.current.contains(event.target as Node)) {
        setSiteOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    onMobileOpenChange(false);
    setSiteOpen(false);
  }, [pathname, onMobileOpenChange]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-3 sm:h-[4.25rem] sm:gap-3 sm:px-5 lg:px-8">
        <BrsLogo
          href="/musicas/home"
          className="h-8 w-auto max-w-[132px] object-contain object-left sm:h-9 sm:max-w-[168px]"
          sizes="168px"
          priority
        />

        <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
          {PLATFORM_NAV.map(({ href, label, icon: Icon }) => {
            const active = navActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors lg:px-3.5 ${
                  active
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{label}</span>
                <span className="lg:hidden">{label.split(" ")[0]}</span>
              </Link>
            );
          })}

          <div ref={siteRef} className="relative">
            <button
              type="button"
              onClick={() => setSiteOpen((open) => !open)}
              aria-expanded={siteOpen}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              Site
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${siteOpen ? "rotate-180" : ""}`} />
            </button>
            {siteOpen && (
              <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-[#181818] py-2 shadow-2xl shadow-black/50">
                {SITE_NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSiteOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-zinc-500" />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
          <MusicasHeaderDownloader />
          <SiteNotificationBell />

          {!authenticated && (
            <Link
              href={`/musicas/entrar?return=${encodeURIComponent(pathname || "/musicas/home")}`}
              className="hidden cursor-pointer rounded-full px-3 py-2 text-sm font-bold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Entrar
            </Link>
          )}

          {!hasVip && (
            <a
              href={checkoutUrl("VIP")}
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#1ed760] px-3 py-2 text-[11px] font-bold text-black transition-transform hover:scale-[1.03] sm:px-4 sm:text-sm"
            >
              Assinar VIP
            </a>
          )}

          {authenticated && (
            <MusicasUserMenu userName={userName} hasVip={hasVip} onLogout={onLogout} />
          )}

          <button
            type="button"
            className="inline-flex cursor-pointer items-center justify-center rounded-full p-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            onClick={() => onMobileOpenChange(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/5 bg-[#0f0f0f] px-3 py-4 md:hidden">
          <nav className="space-y-1">
            {PLATFORM_NAV.map(({ href, label, icon: Icon }) => {
              const active = navActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => onMobileOpenChange(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${
                    active ? "bg-white text-black" : "text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <p className="mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">Site</p>
          <nav className="mt-1 space-y-1">
            {SITE_NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => onMobileOpenChange(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 space-y-3 border-t border-white/5 px-1 pt-4">
            <p className="px-2 text-xs text-zinc-500">
              <span className="font-semibold text-white">{firstName}</span>
              {" · "}
              {hasVip ? "Premium" : authenticated ? "Prévia" : "Visitante"}
            </p>
            {authenticated ? (
              <button
                type="button"
                onClick={() => void onLogout()}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            ) : (
              <Link
                href={`/musicas/entrar?return=${encodeURIComponent(pathname || "/musicas/home")}`}
                onClick={() => onMobileOpenChange(false)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/** @deprecated Use MusicasTopNav — mantido para imports antigos. */
export const MusicasSidebar = MusicasTopNav;

export function MusicasMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-full p-2 text-zinc-400 hover:bg-[#282828] hover:text-white md:hidden"
      onClick={onClick}
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
