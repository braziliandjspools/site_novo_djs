"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogIn, LogOut, Menu, X } from "lucide-react";
import { BrsLogo } from "../components/BrsLogo";
import { APP_TOP_CHROME_ROW, APP_TOP_CHROME_ROW_H } from "../lib/app-chrome";
import { SITE_PRIMARY_NAV, SITE_TOOLS_MENU } from "../lib/site-nav";
import { checkoutUrl } from "../lib/site";
import { MusicasUserMenu } from "./components/MusicasUserMenu";
import { MusicasHeaderDownloader } from "./components/MusicasHeaderDownloader";
import { SiteNotificationBell } from "../components/notifications/SiteNotificationBell";

type MusicasTopNavProps = {
  authenticated: boolean;
  userName: string;
  profileImageUrl: string | null;
  hasVip: boolean;
  onLogout: () => void;
  onLogin: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

const PLATFORM_NAV = [
  { href: "/musicas", label: "Início" },
  { href: "/musicas/atualizacoes", label: "Atualizações" },
  { href: "/musicas/artistas", label: "Artistas" },
] as const;

function navActive(pathname: string, href: string) {
  if (href === "/musicas") return pathname === "/musicas" || pathname === "/musicas/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MusicasTopNav({
  authenticated,
  userName,
  profileImageUrl,
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
    <header className="app-top-chrome sticky top-0 z-40 w-full min-w-0 border-b border-white/[0.06] bg-transparent backdrop-blur-md">
      <div className="br-stripe" />

      <div className={`${APP_TOP_CHROME_ROW} ${APP_TOP_CHROME_ROW_H} max-w-[1600px] sm:px-5 lg:px-8`}>
        <BrsLogo
          href="/musicas"
          className="h-8 w-auto max-w-[132px] object-contain object-left sm:h-9 sm:max-w-[168px]"
          sizes="168px"
          priority
        />

        <nav className="ml-4 hidden min-w-0 flex-1 items-center gap-1 md:flex lg:ml-8 lg:gap-2">
          {PLATFORM_NAV.map(({ href, label }) => {
            const active = navActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative inline-flex items-center px-3 py-2 text-[13px] font-semibold tracking-[-0.01em] transition-colors lg:px-3.5 lg:text-[14px] ${
                  active
                    ? "text-white"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {label}
                {active ? (
                  <span
                    className="absolute inset-x-3 -bottom-0.5 h-px bg-[#60cdff] lg:inset-x-3.5"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}

          <div ref={siteRef} className="relative">
            <button
              type="button"
              onClick={() => setSiteOpen((open) => !open)}
              aria-expanded={siteOpen}
              className={`relative inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 text-[13px] font-semibold tracking-[-0.01em] transition-colors lg:px-3.5 lg:text-[14px] ${
                siteOpen ? "text-white" : "text-white/55 hover:text-white"
              }`}
            >
              Site
              <ChevronDown
                className={`h-3.5 w-3.5 opacity-70 transition-transform ${siteOpen ? "rotate-180" : ""}`}
              />
            </button>
            {siteOpen && (
              <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/95 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                {SITE_PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSiteOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-[#60cdff]/80" />
                    {label}
                  </Link>
                ))}
                <div className="my-1.5 border-t border-white/[0.08]" />
                <p className="px-4 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  {SITE_TOOLS_MENU.label}
                </p>
                {SITE_TOOLS_MENU.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSiteOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-[#60cdff]/80" />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="app-no-drag ml-auto flex flex-shrink-0 items-center gap-1 sm:gap-2">
          <MusicasHeaderDownloader />
          <SiteNotificationBell />

          {!authenticated && (
            <Link
              href={`/musicas/entrar?return=${encodeURIComponent(pathname || "/musicas")}`}
              className="hidden cursor-pointer px-3 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white sm:inline-flex"
            >
              Entrar
            </Link>
          )}

          {!hasVip && (
            <a
              href={checkoutUrl("VIP")}
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#60cdff] px-3.5 py-2 text-sm font-bold tracking-[-0.01em] text-black transition hover:bg-[#8ad4ff] sm:px-4"
            >
              Assinar VIP
            </a>
          )}

          {authenticated && (
            <MusicasUserMenu userName={userName} profileImageUrl={profileImageUrl} hasVip={hasVip} onLogout={onLogout} />
          )}

          <button
            type="button"
            className="inline-flex cursor-pointer items-center justify-center rounded-full p-2 text-white/70 transition-colors hover:text-white md:hidden"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            onClick={() => onMobileOpenChange(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-[#050505]/92 px-3 py-4 backdrop-blur-xl md:hidden">
          <nav className="space-y-0.5">
            {PLATFORM_NAV.map(({ href, label }) => {
              const active = navActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => onMobileOpenChange(false)}
                  className={`flex items-center px-3 py-3 text-[15px] font-semibold tracking-[-0.01em] ${
                    active ? "text-[#60cdff]" : "text-white/70 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <p className="mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
            Site
          </p>
          <nav className="mt-1 space-y-0.5">
            {SITE_PRIMARY_NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => onMobileOpenChange(false)}
                className="flex items-center px-3 py-2.5 text-[15px] font-medium tracking-[-0.01em] text-white/55 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>

          <p className="mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
            {SITE_TOOLS_MENU.label}
          </p>
          <nav className="mt-1 space-y-0.5">
            {SITE_TOOLS_MENU.items.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => onMobileOpenChange(false)}
                className="flex items-center px-3 py-2.5 text-[15px] font-medium tracking-[-0.01em] text-white/55 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 space-y-3 border-t border-white/[0.06] px-1 pt-4">
            <p className="px-2 text-xs text-white/40">
              <span className="font-semibold text-white">{firstName}</span>
              {" · "}
              {hasVip ? (
                <span className="text-[#60cdff]">Premium</span>
              ) : authenticated ? (
                "Sem VIP"
              ) : (
                "Visitante"
              )}
            </p>
            {authenticated ? (
              <button
                type="button"
                onClick={() => void onLogout()}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/55 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            ) : (
              <Link
                href={`/musicas/entrar?return=${encodeURIComponent(pathname || "/musicas")}`}
                onClick={() => onMobileOpenChange(false)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/55 hover:text-white"
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
