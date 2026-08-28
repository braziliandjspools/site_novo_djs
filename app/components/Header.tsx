"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  Layers,
  Music,
  Video,
  CreditCard,
  Star,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

const navLinks = [
  { href: "#beneficios", label: "Benefícios", icon: Sparkles },
  { href: "#acervo", label: "Acervo", icon: Layers },
  { href: "/deemix", label: "Deemix", icon: Music },
  { href: "/allavsoft", label: "Allavsoft", icon: Video },
  { href: "#planos", label: "Planos", icon: CreditCard },
  { href: "#depoimentos", label: "Depoimentos", icon: Star },
];

const PLATFORM_URL = "https://plataformavip.netlify.app/";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#08070D]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
        <a href="/" className="mr-auto flex-shrink-0">
          <img
            src="https://i.ibb.co/j9BP1zD0/logo-brazilianpacks.png"
            alt="Brazilian Packs"
            className="h-9 w-auto max-w-[170px] object-contain"
          />
        </a>

        <div className="hidden items-center gap-4 lg:flex">
          <nav className="flex flex-wrap items-center gap-1 rounded-full border border-white/5 bg-white/5 px-2 py-1.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium text-gray-300 transition-all duration-300 hover:bg-white/10 hover:text-white"
              >
                <link.icon size={14} className="flex-shrink-0" />
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href={PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="BRAZILIAN PACKS - Plataforma VIP"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 ease-out hover:scale-105 hover:from-violet-500 hover:to-cyan-400"
          >
            Acessar Plataforma <ExternalLink size={14} />
          </a>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-4 flex-shrink-0 rounded-md p-2 text-white transition-colors duration-300 hover:bg-white/10 lg:hidden"
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
          <div className="fixed inset-y-0 right-0 z-[101] flex w-72 max-w-[85vw] flex-col overflow-hidden border-l border-violet-500/30 bg-gradient-to-b from-[#150C29] via-[#0B0813] to-[#08070D] shadow-2xl shadow-black/60 transition-transform duration-300 ease-out lg:hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-600/30 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/20 blur-[80px]" />

            <div className="relative flex items-center justify-between border-b border-white/10 p-4">
              <span className="flex items-center gap-2 font-display text-lg tracking-wide text-white">
                🇧🇷 MENU
              </span>
              <button onClick={() => setIsOpen(false)} className="rounded-md p-2 text-white transition-colors duration-300 hover:bg-white/10" aria-label="Fechar menu">
                <X size={20} />
              </button>
            </div>
            <nav className="relative flex flex-1 flex-col gap-1.5 overflow-y-auto p-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-3 text-sm font-medium text-gray-200 transition-all duration-300 hover:border-violet-500/40 hover:bg-white/10 hover:text-white"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/40 to-cyan-500/40 text-violet-300">
                    <link.icon size={16} />
                  </span>
                  {link.label}
                </a>
              ))}
              <a
                href={PLATFORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="BRAZILIAN PACKS - Plataforma VIP"
                onClick={() => setIsOpen(false)}
                className="mt-3 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all duration-300 ease-out hover:scale-105"
              >
                Acessar Plataforma <ExternalLink size={14} />
              </a>
            </nav>
            <div className="relative border-t border-white/10 p-4 text-center text-[11px] uppercase tracking-wider text-gray-500">
              Feito com 💚💛 no Brasil
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
