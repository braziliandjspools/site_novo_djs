"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { PLATFORM_URL } from "../lib/site";
import { SITE_NAV_LINKS } from "../lib/site-nav";
import { BrsLogo } from "./BrsLogo";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = SITE_NAV_LINKS;


  return (
    <>
      <div className="br-stripe" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#121212]/95 backdrop-blur-md">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center px-4 md:h-[72px] md:px-6">
          <div className="absolute left-1/2 -translate-x-1/2 flex-shrink-0 lg:static lg:translate-x-0 lg:mr-auto">
            <BrsLogo href="/" priority className="h-9 w-auto max-w-[200px] object-contain sm:h-10 sm:max-w-[240px] md:h-11 md:max-w-[260px]" />
          </div>

          <nav className="ml-auto hidden items-center lg:flex">
            <ul className="flex items-center">
              {navLinks.map((link, i) => (
                <li key={link.href} className="flex items-center">
                  {i > 0 && <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />}
                  <a
                    href={link.href}
                    className="group relative px-4 py-2 text-sm font-medium tracking-wide text-gray-400 transition-colors hover:text-white"
                  >
                    {link.label}
                    <span className="absolute inset-x-4 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#009739] via-[#FFDF00] to-[#1DB954] transition-transform duration-300 group-hover:scale-x-100" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <a
            href={PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden flex-shrink-0 items-center gap-2 rounded-lg border border-[#009739]/50 bg-[#009739]/10 px-4 py-2 text-sm font-semibold text-[#1DB954] transition-all hover:border-[#1DB954] hover:bg-[#009739]/20 hover:text-white lg:inline-flex"
          >
            Plataforma
            <ExternalLink size={14} />
          </a>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative z-10 ml-auto flex-shrink-0 rounded-md p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />
            <div className="fixed inset-y-0 right-0 z-[101] flex w-72 max-w-[85vw] flex-col overflow-hidden border-l border-[#009739]/40 bg-[#121212] shadow-2xl lg:hidden">
              <div className="br-stripe" />
              <div className="relative flex items-center justify-between border-b border-white/10 p-4">
                <span className="font-display text-lg tracking-wide text-white">MENU</span>
                <button onClick={() => setIsOpen(false)} className="rounded-md p-2 hover:bg-white/10" aria-label="Fechar menu">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-4">
                {navLinks.map((link, i) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#181818] px-3 py-3 text-sm font-medium text-gray-200 transition-all hover:border-[#009739]/50 hover:bg-[#282828]"
                  >
                    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${i % 3 === 0 ? "bg-[#009739]/25 text-[#00B347]" : i % 3 === 1 ? "bg-[#FFDF00]/15 text-[#FFDF00]" : "bg-[#002776]/40 text-[#6B9FFF]"}`}>
                      <link.icon size={16} />
                    </span>
                    {link.label}
                  </a>
                ))}
                <a
                  href={PLATFORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="mt-3 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#009739] to-[#1DB954] px-5 py-3 text-sm font-bold text-white"
                >
                  Plataforma <ExternalLink size={14} />
                </a>
              </nav>
              <div className="border-t border-white/10 p-4 text-center text-[11px] uppercase tracking-wider text-gray-500">
                Verde · Amarelo · Azul
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
