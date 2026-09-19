"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Layers,
  Mic2,
  MonitorDown,
  Music2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { libraryTileTone } from "./MusicLibraryTiles";

const QUICK_LINKS: Array<{
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}> = [
  {
    href: "/musicas/atualizacoes",
    title: "Atualizações",
    subtitle: "Packs VIP",
    icon: RefreshCw,
  },
  {
    href: "/musicas/artistas",
    title: "Artistas",
    subtitle: "Perfis",
    icon: Mic2,
  },
  {
    href: "/musicas/estilos",
    title: "Estilos",
    subtitle: "Gêneros",
    icon: Music2,
  },
  {
    href: "/musicas/colecoes",
    title: "Coleções",
    subtitle: "Curadoria",
    icon: Layers,
  },
];

export function MusicLibraryQuickLinks({ className = "" }: { className?: string }) {
  return (
    <section className={`min-w-0 ${className}`} aria-label="Atalhos">
      <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
        <h2 className="text-[17px] font-bold tracking-tight text-white sm:text-[19px]">Explorar</h2>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
          <Sparkles className="h-3 w-3" aria-hidden />
          Biblioteca
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {QUICK_LINKS.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br p-3.5 ring-1 ring-white/10 transition duration-300 hover:-translate-y-0.5 hover:ring-white/25 ${libraryTileTone(index + 1)}`}
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/15 blur-xl" aria-hidden />
              <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-black/25 text-white ring-1 ring-white/15">
                <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              <p className="relative mt-3 text-[14px] font-bold text-white">{item.title}</p>
              <p className="relative mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
                {item.subtitle}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
