"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Mic2, Search } from "lucide-react";
import { artistsHref, slugifyArtistName } from "../../lib/vip-music-slugs";
import { MusicasArtistGridSkeleton } from "../components/MusicasSkeletons";
import { MusicLibraryTile, libraryTileTone } from "../components/MusicLibraryTiles";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "../components/MusicasSessionContext";

type ArtistListItem = {
  slug: string;
  name: string;
  imageUrl: string | null;
  shortBio: string | null;
  bio: string | null;
  genres?: string[];
  href: string;
  known: boolean;
};

type ListResponse = {
  artists?: ArtistListItem[];
  error?: string;
};

export default function ArtistasPage() {
  const { authenticated, hasVip } = useMusicasSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artists, setArtists] = useState<ArtistListItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    void fetch("/api/musicas/artists", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as ListResponse;
        if (!res.ok) throw new Error(body.error ?? "Erro ao carregar artistas.");
        setArtists(body.artists ?? []);
      })
      .catch((err: Error) => {
        setError(err.message);
        setArtists([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter(
      (artist) =>
        artist.name.toLowerCase().includes(q) ||
        artist.slug.includes(slugifyArtistName(q)) ||
        (artist.genres ?? []).some((genre) => genre.toLowerCase().includes(q)),
    );
  }, [artists, query]);

  function openArtistSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    router.push(artistsHref(slugifyArtistName(q)));
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
        <span className="font-medium text-white">Artistas</span>
      </nav>

      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2a24] via-[#121816] to-[#0c0e0d] px-4 py-5 ring-1 ring-white/10 sm:px-6 sm:py-6">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#1ed760]/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-[#ff6b35]/10 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1ed760]/90">
            Brazilian Remix Service
          </p>
          <h1 className="mt-1.5 font-display text-[28px] font-extrabold tracking-tight text-white sm:text-4xl">
            Artistas
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/55 sm:text-sm">
            Perfis editoriais em álbuns coloridos — toque para abrir bio, gêneros e faixas do acervo.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-black/35 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white/70 ring-1 ring-white/10">
              {loading
                ? "…"
                : `${artists.length} ${artists.length === 1 ? "artista" : "artistas"}`}
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
        onSubmit={openArtistSearch}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar artista ou abrir perfil pelo nome…"
            className="w-full rounded-full border-0 bg-[#242424] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:bg-[#2a2a2a] focus:ring-2 focus:ring-white/10"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black transition-transform hover:scale-[1.01] hover:bg-[#1fdf67]"
        >
          <Mic2 className="h-4 w-4" />
          Abrir perfil
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
          Nenhum artista encontrado para “{query.trim()}”.
        </p>
      ) : (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
            <div>
              <h2 className="text-[17px] font-bold tracking-tight text-white sm:text-[19px]">
                Sua biblioteca de artistas
              </h2>
              <p className="mt-1 text-[13px] text-white/45">
                {filtered.length} {filtered.length === 1 ? "perfil" : "perfis"}
                {query.trim() ? " na busca" : ""}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((artist, index) => (
              <MusicLibraryTile
                key={artist.slug}
                href={artist.href}
                title={artist.name}
                subtitle={artist.genres?.[0] ?? artist.shortBio}
                index={index}
                tone={libraryTileTone(index)}
                imageUrl={artist.imageUrl}
                icon={Mic2}
                round
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
