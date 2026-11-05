"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Layers3, Music2, Search, Sparkles } from "lucide-react";
import { formatUpdateDateLabel } from "../../lib/vip-music-slugs";
import { formatStyleNameForDisplay } from "../../lib/style-display";
import { MusicasTracksSkeleton } from "../components/MusicasSkeletons";

type StyleItem = {
  slug: string;
  name: string;
  folderCount: number;
  trackCount: number;
  poolCount: number;
  poolNames: string[];
  latestUpdateDate: string | null;
  href: string;
};

type StyleResponse = { styles?: StyleItem[]; error?: string };

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
}

function styleGroup(name: string) {
  const initial = fold(name).trim().charAt(0);
  return /[a-z]/.test(initial) ? initial.toLocaleUpperCase("pt-BR") : "#";
}

export function EstilosCatalogClient() {
  const [styles, setStyles] = useState<StyleItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/musicas/styles", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as StyleResponse;
        if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar os estilos.");
        setStyles(body.styles ?? []);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "Não foi possível carregar os estilos.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const groups = useMemo(() => {
    const search = fold(query.trim());
    const filtered = styles.filter((style) =>
      !search || fold(`${style.name} ${style.poolNames.join(" ")}`).includes(search),
    );
    const grouped = new Map<string, StyleItem[]>();
    for (const style of filtered) {
      const key = styleGroup(style.name);
      const group = grouped.get(key);
      if (group) group.push(style);
      else grouped.set(key, [style]);
    }
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  }, [query, styles]);

  const totalTracks = styles.reduce((total, style) => total + style.trackCount, 0);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 sm:space-y-8">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-zinc-500" aria-label="Navegação estrutural">
        <Link href="/musicas" className="font-medium text-zinc-400 transition-colors hover:text-white">Início</Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span className="font-medium text-white" aria-current="page">Estilos</span>
      </nav>

      <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111414] px-4 py-6 sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-[#60cdff]/10 blur-3xl" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#60cdff]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Catálogo BRS
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Explore por estilo</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
              Estilos encontrados automaticamente nas pastas do acervo. Abra um estilo para ver faixas de todas as pools e datas.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-white/75">
                <Music2 className="h-3.5 w-3.5 text-[#60cdff]" aria-hidden /> {styles.length} estilos
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-white/75">
                <Layers3 className="h-3.5 w-3.5 text-[#60cdff]" aria-hidden /> {totalTracks.toLocaleString("pt-BR")} faixas indexadas
              </span>
            </div>
          </div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar estilo ou pool…"
              aria-label="Buscar estilo ou pool"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/35 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#60cdff]/50"
            />
          </label>
        </div>
      </header>

      {error ? (
        <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-5 text-sm text-red-200">{error}</p>
      ) : loading ? (
        <MusicasTracksSkeleton rows={8} />
      ) : groups.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-[#151717] px-4 py-12 text-center text-sm text-white/55">
          {query ? `Nenhum estilo ou pool encontrado para “${query}”.` : "Ainda não há estilos disponíveis no acervo."}
        </p>
      ) : (
        <div className="space-y-7">
          {groups.map(([letter, items]) => (
            <section key={letter} aria-labelledby={`style-group-${letter}`}>
              <div className="mb-2 flex items-center gap-3 border-b border-white/10 pb-2">
                <h2 id={`style-group-${letter}`} className="text-sm font-extrabold uppercase tracking-[0.16em] text-white">{letter}</h2>
                <span className="text-[10px] font-semibold tabular-nums text-white/35">{items.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((style) => (
                  <Link
                    key={style.slug}
                    href={style.href}
                    title={style.poolNames.length ? `Pools: ${style.poolNames.join(", ")}` : style.name}
                    className="group flex min-h-[72px] items-center justify-between gap-4 border-b border-white/[0.06] px-2.5 py-3 transition-colors hover:bg-[#60cdff]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#60cdff]/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white/85 transition-colors group-hover:text-[#8ad4ff]">
                        {formatStyleNameForDisplay(style.name)}
                      </span>
                      <span className="mt-1 block truncate text-[10px] text-white/40">
                        {style.trackCount.toLocaleString("pt-BR")} faixas · {style.poolCount} {style.poolCount === 1 ? "pool" : "pools"}
                        {style.latestUpdateDate ? ` · Atualizado ${formatUpdateDateLabel(style.latestUpdateDate)}` : ""}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-[#60cdff]" aria-hidden />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
