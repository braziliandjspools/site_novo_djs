"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ExternalLink, MapPin, Mic2, Music2 } from "lucide-react";
import type { PreviewTrack } from "../../../lib/google-drive";
import { MusicasTracksSkeleton } from "../../components/MusicasSkeletons";
import { VipMusicTrackList } from "../../components/VipMusicTrackList";
import { SendPackToDownloaderButton } from "../../components/SendPackToDownloaderButton";
import { VipUpgradeBanner } from "../../VipUpgradeGate";
import { useMusicasSession } from "../../components/MusicasSessionContext";
import { MUSICAS_HERO_COVER_SRC } from "../../lib/musicas-hero-art";

type ArtistTrack = PreviewTrack & {
  styleFolderId?: string;
  styleName?: string;
  relativePath?: string;
};

type ArtistProfileResponse = {
  slug?: string;
  name?: string;
  imageUrl?: string | null;
  shortBio?: string | null;
  bio?: string | null;
  genres?: string[];
  origin?: string | null;
  yearsActive?: string | null;
  notableWorks?: string[];
  aliases?: string[];
  spotifyUrl?: string | null;
  known?: boolean;
  trackCount?: number;
  tracks?: ArtistTrack[];
  error?: string;
  canPlay?: boolean;
  canDownload?: boolean;
};

export function ArtistaSlugClient({ slug }: { slug: string }) {
  const { authenticated, hasVip } = useMusicasSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ArtistProfileResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetch(`/api/musicas/artists/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as ArtistProfileResponse;
        if (!res.ok) throw new Error(body.error ?? "Erro ao carregar artista.");
        if (!cancelled) setProfile(body);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const tracks = useMemo(() => profile?.tracks ?? [], [profile?.tracks]);
  const cover = profile?.imageUrl?.trim() || MUSICAS_HERO_COVER_SRC;
  const title = profile?.name ?? slug;
  const folderId = `artist:${slug}`;
  const playbackEnabled = Boolean(profile?.canPlay);
  const downloadEnabled = Boolean(profile?.canDownload ?? profile?.canPlay);
  const genres = profile?.genres ?? [];
  const notableWorks = profile?.notableWorks ?? [];
  const bioParagraphs = (profile?.bio ?? "")
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

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
        <Link
          href="/musicas/artistas"
          className="font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Artistas
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-white">{title}</span>
      </nav>

      {loading ? (
        <div className="space-y-6" aria-busy="true">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2a24] via-[#121816] to-[#0c0e0d] px-4 py-8 ring-1 ring-white/10 sm:px-7 sm:py-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="mx-auto h-40 w-40 animate-pulse rounded-full bg-white/10 sm:mx-0 sm:h-48 sm:w-48" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="mx-auto h-3 w-28 animate-pulse rounded bg-white/10 sm:mx-0" />
                <div className="mx-auto h-10 w-2/3 max-w-sm animate-pulse rounded bg-white/10 sm:mx-0" />
                <div className="mx-auto h-4 w-full max-w-lg animate-pulse rounded bg-white/10 sm:mx-0" />
                <div className="flex justify-center gap-2 sm:justify-start">
                  <div className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
                  <div className="h-7 w-24 animate-pulse rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          </div>
          <MusicasTracksSkeleton rows={8} />
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
          {error}
        </p>
      ) : (
        <>
          <section className="relative mb-2 overflow-hidden rounded-xl">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <Image
                src={cover}
                alt=""
                fill
                priority
                sizes="100vw"
                className="scale-110 object-cover object-center opacity-40 blur-2xl"
                unoptimized={cover.startsWith("/api/")}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-black/20" />
            </div>

            <div className="relative z-10 flex flex-col gap-5 px-4 py-8 sm:flex-row sm:items-end sm:gap-7 sm:px-7 sm:py-10">
              <div className="relative mx-auto h-40 w-40 flex-shrink-0 overflow-hidden rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.55)] ring-2 ring-white/15 sm:mx-0 sm:h-48 sm:w-48 md:h-52 md:w-52">
                <Image
                  src={cover}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="208px"
                  priority
                  unoptimized={cover.startsWith("/api/")}
                />
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1ed760]">
                  <Mic2 className="h-3.5 w-3.5" />
                  {profile?.known ? "Artista conhecido" : "Perfil"}
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-player)] text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                  {title}
                </h1>
                {profile?.shortBio ? (
                  <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-white/80">
                    {profile.shortBio}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/50 sm:justify-start">
                  {profile?.origin ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {profile.origin}
                    </span>
                  ) : null}
                  {profile?.yearsActive ? <span>{profile.yearsActive}</span> : null}
                </div>
                {genres.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                    {genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/65"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70">
                    {profile?.trackCount ?? 0}{" "}
                    {(profile?.trackCount ?? 0) === 1 ? "faixa" : "faixas"}
                  </span>
                  {hasVip ? (
                    <span className="rounded-full border border-[#1ed760]/30 bg-[#1ed760]/10 px-3 py-1.5 text-xs font-semibold text-[#1ed760]">
                      Premium ativo
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/50">
                      Só navegação
                    </span>
                  )}
                  {downloadEnabled && (profile?.trackCount ?? 0) > 0 ? (
                    <SendPackToDownloaderButton
                      slug={profile?.slug ?? slug}
                      kind="artist"
                      label="Enviar artista ao Downloader"
                      className="!rounded-full !px-3 !py-1.5 !text-xs"
                    />
                  ) : null}
                  {profile?.spotifyUrl ? (
                    <a
                      href={profile.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-[#1ed760]/35 hover:text-[#1ed760]"
                    >
                      Spotify
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {profile?.known && (bioParagraphs.length > 0 || notableWorks.length > 0) ? (
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
              {bioParagraphs.length > 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#141816] px-5 py-5">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1ed760]">
                    Sobre
                  </h2>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/70">
                    {bioParagraphs.map((paragraph) => (
                      <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ) : null}
              {notableWorks.length > 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#141816] px-5 py-5">
                  <h2 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1ed760]">
                    <Music2 className="h-3.5 w-3.5" />
                    Obras de referência
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {notableWorks.map((work) => (
                      <li
                        key={work}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm font-medium text-white/80"
                      >
                        {work}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : !profile?.known ? (
            <p className="rounded-2xl border border-white/10 bg-[#141816] px-4 py-4 text-sm leading-relaxed text-white/55">
              Faixas do acervo cujo crédito de artista bate com{" "}
              <span className="font-semibold text-white/80">{slug}</span>.
            </p>
          ) : null}

          {!hasVip && authenticated && <VipUpgradeBanner />}
          {!authenticated && <VipUpgradeBanner />}

          <div>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
              No acervo
            </h2>
            {tracks.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-[#141816] px-4 py-10 text-center text-sm text-white/50">
                Nenhuma faixa encontrada com este artista no acervo varrido.
              </p>
            ) : (
              <VipMusicTrackList
                folderId={folderId}
                tracks={tracks}
                canPlay={playbackEnabled}
                canDownload={downloadEnabled}
                albumTitle={title}
                coverUrl={cover}
                layout="table"
                groupByDate={false}
                embedded
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
