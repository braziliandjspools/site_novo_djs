"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, CreditCard, HeadphonesIcon, LayoutGrid, LogOut, Music2, User } from "lucide-react";

type MusicasUserMenuProps = {
  userName: string;
  hasVip: boolean;
  onLogout: () => void;
};

export function MusicasUserMenu({ userName, hasVip, onLogout }: MusicasUserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstName = userName.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { href: "/musicas/atualizacoes", label: "Acervo VIP", icon: Music2, desc: "Músicas e atualizações" },
    { href: "/portal?view=account", label: "Meus dados", icon: User, desc: "Cadastro e assinatura" },
    { href: "/portal?view=services", label: "Meus serviços", icon: LayoutGrid, desc: "Pools, Deemix e mais" },
    { href: "/portal?view=support", label: "Suporte", icon: HeadphonesIcon, desc: "Ajuda e contato" },
    { href: "/portal", label: "Portal completo", icon: CreditCard, desc: "Área do cliente" },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900/80 p-1 pr-2.5 transition-colors hover:border-[#009739]/40 sm:pr-3"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu da conta"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#009739] to-[#00ff9d] text-sm font-black text-black">
          {initial}
        </div>
        <ChevronDown className={`hidden h-4 w-4 text-zinc-400 transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-[#141414] shadow-2xl shadow-black/50"
        >
          <div className="border-b border-zinc-800 bg-[#1a1a1a] px-4 py-4">
            <p className="truncate text-sm font-bold text-white">{userName}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {hasVip ? "Plano VIP ativo" : "Sem plano VIP"}
            </p>
          </div>

          <ul className="p-1.5">
            {menuItems.map(({ href, label, icon: Icon, desc }) => (
              <li key={href}>
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5"
                >
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-[#00ff9d]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">{label}</span>
                    <span className="block text-[11px] text-zinc-500">{desc}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-zinc-800 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
