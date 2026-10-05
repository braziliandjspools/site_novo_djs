"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Lock, Pause, Play, Share2 } from "lucide-react";
import type { PublicBrsProduction } from "../lib/brs-productions";
import { productionDownloadTrack, productionToPreviewTrack } from "../lib/brs-productions";
import { ProductionRail } from "./HomeProductions";
import { formatStyleNameForDisplay } from "../lib/style-display";
import { startBrowserTrackDownload } from "../musicas/lib/browser-download-file";
import { VipMusicPlayerProvider, useVipMusicPlayer } from "../musicas/components/VipMusicPlayerContext";

const FOLDER_ID = "brs-production";

function loginHref(slug: string) {
  return `/musicas/entrar?return=${encodeURIComponent(`/m/${slug}`)}`;
}

function MetaFact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-white">{value}</dd>
    </div>
  );
}

function Stage({ production, more }: { production: PublicBrsProduction; more: PublicBrsProduction[] }) {
  const player = useVipMusicPlayer();
  const router = useRouter();
  const [access, setAccess] = useState({ authenticated: false, canPlay: false, canDownload: false });
  const [ready, setReady] = useState(false);
  const playing = player.playingId === production.audioFileId && player.isPlaying;
  const genre = formatStyleNameForDisplay(production.genre);
  const releaseDate = new Date(production.publishedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const supportLine = [genre, production.bpm, production.duration].filter(Boolean).join(" · ");

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    void fetch("/api/musicas/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { authenticated?: boolean; canPlay?: boolean }) => {
        const can = Boolean(body.authenticated && body.canPlay);
        setAccess({ authenticated: Boolean(body.authenticated), canPlay: can, canDownload: can });
      })
      .catch(() => undefined);
  }, []);

  function play() {
    if (!access.canPlay) {
      router.push(loginHref(production.slug));
      return;
    }
    const track = productionToPreviewTrack(production);
    player.registerTrackMeta(track);
    player.setFolderPlayback(FOLDER_ID, {
      tracks: [track],
      hasMore: false,
      loadMore: async () => undefined,
      coverUrl: production.coverUrl,
      albumTitle: production.title,
    });
    void player.toggleTrack(FOLDER_ID, track.id);
  }

  async function share() {
    try {
      await navigator.share?.({
        title: production.title,
        text: `${production.producer} — ${production.title}`,
        url: window.location.href,
      });
    } catch {
      // compartilhamento cancelado
    }
  }

  function download() {
    if (!access.authenticated) {
      router.push(loginHref(production.slug));
      return;
    }
    if (!access.canDownload) {
      router.push("/plans");
      return;
    }
    startBrowserTrackDownload(productionDownloadTrack(production));
  }

  return (
    <div className="relative font-[family-name:var(--font-sora)] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[min(92vh,880px)] overflow-hidden">
        <Image
          src={production.coverUrl}
          alt=""
          fill
          priority
          unoptimized={!production.coverUrl.startsWith("/")}
          sizes="100vw"
          className={`object-cover scale-110 blur-2xl transition duration-[1.2s] ease-out ${
            ready ? "opacity-45" : "opacity-0"
          } ${playing ? "saturate-125" : "saturate-75"}`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.35)_0%,rgba(5,5,5,0.72)_42%,#050505_88%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(96,205,255,0.14),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:pt-16">
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
          <button
            type="button"
            onClick={play}
            aria-label={access.canPlay ? `Reproduzir ${production.title}` : "Entrar para ouvir"}
            className={`group relative mx-auto aspect-square w-full max-w-[460px] overflow-hidden bg-black shadow-[0_40px_100px_-40px_rgba(0,0,0,0.95)] transition duration-700 ease-out lg:mx-0 ${
              ready ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            } ${playing ? "ring-1 ring-[#60cdff]/50" : "ring-1 ring-white/10"}`}
          >
            <Image
              src={production.coverUrl}
              alt=""
              fill
              priority
              unoptimized={!production.coverUrl.startsWith("/")}
              sizes="(max-width: 1024px) 92vw, 460px"
              className={`object-cover transition duration-700 ${playing ? "scale-[1.03]" : "scale-100 group-hover:scale-[1.02]"}`}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
            <span
              className={`absolute inset-0 m-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-md transition duration-300 ${
                playing
                  ? "opacity-100 scale-100"
                  : "opacity-100 scale-100 group-hover:border-[#60cdff]/50 group-hover:bg-black/70 group-hover:text-[#8ad4ff]"
              }`}
            >
              {playing ? (
                <Pause className="h-7 w-7" fill="currentColor" />
              ) : (
                <Play className="ml-1 h-7 w-7" fill="currentColor" />
              )}
            </span>
          </button>

          <div
            className={`min-w-0 transition duration-700 delay-100 ease-out ${
              ready ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-[#8ad4ff] sm:text-[0.78rem]">
              Brazilian Remix Service
            </p>
            <h1 className="mt-4 max-w-[22ch] font-[family-name:var(--font-sora)] text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:max-w-[26ch]">
              {production.title}
            </h1>
            <p className="mt-4 text-base text-white/70 sm:text-lg">
              {production.producerSlug ? (
                <Link
                  href={`/p/${production.producerSlug}`}
                  className="font-medium text-white transition hover:text-[#8ad4ff]"
                >
                  {production.producer}
                </Link>
              ) : (
                <span className="font-medium text-white">{production.producer}</span>
              )}
              <span className="text-white/35"> · </span>
              <span>{production.versionType}</span>
              <span className="text-white/35"> · </span>
              <span>{production.categoryLabel}</span>
            </p>
            {supportLine ? <p className="mt-2 text-sm text-white/45">{supportLine}</p> : null}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={play}
                className="inline-flex h-12 items-center gap-2 bg-white px-6 text-sm font-bold text-black transition hover:bg-[#8ad4ff]"
              >
                {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
                {playing ? "Pausar" : access.canPlay ? "Ouvir agora" : "Entrar para ouvir"}
              </button>
              <button
                type="button"
                onClick={download}
                className="inline-flex h-12 items-center gap-2 border border-white/20 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:border-[#60cdff]/45 hover:bg-[#60cdff]/10 hover:text-[#8ad4ff]"
              >
                {access.canDownload ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {access.canDownload ? "Baixar" : access.authenticated ? "Disponível para membros" : "Entrar para baixar"}
              </button>
              <button
                type="button"
                onClick={() => void share()}
                className="inline-flex h-12 w-12 items-center justify-center border border-white/15 text-white/70 transition hover:border-white/30 hover:text-white"
                aria-label="Compartilhar produção"
              >
                <Share2 className="h-4 w-4" />
              </button>
              {production.spotifyUrl ? (
                <a
                  href={production.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 border border-white/15 px-4 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                  Spotify
                </a>
              ) : null}
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-8 sm:grid-cols-4">
              <MetaFact label="Lançamento" value={releaseDate} />
              <MetaFact label="Gênero" value={genre} />
              <MetaFact label="BPM" value={production.bpm} />
              <MetaFact label="Duração" value={production.duration} />
            </dl>
          </div>
        </section>

        {(production.description?.trim() || production.format || production.bitrate || production.versionLabel) && (
          <section
            className={`mt-16 max-w-3xl transition duration-700 delay-200 ease-out sm:mt-20 ${
              ready ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            {production.description?.trim() ? (
              <>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8ad4ff]">Sobre a faixa</h2>
                <p className="mt-5 whitespace-pre-line text-base leading-8 text-white/75">
                  {production.description.trim()}
                </p>
              </>
            ) : null}
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/55">
              {production.versionLabel ? (
                <div>
                  <dt className="inline text-white/35">Versão </dt>
                  <dd className="inline text-white/80">{production.versionLabel}</dd>
                </div>
              ) : null}
              {production.format ? (
                <div>
                  <dt className="inline text-white/35">Formato </dt>
                  <dd className="inline text-white/80">{production.format}</dd>
                </div>
              ) : null}
              {production.bitrate ? (
                <div>
                  <dt className="inline text-white/35">Bitrate </dt>
                  <dd className="inline text-white/80">{production.bitrate}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        )}

        {more.length > 0 && production.producerSlug ? (
          <section className="mt-20 border-t border-white/10 pt-12">
            <ProductionRail
              productions={more}
              embedded
              variant="premium"
              headerTitle="Do mesmo produtor"
              renderHeaderActions={({ previous, next }) => (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    aria-label="Produções anteriores"
                    onClick={previous}
                    className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-white/70 transition hover:border-[#60cdff]/40 hover:text-white"
                  >
                    <span className="text-lg leading-none">‹</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Próximas produções"
                    onClick={next}
                    className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-white/70 transition hover:border-[#60cdff]/40 hover:text-white"
                  >
                    <span className="text-lg leading-none">›</span>
                  </button>
                </div>
              )}
            />
            <div className="mt-6 flex justify-end">
              <Link
                href={`/p/${production.producerSlug}`}
                className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8ad4ff] transition hover:text-white"
              >
                Ver perfil do produtor
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function ProductionStage({ production, more }: { production: PublicBrsProduction; more: PublicBrsProduction[] }) {
  const [canPlay, setCanPlay] = useState(false);
  useEffect(() => {
    void fetch("/api/musicas/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { authenticated?: boolean; canPlay?: boolean }) => setCanPlay(Boolean(body.authenticated && body.canPlay)))
      .catch(() => setCanPlay(false));
  }, []);
  return (
    <VipMusicPlayerProvider canPlayFull={canPlay}>
      <Stage production={production} more={more} />
    </VipMusicPlayerProvider>
  );
}
