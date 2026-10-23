"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, Music2, ScrollText, ShieldCheck, UsersRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { BrsLogo } from "../components/BrsLogo";

const links = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/producoes", label: "Produções", icon: Music2 },
  { href: "/admin/produtores", label: "Produtores", icon: UsersRound },
  { href: "/admin/scripts", label: "Scripts", icon: ScrollText },
];

type AdminMenuProps = {
  children: ReactNode;
  onLogout?: () => void;
  activeSection?: string;
  sections?: { id: string; label: string; icon: LucideIcon }[];
  onSectionChange?: (section: string) => void;
};

export function AdminMenu({ children, onLogout, activeSection, sections, onSectionChange }: AdminMenuProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      onLogout?.();
      window.location.replace("/admin");
    }
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 bg-[#121212] text-white">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 max-w-[86vw] shrink-0 flex-col border-r border-white/[0.08] bg-[#090a0b] transition-transform duration-200 lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="border-b border-white/[0.08] px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))]">
          <BrsLogo href="/" className="h-10 w-auto max-w-[220px] object-contain object-left" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Área administrativa</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Menu administrativo">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin"
              ? pathname === href && (!activeSection || activeSection === "dashboard")
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-xs font-bold uppercase tracking-wide transition ${active ? "bg-[#009739]/20 text-[#00ff9d] shadow-[inset_3px_0_0_0_#00ff9d]" : "text-white/55 hover:bg-white/[0.05] hover:text-white"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
          {sections?.length ? (
            <div className="mt-4 border-t border-white/[0.08] pt-4">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Operações</p>
              {sections.map(({ id, label, icon: Icon }) => {
                const active = activeSection === id;
                return (
                  <button key={id} type="button" aria-pressed={active} onClick={() => { onSectionChange?.(id); setMobileOpen(false); }} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-bold uppercase tracking-wide transition ${active ? "bg-sky-300/10 text-sky-100 shadow-[inset_3px_0_0_0_#7dd3fc]" : "text-white/50 hover:bg-white/[0.05] hover:text-white"}`}>
                    <Icon className="h-4 w-4 shrink-0" />{label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </nav>

        <div className="border-t border-white/[0.08] p-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-white/[0.035] px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 text-[#75e39c]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">Sessão protegida</span>
          </div>
          <button type="button" onClick={() => void logout()} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-xs font-bold uppercase tracking-wide text-white/45 transition hover:bg-red-500/10 hover:text-red-300">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {mobileOpen ? <button type="button" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/75 lg:hidden" /> : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#101112]/95 backdrop-blur-xl">
          <div className="h-1 bg-gradient-to-r from-[#009739] via-[#FFDF00] to-[#002776]" />
          <div className="flex min-h-[4.25rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMobileOpen((open) => !open)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.07] hover:text-white lg:hidden">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">Central de gestão BRS</p>
                <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">Portal · Catálogo · Operações</p>
              </div>
            </div>
            <span className="hidden items-center gap-2 rounded-full border border-[#1db954]/20 bg-[#1db954]/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#a5f3bf] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1db954]" /> Administração
            </span>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-clip px-3 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">{children}</main>
        <footer className="border-t border-white/[0.08] px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">Brazilian Remix Service · Administração</footer>
      </div>
    </div>
  );
}
