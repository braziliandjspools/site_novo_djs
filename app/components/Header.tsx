"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { SITE_PRIMARY_NAV, SITE_TOOLS_MENU } from "../lib/site-nav";
import { BrsLogo } from "./BrsLogo";
import { MarketingAuthControls } from "./MarketingAuthControls";
import { SiteNotificationBell } from "./notifications/SiteNotificationBell";

const navLinkClass =
  "group relative px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:text-white";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!toolsOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!toolsRef.current?.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setToolsOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [toolsOpen]);

  return (
    <>
      <div className="br-stripe" />
      <header className="sticky top-0 z-50 w-full min-w-0 border-b border-white/10 bg-[#0e0e0e]/92 backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 w-full min-w-0 max-w-6xl items-center gap-3 px-4 md:h-[72px] md:px-6">
          <div className="absolute left-1/2 -translate-x-1/2 flex-shrink-0 lg:static lg:translate-x-0">
            <BrsLogo
              href="/"
              priority
              className="h-9 w-auto max-w-[200px] object-contain sm:h-10 sm:max-w-[240px] md:h-11 md:max-w-[260px]"
            />
          </div>

          <nav className="ml-auto hidden items-center lg:flex" aria-label="Principal">
            <ul className="flex items-center gap-0.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-1.5 py-1">
              {SITE_PRIMARY_NAV.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={navLinkClass}>
                    {link.label}
                    <span className="absolute inset-x-3 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#009739] via-[#FFDF00] to-[#1DB954] transition-transform duration-300 group-hover:scale-x-100" />
                  </a>
                </li>
              ))}

              <li>
                <div ref={toolsRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setToolsOpen((open) => !open)}
                    aria-expanded={toolsOpen}
                    aria-haspopup="menu"
                    className={`${navLinkClass} inline-flex items-center gap-1 ${
                      toolsOpen ? "text-white" : ""
                    }`}
                  >
                    {SITE_TOOLS_MENU.label}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {toolsOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+0.75rem)] z-50 min-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-[#141414] py-2 shadow-2xl shadow-black/50 ring-1 ring-[#009739]/15"
                    >
                      <p className="px-4 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                        Ferramentas
                      </p>
                      {SITE_TOOLS_MENU.items.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setToolsOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-[#009739]/12 hover:text-white"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#009739]/20 text-[#1DB954]">
                            <item.icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                              {item.label}
                            </span>
                            <span className="mt-0.5 block text-xs normal-case tracking-normal text-zinc-500">
                              Gerador de texto
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            </ul>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <SiteNotificationBell compact />
            <MarketingAuthControls />
            <Link
              href="/musicas"
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-[#009739]/45 bg-[#009739]/12 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1DB954] transition-all hover:border-[#1DB954] hover:bg-[#009739]/22 hover:text-white"
            >
              Plataforma
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:hidden">
            <MarketingAuthControls compact />
            <SiteNotificationBell compact />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-10 flex-shrink-0 rounded-md p-2 text-white transition-colors hover:bg-white/10"
              aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 z-[101] flex w-72 max-w-[85vw] flex-col overflow-hidden border-l border-[#009739]/40 bg-[#121212] shadow-2xl lg:hidden">
              <div className="br-stripe" />
              <div className="relative flex items-center justify-between border-b border-white/10 p-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                  Menu
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-2 hover:bg-white/10"
                  aria-label="Fechar menu"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-4">
                {SITE_PRIMARY_NAV.map((link, i) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#181818] px-3 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-gray-200 transition-all hover:border-[#009739]/50 hover:bg-[#282828]"
                  >
                    <span
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                        i % 3 === 0
                          ? "bg-[#009739]/25 text-[#00B347]"
                          : i % 3 === 1
                            ? "bg-[#FFDF00]/15 text-[#FFDF00]"
                            : "bg-[#002776]/40 text-[#6B9FFF]"
                      }`}
                    >
                      <link.icon size={16} />
                    </span>
                    {link.label}
                  </a>
                ))}

                <div className="mt-1 overflow-hidden rounded-xl border border-white/5 bg-[#181818]">
                  <button
                    type="button"
                    onClick={() => setMobileToolsOpen((open) => !open)}
                    aria-expanded={mobileToolsOpen}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left text-[12px] font-bold uppercase tracking-[0.12em] text-gray-200 transition-colors hover:bg-[#282828]"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#009739]/25 text-[#00B347]">
                      <SITE_TOOLS_MENU.icon size={16} />
                    </span>
                    <span className="flex-1">{SITE_TOOLS_MENU.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-500 transition-transform ${
                        mobileToolsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileToolsOpen && (
                    <div className="border-t border-white/5 bg-black/20 px-2 py-2">
                      {SITE_TOOLS_MENU.items.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          <item.icon className="h-4 w-4 text-[#1DB954]" />
                          {item.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href="/musicas"
                  onClick={() => setIsOpen(false)}
                  className="mt-3 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#009739] to-[#1DB954] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white"
                >
                  Plataforma
                </Link>
              </nav>
              <div className="border-t border-white/10 p-4 text-center text-[11px] tracking-[-0.01em] text-gray-500">
                Verde · Amarelo · Azul
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
