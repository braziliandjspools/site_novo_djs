"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Disc3,
  Headphones,
  Library,
  ListMusic,
  Music2,
  Search,
  Sparkles,
} from "lucide-react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import type { HomeTrackItem, VipMusicHomeSnapshot } from "../../lib/vip-music-home";
import { displayFolderName, folderHref, slugifyFolderName } from "../../lib/vip-music-slugs";
import { fetchMusicasJson, peekMusicasCache } from "../lib/musicas-fetch-cache";
import { MusicasToastLoading } from "../components/MusicasSkeletons";
import { HomeTrackRow } from "../components/HomeTrackRow";

type TreeResponse = { folders?: Array<VipMusicFolder | VipMusicCatalogItem>; error?: string };

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function CatalogCard({ folder, index }: { folder: VipMusicFolder | VipMusicCatalogItem; index: number }) {
  const item = folder as VipMusicCatalogItem;
  const title = displayFolderName(folder.name);
  const href = folderHref([slugifyFolderName(folder.name)]);
  const gradients = [
    "from-sky-500/35 via-blue-950 to-[#101216]",
    "from-cyan-400/25 via-slate-900 to-[#101216]",
    "from-indigo-400/30 via-blue-950 to-[#101216]",
    "from-emerald-400/20 via-slate-900 to-[#101216]",
  ];

  return (
    <Link
      href={href}
      prefetch={false}
      className="group min-w-0 rounded-2xl border border-white/[0.07] bg-[#15171a] p-3 transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/25 hover:bg-[#191d22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 sm:p-4"
    >
      <div className={`relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]}`}>
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 42vw, (max-width: 1024px) 24vw, 200px"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            unoptimized={item.coverUrl.startsWith("/api/")}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <Disc3 className="h-12 w-12 text-sky-100/45 sm:h-16 sm:w-16" strokeWidth={1} aria-hidden />
          </span>
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-white/[0.03]" />
        <span className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-sky-300 text-[#071018] opacity-0 shadow-lg shadow-sky-400/20 transition group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:opacity-100">
          <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <div className="mt-3 min-w-0">
        <h3 className="truncate text-sm font-bold text-white group-hover:text-sky-100">{title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
          <Music2 className="h-3.5 w-3.5 text-sky-200/70" aria-hidden />
          {typeof item.trackCount === "number" && item.trackCount > 0
            ? `${item.trackCount.toLocaleString("pt-BR")} faixas`
            : "Abrir acervo"}
        </p>
      </div>
    </Link>
  );
}

export function MusicNewClient() {
  const cachedTree = peekMusicasCache<TreeResponse>("/api/musicas/tree");
  const cachedHome = peekMusicasCache<VipMusicHomeSnapshot>("/api/musicas/home");
  const [folders, setFolders] = useState<Array<VipMusicFolder | VipMusicCatalogItem>>(cachedTree?.folders ?? []);
  const [home, setHome] = useState<VipMusicHomeSnapshot | null>(cachedHome ?? null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(!cachedTree?.folders?.length && !cachedHome);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchMusicasJson<TreeResponse>("/api/musicas/tree"),
      fetchMusicasJson<VipMusicHomeSnapshot>("/api/musicas/home"),
    ])
      .then(([tree, snapshot]) => {
        if (!active) return;
        setFolders(tree.folders ?? []);
        setHome(snapshot);
        if (tree.error) setError(tree.error);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar a biblioteca agora. Tente novamente em instantes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredFolders = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return folders;
    return folders.filter((folder) => normalize(displayFolderName(folder.name)).includes(term));
  }, [folders, query]);

  const filteredTracks = useMemo(() => {
    const tracks = home?.latestTracks ?? [];
    const term = normalize(query.trim());
    if (!term) return tracks;
    return tracks.filter((track: HomeTrackItem) =>
      normalize(`${track.title} ${track.artist ?? ""} ${track.styleName} ${track.monthName}`).includes(term),
    );
  }, [home, query]);

  const featured = home?.priorityMonth;
  const featuredHref = featured ? folderHref([featured.slug]) : "/musicas/atualizacoes";

  return (
    <div className="mx-auto max-w-[1440px] pb-8">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:gap-7">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-2 rounded-2xl border border-white/[0.06] bg-[#141619] p-3">
            <p className="px-3 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/35">Biblioteca BRS</p>
            <a href="#inicio" className="flex items-center gap-3 rounded-xl bg-sky-300/10 px-3 py-2.5 text-sm font-semibold text-sky-100 ring-1 ring-sky-200/10 transition hover:bg-sky-300/15">
              <Headphones className="h-4 w-4" /> Descobrir
            </a>
            <a href="#faixas" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.04] hover:text-white">
              <ListMusic className="h-4 w-4" /> Faixas recentes
            </a>
            <a href="#acervos" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.04] hover:text-white">
              <Library className="h-4 w-4" /> Acervos
            </a>
            <div className="my-3 border-t border-white/[0.07]" />
            <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/35">Explorar estilos</p>
            {(home?.genres ?? []).slice(0, 6).map((genre) => (
              <Link key={genre.slug} href={genre.href} className="block truncate rounded-lg px-3 py-2 text-[13px] text-white/50 transition hover:bg-white/[0.04] hover:text-white">
                {genre.name}
              </Link>
            ))}
          </div>
        </aside>

        <main id="inicio" className="min-w-0 space-y-8">
          <header className="relative isolate overflow-hidden rounded-[26px] border border-sky-200/[0.12] bg-[#101317] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_82%_12%,rgba(70,160,220,0.2),transparent_38%),linear-gradient(130deg,rgba(20,45,66,0.4),transparent_55%)]" />
            <div className="pointer-events-none absolute -right-16 -top-28 -z-10 h-80 w-80 rounded-full border border-sky-100/[0.06] sm:right-4 sm:top-[-9rem]" />
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/15 bg-sky-200/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-sky-100/85">
                <Sparkles className="h-3.5 w-3.5" /> Brazilian Remix Service
              </span>
              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">Sua biblioteca. Seu próximo set.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
                Encontre faixas, explore os acervos e prepare sua próxima apresentação em um só lugar.
              </p>
              <label className="mt-6 flex min-h-12 max-w-2xl items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 transition focus-within:border-sky-200/35 focus-within:bg-black/40">
                <Search className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar faixa, artista, estilo ou acervo"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  aria-label="Buscar faixa, artista, estilo ou acervo"
                />
                {query ? <button type="button" onClick={() => setQuery("")} className="rounded-md px-2 py-1 text-xs font-semibold text-white/50 hover:text-white">Limpar</button> : null}
              </label>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href="#faixas" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-sky-300 px-4 text-sm font-bold text-[#071018] transition hover:bg-sky-200">
                  <Music2 className="h-4 w-4" /> Ver faixas
                </a>
                <Link href={featuredHref} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white/85 transition hover:border-sky-200/25 hover:bg-sky-200/[0.07]">
                  {featured ? `Abrir ${displayFolderName(featured.name)}` : "Explorar atualizações"}<ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </header>

          {error ? <p role="alert" className="rounded-xl border border-red-300/15 bg-red-950/20 px-4 py-3 text-sm text-red-100/75">{error}</p> : null}

          <section id="faixas" className="scroll-mt-24">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200/65">Do catálogo BRS</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">Faixas recentes</h2>
              </div>
              <Link href="/musicas/atualizacoes" className="hidden items-center gap-1 text-xs font-semibold text-white/45 transition hover:text-sky-100 sm:inline-flex">Ver atualizações <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#141619] p-2 sm:p-3">
              {filteredTracks.length ? (
                <div className="divide-y divide-white/[0.055]">
                  {filteredTracks.slice(0, 8).map((track, index) => (
                    <HomeTrackRow key={`${track.id}-${index}`} track={track} rank={index + 1} compact />
                  ))}
                </div>
              ) : loading ? (
                <div className="flex min-h-32 items-center justify-center"><MusicasToastLoading label="Carregando faixas do catálogo…" /></div>
              ) : (
                <p className="px-4 py-10 text-center text-sm text-white/45">{query ? "Nenhuma faixa encontrada para esta busca." : "As faixas recentes não estão disponíveis agora."}</p>
              )}
            </div>
          </section>

          <section id="acervos" className="scroll-mt-24">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200/65">Packs e coleções</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">Explore os acervos</h2>
                <p className="mt-1 text-sm text-white/45">Capas, faixas e atualizações organizadas para DJs.</p>
              </div>
              <Link href="/musicas/atualizacoes" className="hidden items-center gap-1 text-xs font-semibold text-white/45 transition hover:text-sky-100 sm:inline-flex">Catálogo completo <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            {filteredFolders.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {filteredFolders.slice(0, 12).map((folder, index) => <CatalogCard key={folder.id} folder={folder} index={index} />)}
              </div>
            ) : loading ? (
              <div className="flex min-h-40 items-center justify-center"><MusicasToastLoading label="Carregando acervos…" /></div>
            ) : (
              <p className="rounded-2xl border border-white/[0.07] bg-[#141619] px-4 py-10 text-center text-sm text-white/45">{query ? "Nenhum acervo encontrado para esta busca." : "Nenhum acervo disponível no momento."}</p>
            )}
          </section>

          {(home?.genres.length ?? 0) > 0 ? (
            <section aria-labelledby="estilos-title" className="rounded-2xl border border-white/[0.07] bg-[#141619] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200/65">Explore por categoria</p>
                  <h2 id="estilos-title" className="mt-1 text-lg font-extrabold text-white">Estilos no catálogo</h2>
                </div>
                <Disc3 className="h-5 w-5 text-sky-100/40" aria-hidden />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {home!.genres.slice(0, 12).map((genre) => (
                  <Link key={genre.slug} href={genre.href} className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs font-medium text-white/60 transition hover:border-sky-200/25 hover:bg-sky-200/[0.06] hover:text-sky-50">{genre.name}</Link>
                ))}
              </div>
            </section>
          ) : null}
          <div className="flex justify-center pb-3 sm:hidden">
            <Link href="/musicas/atualizacoes" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sky-200/20 px-4 text-sm font-semibold text-sky-100/80 transition hover:bg-sky-200/[0.06]">Ver catálogo completo <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </main>
      </div>
    </div>
  );
}
