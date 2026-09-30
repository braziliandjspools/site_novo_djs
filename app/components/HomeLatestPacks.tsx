"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Disc3, Headphones, Loader2, Music2 } from "lucide-react";
import { displayFolderName, folderHref, slugifyFolderName } from "../lib/vip-music-slugs";

type CatalogFolder = {
  id: string;
  name: string;
  coverUrl?: string | null;
  trackCount?: number;
  folderCount?: number;
};

export function HomeLatestPacks() {
  const [packs, setPacks] = useState<CatalogFolder[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/musicas/catalog", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catálogo indisponível");
        return response.json() as Promise<{ items?: CatalogFolder[] }>;
      })
      .then((data) => setPacks((data.items ?? []).slice(0, 6)))
      .catch(() => { /* A vitrine é opcional: não bloqueia a página inicial. */ })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (!loading && packs.length === 0) return null;

  return (
    <section aria-labelledby="home-latest-packs" className="border-b border-[#1db954]/10 bg-[#0e0b17] px-4 py-14 sm:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1ed760]"><Headphones className="h-4 w-4" /> Direto do acervo</span>
            <h2 id="home-latest-packs" className="mt-2 font-display text-2xl font-black tracking-tight text-white sm:text-4xl">Explore os packs da BRS</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">Uma prévia das pastas reais da plataforma. Entre para explorar faixas, versões e remixes.</p>
          </div>
          <Link href="/musicas/atualizacoes" className="inline-flex items-center gap-2 rounded-full border border-[#1db954]/30 bg-[#1db954]/10 px-4 py-2 text-xs font-bold text-[#86efac] transition hover:bg-[#1db954]/20">Ver acervo completo <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-white/10 text-sm text-zinc-400"><Loader2 className="h-5 w-5 animate-spin text-[#1ed760]" /> Carregando packs...</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
            {packs.map((pack, index) => (
              <Link key={pack.id} href={folderHref([slugifyFolderName(pack.name)])} className="group min-w-0 overflow-hidden rounded-2xl border border-[#1db954]/15 bg-[#191325] transition hover:-translate-y-1 hover:border-[#1db954]/50 hover:shadow-[0_18px_40px_-24px_rgba(29,185,84,0.7)]">
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-green-700/40 via-emerald-900/25 to-[#14101d]">
                  {pack.coverUrl ? <Image src={pack.coverUrl} alt={`Capa de ${displayFolderName(pack.name)}`} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 190px" className="object-cover transition duration-500 group-hover:scale-105" unoptimized={pack.coverUrl.startsWith("/api/")} /> : <Disc3 className="absolute inset-0 m-auto h-16 w-16 text-[#86efac]/30" strokeWidth={1} />}
                  {index === 0 ? <span className="absolute left-2 top-2 rounded-full border border-[#1ed760]/40 bg-[#24133f]/90 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-green-100">Em destaque</span> : null}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 min-h-10 text-xs font-extrabold leading-snug text-white sm:text-sm">{displayFolderName(pack.name)}</h3>
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-zinc-400"><Music2 className="h-3.5 w-3.5 text-[#1ed760]" />{pack.trackCount ? `${pack.trackCount} faixas` : pack.folderCount ? `${pack.folderCount} pastas` : "Explorar pack"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
