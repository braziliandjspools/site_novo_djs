"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Mic2, Search } from "lucide-react";
import { artistsHref, slugifyArtistName } from "../../lib/vip-music-slugs";
import { CollectionHero } from "../components/CollectionHero";
import { MusicasListSkeleton } from "../components/MusicasSkeletons";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "../components/MusicasSessionContext";
import { MUSICAS_HERO_COVER_SRC } from "../lib/musicas-hero-art";

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
        artist.name.toLowerCase().includes(q) || artist.slug.includes(slugifyArtistName(q)),
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
          className="font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Atualizações
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-white">Artistas</span>
      </nav>

      <CollectionHero
        title="Artistas"
        eyebrow="Acervo VIP"
        description="Perfis editoriais dos grandes nomes da música brasileira e da DJ culture — com bio, gêneros e faixas do acervo."
        hasVip={hasVip}
        stats={
          loading
            ? [{ label: "Carregando…" }]
            : [
                {
                  label: `${artists.length} ${artists.length === 1 ? "artista" : "artistas"} em destaque`,
                },
                { label: "Clique no nome na lista de faixas" },
                {
                  label: hasVip ? "Premium ativo" : "Só navegação",
                  accent: hasVip,
                },
              ]
        }
      />

      {!hasVip && authenticated && <VipUpgradeBanner />}
      {!authenticated && <VipUpgradeBanner />}

      <form
        onSubmit={openArtistSearch}
        className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#141816] p-3 sm:flex-row sm:items-center"
      >
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar artista ou abrir perfil pelo nome…"
            className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#1ed760]/40"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1ed760] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-90"
        >
          <Mic2 className="h-3.5 w-3.5" />
          Abrir perfil
        </button>
      </form>

      {loading ? (
        <MusicasListSkeleton rows={8} />
      ) : error ? (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
          {error}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((artist) => {
            const cover = artist.imageUrl?.trim() || MUSICAS_HERO_COVER_SRC;
            return (
              <Link
                key={artist.slug}
                href={artist.href}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#141816] transition-colors hover:border-[#1ed760]/35 hover:bg-[#1ed760]/5"
              >
                <div className="relative aspect-square overflow-hidden bg-black/40">
                  <Image
                    src={cover}
                    alt={artist.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="200px"
                    unoptimized={cover.startsWith("/api/")}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
                <div className="px-3 py-3">
                  <p className="truncate text-sm font-bold text-white group-hover:text-[#1ed760]">
                    {artist.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/45">
                    {artist.shortBio?.trim() || artist.bio?.trim() || artist.slug}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
