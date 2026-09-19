"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Music2, Search } from "lucide-react";
import { stylesHref, slugifyStyleName } from "../../lib/vip-music-slugs";
import { MusicasArtistGridSkeleton } from "../components/MusicasSkeletons";
import { MusicLibraryTile, libraryTileTone } from "../components/MusicLibraryTiles";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "../components/MusicasSessionContext";

type StyleListItem = {
  slug: string;
  name: string;
  folderCount: number;
  href: string;
};

type ListResponse = {
  styles?: StyleListItem[];
  error?: string;
};

export default function EstilosPage() {
  const { authenticated, hasVip } = useMusicasSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [styles, setStyles] = useState<StyleListItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    void fetch("/api/musicas/styles", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as ListResponse;
        if (!res.ok) throw new Error(body.error ?? "Erro ao carregar estilos.");
        setStyles(body.styles ?? []);
      })
      .catch((err: Error) => {
        setError(err.message);
        setStyles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return styles;
    return styles.filter(
      (style) =>
        style.name.toLowerCase().includes(q) || style.slug.includes(slugifyStyleName(q)),
    );
  }, [styles, query]);

  function openStyleSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    router.push(stylesHref(slugifyStyleName(q)));
  }

  return (
    <div className="w-full space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/musicas/atualizacoes"
          prefetch={false}
          className="font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Atualizações
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-white">Estilos</span>
      </nav>

      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2a24] via-[#121816] to-[#0c0e0d] px-4 py-5 ring-1 ring-white/10 sm:px-6 sm:py-6">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#1ed760]/15 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1ed760]/90">
            Brazilian Remix Service
          </p>
          <h1 className="mt-1.5 font-display text-[28px] font-extrabold tracking-tight text-white sm:text-4xl">
            Estilos
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/55 sm:text-sm">
            Funk, sertanejo, eletrônico e mais — abra um estilo para ver faixas de todo o acervo.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-black/35 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white/70 ring-1 ring-white/10">
              {loading
                ? "…"
                : `${styles.length} ${styles.length === 1 ? "estilo" : "estilos"}`}
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold ring-1 ${
                hasVip
                  ? "bg-[#1ed760]/15 text-[#1ed760] ring-[#1ed760]/25"
                  : "bg-black/35 text-white/55 ring-white/10"
              }`}
            >
              {hasVip ? "Premium ativo" : "Só navegação"}
            </span>
          </div>
        </div>
      </header>

      {!hasVip && authenticated && <VipUpgradeBanner />}
      {!authenticated && <VipUpgradeBanner />}

      <form
        onSubmit={openStyleSearch}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar estilo ou abrir pelo nome…"
            className="w-full rounded-full border-0 bg-[#242424] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:bg-[#2a2a2a] focus:ring-2 focus:ring-white/10"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black transition-transform hover:scale-[1.01] hover:bg-[#1fdf67]"
        >
          <Music2 className="h-4 w-4" />
          Abrir estilo
        </button>
      </form>

      {loading ? (
        <MusicasArtistGridSkeleton cards={18} />
      ) : error ? (
        <p className="rounded-xl bg-red-500/10 px-4 py-8 text-center text-sm text-red-300 ring-1 ring-red-500/20">
          {error}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl bg-white/[0.03] px-4 py-10 text-center text-sm text-zinc-500">
          Nenhum estilo encontrado para “{query.trim()}”.
        </p>
      ) : (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
            <div>
              <h2 className="text-[17px] font-bold tracking-tight text-white sm:text-[19px]">
                Estilos do acervo
              </h2>
              <p className="mt-1 text-[13px] text-white/45">
                {filtered.length} {filtered.length === 1 ? "estilo" : "estilos"}
                {query.trim() ? " na busca" : ""}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((style, index) => (
              <MusicLibraryTile
                key={style.slug}
                href={style.href}
                title={style.name}
                subtitle={`${style.folderCount} ${style.folderCount === 1 ? "pasta" : "pastas"}`}
                index={index}
                tone={libraryTileTone(index)}
                icon={Music2}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
