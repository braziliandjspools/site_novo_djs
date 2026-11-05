"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, AudioLines, ChevronRight, Disc3, FolderOpen, Layers3, Music2, Search, Sparkles } from "lucide-react";
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

      <header className="relative overflow-hidden rounded-[26px] border border-white/[0.09] bg-[linear-gradient(118deg,#101719_0%,#0d1114_56%,#101316_100%)] px-4 py-6 shadow-[0_24px_70px_-48px_rgba(96,205,255,0.45)] sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-[#60cdff]/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-emerald-300/[0.04] blur-3xl" aria-hidden />
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
          <label className="relative block self-end">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar estilo ou pool…"
              aria-label="Buscar estilo ou pool"
              className="h-12 w-full rounded-xl border border-white/[0.12] bg-black/35 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 hover:border-white/20 focus:border-[#60cdff]/55 focus:ring-4 focus:ring-[#60cdff]/[0.06]"
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
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#60cdff]/20 bg-[#60cdff]/[0.08] text-xs font-black text-[#8ad4ff]">{letter}</span>
                <h2 id={`style-group-${letter}`} className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/75">Estilos</h2>
                <span className="h-px flex-1 bg-white/[0.08]" aria-hidden />
                <span className="text-[10px] font-semibold tabular-nums text-white/35">{items.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {items.map((style, index) => (
                  <Link
                    key={style.slug}
                    href={style.href}
                    title={style.poolNames.length ? `Pools: ${style.poolNames.join(", ")}` : style.name}
                    className="group relative isolate flex min-h-[156px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.085] bg-[#111517] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#60cdff]/30 hover:bg-[#141a1d] hover:shadow-[0_18px_42px_-28px_rgba(96,205,255,0.48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60cdff]/60"
                  >
                    <span className="pointer-events-none absolute -right-8 -top-10 -z-10 h-32 w-32 rounded-full bg-[#60cdff]/[0.06] blur-2xl transition group-hover:bg-[#60cdff]/[0.13]" aria-hidden />
                    <span className="flex items-start justify-between gap-3">
                      <span className="relative flex h-[58px] w-[68px] items-center justify-center rounded-xl border border-[#60cdff]/15 bg-[linear-gradient(145deg,rgba(96,205,255,0.12),rgba(255,255,255,0.025))] text-[#8ad4ff] shadow-inner shadow-black/20 transition duration-300 group-hover:scale-[1.03] group-hover:border-[#60cdff]/30">
                        <FolderOpen className="h-8 w-8" strokeWidth={1.35} aria-hidden />
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-md border border-[#101517] bg-[#202a2e] text-[#a8e3ff]">
                          {index % 2 === 0 ? <Music2 className="h-3 w-3" aria-hidden /> : <AudioLines className="h-3 w-3" aria-hidden />}
                        </span>
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] text-white/45 transition group-hover:border-[#60cdff]/25 group-hover:bg-[#60cdff]/10 group-hover:text-[#8ad4ff]">
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </span>
                    </span>
                    <span className="mt-5 block min-w-0">
                      <span className="block truncate text-[15px] font-bold tracking-[-0.02em] text-white/90 transition-colors group-hover:text-white">
                        {formatStyleNameForDisplay(style.name)}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-white/45">
                        <span className="inline-flex items-center gap-1"><Music2 className="h-3 w-3 text-[#8ad4ff]/70" aria-hidden />{style.trackCount.toLocaleString("pt-BR")} faixas</span>
                        <span className="text-white/20" aria-hidden>·</span>
                        <span className="inline-flex items-center gap-1"><Disc3 className="h-3 w-3 text-white/40" aria-hidden />{style.poolCount} {style.poolCount === 1 ? "pool" : "pools"}</span>
                      </span>
                      {style.latestUpdateDate ? (
                        <span className="mt-2 block truncate text-[10px] text-white/35">Atualizado {formatUpdateDateLabel(style.latestUpdateDate)}</span>
                      ) : null}
                    </span>
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
