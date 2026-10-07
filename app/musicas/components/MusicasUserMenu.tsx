"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, CreditCard, HeadphonesIcon, LayoutGrid, LogOut, Music2, User } from "lucide-react";

type MusicasUserMenuProps = {
  userName: string;
  profileImageUrl?: string | null;
  hasVip: boolean;
  onLogout: () => void;
};

export function MusicasUserMenu({ userName, profileImageUrl, hasVip, onLogout }: MusicasUserMenuProps) {
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
    { href: "/portal?view=services", label: "Meus serviços", icon: LayoutGrid, desc: "Pools e serviços da conta" },
    { href: "/portal?view=support", label: "Suporte", icon: HeadphonesIcon, desc: "Ajuda e contato" },
    { href: "/portal", label: "Portal completo", icon: CreditCard, desc: "Área do cliente" },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full p-1 pr-1.5 transition-opacity hover:opacity-90 sm:pr-2"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu da conta"
      >
        {profileImageUrl ? (
          <img src={profileImageUrl} alt="Foto do perfil" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#60cdff] text-sm font-bold text-black">
            {initial}
          </div>
        )}
        <ChevronDown className={`hidden h-3.5 w-3.5 text-white/45 transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/95 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <div className="border-b border-white/[0.08] px-4 py-4">
            <p className="truncate text-sm font-bold text-white">{userName}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
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
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[#60cdff]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">{label}</span>
                    <span className="block text-[11px] text-white/40">{desc}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-white/[0.08] p-1.5">
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
