"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Disc3,
  Download,
  ExternalLink,
  FileAudio,
  Gauge,
  Lock,
  Music2,
  Pause,
  Play,
  Share2,
} from "lucide-react";
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

function VinylTicks() {
  const ticks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const angle = (i * 6 * Math.PI) / 180;
        const inner = 56;
        const outer = i % 5 === 0 ? 24 : 34;
        const cx = 160;
        const cy = 160;
        return {
          x1: cx + Math.sin(angle) * inner,
          y1: cy - Math.cos(angle) * inner,
          x2: cx + Math.sin(angle) * outer,
          y2: cy - Math.cos(angle) * outer,
        };
      }),
    [],
  );

  return (
    <svg viewBox="0 0 320 320" className="absolute inset-0 size-full text-white/20" aria-hidden>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {ticks.map((tick, index) => (
          <line key={index} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} />
        ))}
      </g>
    </svg>
  );
}

function MetaChip({
  icon,
  children,
  className = "",
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <li className={`inline-flex items-center gap-1.5 text-xs text-white/50 ${className}`}>
      <span className="text-white/35">{icon}</span>
      {children}
    </li>
  );
}

function SpecItem({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <li className="flex min-w-0 flex-col gap-1 border-b border-white/[0.06] py-3 last:border-b-0 sm:border-b-0 sm:py-0">
      <span className="font-[family-name:var(--font-space)] text-[0.6rem] uppercase tracking-[0.16em] text-white/40">
        {label}
      </span>
      <span className="truncate text-sm font-medium text-white/90">{value}</span>
    </li>
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
  const eyebrow = ["Catálogo", genre, production.categoryLabel].filter(Boolean).join(" · ");
  const version = production.versionLabel || production.versionType;

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
    <div className="relative isolate min-h-[70vh] font-[family-name:var(--font-sora)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 scale-125 bg-cover bg-center opacity-25 blur-3xl transition duration-1000"
        style={{ backgroundImage: `url(${production.coverUrl})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_15%,rgba(96,205,255,0.14),transparent_46%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="mx-auto w-full max-w-[2000px] px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao catálogo
          </Link>
          <p className="hidden truncate font-[family-name:var(--font-space)] text-[0.6rem] uppercase tracking-[0.18em] text-white/40 sm:block">
            {eyebrow}
          </p>
        </div>

        <div
          className={`grid grid-cols-1 items-center gap-8 transition duration-700 ease-out md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10 lg:gap-14 ${
            ready ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <div className="flex min-w-0 items-center justify-center py-4 md:justify-start md:py-6">
            <div className="group/vinyl relative aspect-square w-full max-w-[min(64vw,20rem)]">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full opacity-[0.18] [background:repeating-radial-gradient(circle_at_center,transparent_0_5px,rgba(255,255,255,0.18)_5px_6px)]"
              />
              <VinylTicks />
              <div className="absolute top-1/2 left-1/2 size-[58%] -translate-x-1/2 -translate-y-1/2">
                <div
                  className={`size-full overflow-hidden rounded-full ring-1 ring-white/15 shadow-[0_0_90px_-24px_rgba(96,205,255,0.48)] ${
                    playing ? "animate-[spin_22s_linear_infinite]" : ""
                  }`}
                >
                  <div className="relative size-full overflow-hidden rounded-full bg-gradient-to-br from-[#60cdff]/35 via-[#0a1520] to-[#050505]">
                    <Image
                      src={production.coverUrl}
                      alt=""
                      fill
                      priority
                      unoptimized={!production.coverUrl.startsWith("/")}
                      sizes="200px"
                      className="object-cover"
                    />
                    <div aria-hidden className="absolute -top-8 -right-8 size-2/3 rounded-full bg-[#60cdff]/12 blur-3xl" />
                    <div aria-hidden className="absolute -bottom-10 -left-6 size-1/2 rounded-full bg-white/8 blur-3xl" />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={play}
                aria-label={access.canPlay ? `Ouvir ${production.title}` : "Entrar para ouvir"}
                className="absolute top-1/2 left-1/2 z-10 inline-grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black/85 hover:text-[#8ad4ff] hover:ring-[#60cdff]/40"
              >
                {playing ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="ml-0.5 h-6 w-6" fill="currentColor" />}
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col">
            <p className="font-[family-name:var(--font-space)] text-[0.6rem] uppercase tracking-[0.18em] text-white/40 sm:hidden">
              {eyebrow}
            </p>
            <h1 className="mt-3 line-clamp-3 text-[clamp(2rem,4.5vw,3.75rem)] font-semibold leading-[0.98] tracking-tight text-balance break-words text-white md:mt-0">
              {production.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              {production.producerSlug ? (
                <Link
                  href={`/p/${production.producerSlug}`}
                  className="w-fit text-sm text-white/55 underline-offset-4 transition hover:text-white hover:underline"
                >
                  {production.producer}
                </Link>
              ) : (
                <span className="text-sm text-white/55">{production.producer}</span>
              )}
              {production.duration ? (
                <span className="font-[family-name:var(--font-space)] text-[0.65rem] uppercase tracking-[0.14em] text-white/35">
                  Prévia · {production.duration}
                </span>
              ) : null}
            </div>

            <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              {production.duration ? (
                <MetaChip icon={<Clock3 className="h-3.5 w-3.5" />}>{production.duration}</MetaChip>
              ) : null}
              {production.bpm ? (
                <MetaChip icon={<Gauge className="h-3.5 w-3.5" />}>{production.bpm}</MetaChip>
              ) : null}
              {genre ? <MetaChip icon={<Music2 className="h-3.5 w-3.5" />}>{genre}</MetaChip> : null}
              {version ? <MetaChip icon={<Disc3 className="h-3.5 w-3.5" />}>{version}</MetaChip> : null}
              {production.format ? (
                <MetaChip icon={<FileAudio className="h-3.5 w-3.5" />} className="hidden sm:inline-flex">
                  {production.format}
                </MetaChip>
              ) : null}
              <MetaChip icon={<CalendarDays className="h-3.5 w-3.5" />} className="hidden sm:inline-flex">
                {releaseDate}
              </MetaChip>
            </ul>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={play}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#60cdff] px-5 text-sm font-semibold text-[#061018] transition hover:bg-[#8ad4ff] sm:flex-none sm:px-6"
              >
                {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
                {playing ? "Pausar" : access.canPlay ? "Ouvir agora" : "Entrar para ouvir"}
              </button>
              <button
                type="button"
                onClick={download}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm font-medium text-white transition hover:border-[#60cdff]/40 hover:bg-[#60cdff]/10 hover:text-[#8ad4ff] sm:flex-none sm:px-5"
              >
                {access.canDownload ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {access.canDownload ? "Baixar" : access.authenticated ? "Membros" : "Entrar para baixar"}
              </button>
              <button
                type="button"
                onClick={() => void share()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/30 hover:text-white"
                aria-label="Compartilhar produção"
              >
                <Share2 className="h-4 w-4" />
              </button>
              {production.spotifyUrl ? (
                <a
                  href={production.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/30 hover:text-white"
                  aria-label="Abrir no Spotify"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <section
          aria-label="Ficha técnica"
          className={`mt-10 rounded-2xl border border-white/10 bg-[#0c0e12]/95 p-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur-md transition duration-700 delay-100 min-[950px]:p-6 ${
            ready ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <h2 className="text-lg font-semibold text-white">Ficha técnica</h2>
          <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <SpecItem label="Duração" value={production.duration} />
            <SpecItem label="BPM" value={production.bpm?.replace(/\s*BPM$/i, "") || null} />
            <SpecItem label="Gênero" value={genre} />
            <SpecItem label="Versão" value={version} />
            <SpecItem label="Formato" value={production.format} />
            <SpecItem label="Lançamento" value={releaseDate} />
            {production.bitrate ? <SpecItem label="Bitrate" value={production.bitrate} /> : null}
          </ul>
          {production.description?.trim() ? (
            <p className="mt-6 max-w-3xl whitespace-pre-line border-t border-white/[0.06] pt-5 text-sm leading-7 text-white/60">
              {production.description.trim()}
            </p>
          ) : null}
        </section>

        {more.length > 0 && production.producerSlug ? (
          <section aria-label="Mais deste produtor" className="mt-12 min-w-0">
            <ProductionRail
              productions={more}
              embedded
              variant="premium"
              headerTitle="Mais deste produtor"
              renderHeaderActions={() => (
                <Link
                  href={`/p/${production.producerSlug}`}
                  className="group/link inline-flex items-center gap-1 font-[family-name:var(--font-space)] text-[0.6rem] uppercase tracking-[0.16em] text-white/45 transition hover:text-[#8ad4ff]"
                >
                  Ver todas
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
                </Link>
              )}
            />
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
