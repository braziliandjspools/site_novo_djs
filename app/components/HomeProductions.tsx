"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Lock, Pause, Play } from "lucide-react";
import type { PublicBrsProduction } from "../lib/brs-productions";
import { productionDownloadTrack, productionToPreviewTrack } from "../lib/brs-productions";
import { startBrowserTrackDownload } from "../musicas/lib/browser-download-file";
import { VipMusicPlayerProvider, useVipMusicPlayer } from "../musicas/components/VipMusicPlayerContext";

const FOLDER_ID = "brs-productions";

type Access = { authenticated: boolean; canPlay: boolean; canDownload: boolean };

function loginHref(slug: string) {
  return `/musicas/entrar?return=${encodeURIComponent(`/m/${slug}`)}`;
}

type CardVariant = "premium" | "producer";

function ProductionCard({
  production,
  access,
  fill = false,
  list = false,
  variant = "premium",
}: {
  production: PublicBrsProduction;
  access: Access;
  fill?: boolean;
  list?: boolean;
  variant?: CardVariant;
}) {
  const player = useVipMusicPlayer();
  const router = useRouter();
  const playing = player.playingId === production.audioFileId && player.isPlaying;
  const date = new Date(production.publishedAt);
  const dateLabel = date
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "");
  const isProducer = variant === "producer";
  const exclusive = production.isFeatured || production.isNew;
  const version = production.versionLabel || production.versionType || null;

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
      albumTitle: "Produções BRS",
    });
    void player.toggleTrack(FOLDER_ID, track.id);
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

  if (list) {
    return (
      <article className="brs-production-card group/card flex w-full flex-row items-stretch overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f12] p-2 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]">
        <div className="relative w-24 shrink-0 self-stretch overflow-hidden rounded-xl bg-[#161816] sm:w-32">
          <Image
            src={production.coverUrl}
            alt=""
            fill
            unoptimized={!production.coverUrl.startsWith("/")}
            sizes="128px"
            className="object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center px-3 sm:px-5">
          <Link
            href={`/m/${production.slug}`}
            title={production.title}
            className="block truncate text-[15px] font-bold text-white transition hover:text-[#60cdff]"
          >
            {production.title}
          </Link>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:grid-cols-5 sm:text-xs">
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">Autor</span>
              <span className="mt-0.5 block truncate font-semibold text-white">
                {production.artist || production.producer}
              </span>
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">Gênero</span>
              <span className="mt-0.5 block truncate font-semibold text-white">{production.genre || "—"}</span>
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">BPM</span>
              <span className="mt-0.5 block truncate font-semibold text-white">{production.bpm || "—"}</span>
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">Duração</span>
              <span className="mt-0.5 block truncate font-semibold text-white">{production.duration || "—"}</span>
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">Versão</span>
              <span className="mt-0.5 inline-flex rounded-md bg-[#141414] px-2 py-0.5 font-semibold text-white">
                {version || "—"}
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`brs-production-card group/card relative flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border transition duration-300 hover:-translate-y-1 ${
        isProducer
          ? "border-[#7eb6ff]/20 bg-[linear-gradient(165deg,#0a1220_0%,#070b14_55%,#05070d_100%)] shadow-[0_24px_60px_-28px_rgba(0,60,140,0.55)] hover:border-[#7eb6ff]/45 hover:shadow-[0_30px_70px_-24px_rgba(80,150,255,0.35)]"
          : "border-white/[0.08] bg-[linear-gradient(180deg,#12151a_0%,#0a0c10_100%)] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.95)] hover:border-[#60cdff]/35 hover:shadow-[0_30px_70px_-24px_rgba(96,205,255,0.28)]"
      } ${fill ? "w-full flex-none" : "min-w-0 flex-[0_0_84%] snap-start min-[480px]:flex-[0_0_68%] sm:flex-[0_0_46%] lg:flex-[0_0_23%]"}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={production.coverUrl}
          alt=""
          fill
          unoptimized={!production.coverUrl.startsWith("/")}
          sizes="(max-width: 480px) 84vw, (max-width: 640px) 68vw, (max-width: 1024px) 44vw, 220px"
          className="object-cover transition duration-700 group-hover/card:scale-[1.06]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <button
          type="button"
          onClick={play}
          className="absolute inset-0 flex items-center justify-center"
          aria-label={
            playing
              ? `Pausar ${production.title}`
              : access.canPlay
                ? `Reproduzir ${production.title}`
                : "Entrar para ouvir"
          }
        >
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full text-black shadow-[0_12px_30px_rgba(0,0,0,0.45)] transition duration-300 ${
              isProducer ? "bg-[#7eb6ff]" : "bg-[#60cdff]"
            } ${playing ? "scale-100 opacity-100" : "scale-100 opacity-100 [@media(hover:hover)]:scale-90 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/card:scale-100 [@media(hover:hover)]:group-hover/card:opacity-100"}`}
          >
            {playing ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
            )}
          </span>
        </button>
        {exclusive ? (
          <span
            className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] backdrop-blur-md ${
              isProducer
                ? "border-[#7eb6ff]/40 bg-[#07111c]/90 text-[#9ec8ff]"
                : "border-[#60cdff]/45 bg-[#0b1520]/90 text-[#60cdff]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isProducer ? "bg-[#7eb6ff]" : "bg-[#60cdff]"}`}
            />
            Exclusivas BRS
          </span>
        ) : null}
        {version ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center rounded-md bg-[#141414] px-2.5 py-1 text-[10px] font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)]">
            {version}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-3.5 pb-3.5 pt-3.5">
        <Link
          href={`/m/${production.slug}`}
          title={production.title}
          className={`block truncate text-[14px] font-bold leading-tight tracking-[-0.02em] text-white transition sm:text-[15px] ${
            isProducer ? "hover:text-[#7eb6ff]" : "hover:text-[#60cdff]"
          }`}
        >
          {production.title}
        </Link>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[12px] text-white/55">
            {production.producerSlug ? (
              <Link
                href={`/p/${production.producerSlug}`}
                className={isProducer ? "hover:text-[#7eb6ff]" : "hover:text-[#60cdff]"}
              >
                {production.producer}
              </Link>
            ) : (
              production.producer
            )}
          </p>
          {version ? (
            <span className="shrink-0 rounded-md bg-[#141414] px-2 py-0.5 text-[10px] font-semibold text-white">
              {version}
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className={`truncate rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
              isProducer
                ? "border-[#7eb6ff]/30 bg-[#7eb6ff]/10 text-[#9ec8ff]"
                : "border-white/10 bg-white/[0.04] text-white/70"
            }`}
          >
            {production.categoryLabel}
          </span>
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-white/40">
            {dateLabel}
          </span>
        </div>
        <div className="mt-auto flex gap-2 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={play}
            className={`inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold text-white transition active:scale-[0.98] ${
              isProducer
                ? "border-[#7eb6ff]/25 bg-[#7eb6ff]/10 hover:bg-[#7eb6ff]/18"
                : "border-white/10 bg-white/[0.04] hover:border-[#60cdff]/40 hover:bg-[#60cdff]/10"
            }`}
          >
            {playing ? <Pause className="h-3 w-3" fill="currentColor" /> : <Play className="h-3 w-3" fill="currentColor" />}
            {playing ? "Pausar" : access.canPlay ? "Ouvir" : "Entrar"}
          </button>
          {production.spotifyUrl ? (
            <a
              href={production.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border text-[10px] font-bold text-white transition ${
                isProducer
                  ? "border-[#1DB954]/35 bg-[#1DB954]/10 hover:bg-[#1DB954]/20"
                  : "border-[#1DB954]/30 bg-[#1DB954]/10 hover:border-[#1DB954]/50 hover:bg-[#1DB954]/15"
              }`}
            >
              <ExternalLink className="h-3 w-3" /> Spotify
            </a>
          ) : null}
          {access.canDownload ? (
            <button
              type="button"
              onClick={download}
              className={`inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[11px] font-extrabold text-black transition active:scale-[0.98] ${
                isProducer ? "bg-[#7eb6ff] hover:bg-[#7eb6ff]/80" : "bg-[#60cdff] hover:bg-[#60cdff]/75"
              }`}
            >
              <Download className="h-3 w-3" /> Baixar
            </button>
          ) : (
            <button
              type="button"
              onClick={download}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-[11px] font-bold text-zinc-400 transition active:scale-[0.98] hover:border-white/20"
            >
              <Lock className="h-3 w-3" />
              {access.authenticated ? "Membros" : "Entrar"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}


function DiscoverProductionRow({
  production,
  access,
}: {
  production: PublicBrsProduction;
  access: Access;
}) {
  const player = useVipMusicPlayer();
  const router = useRouter();
  const playing = player.playingId === production.audioFileId && player.isPlaying;

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
      albumTitle: "Produções BRS",
    });
    void player.toggleTrack(FOLDER_ID, track.id);
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

  const version = production.versionLabel || production.versionType || null;

  return (
    <article className="group/card grid min-w-0 grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.08] px-4 py-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5">
      <button
        type="button"
        onClick={play}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[6px] bg-[#252525] sm:h-[72px] sm:w-[72px]"
        aria-label={playing ? "Pausar " + production.title : access.canPlay ? "Reproduzir " + production.title : "Entrar para ouvir"}
      >
        <Image
          src={production.coverUrl}
          alt=""
          fill
          unoptimized={!production.coverUrl.startsWith("/")}
          sizes="72px"
          className="object-cover"
        />
        <span
          className={`absolute inset-0 flex items-center justify-center bg-black/40 transition ${
            playing ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#60cdff] text-black">
            {playing ? <Pause className="h-3.5 w-3.5" fill="currentColor" /> : <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />}
          </span>
        </span>
      </button>

      <div className="min-w-0">
        <Link
          href={"/m/" + production.slug}
          className="block truncate text-[13px] font-semibold leading-5 text-white hover:text-[#60cdff] sm:text-[14px]"
          title={production.title}
        >
          {production.title}
        </Link>
        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs">
          {production.producerSlug ? (
            <Link
              href={"/p/" + production.producerSlug}
              className="truncate font-medium text-[#cfcfcf] hover:text-[#60cdff] hover:underline"
            >
              {production.producer}
            </Link>
          ) : (
            <span className="truncate font-medium text-[#cfcfcf]">{production.producer}</span>
          )}
          {production.genre ? <span className="text-[#9b9b9b]">•</span> : null}
          {production.genre ? <span className="truncate text-[#9b9b9b]">{production.genre}</span> : null}
          {production.bpm ? <span className="text-[#9b9b9b]">•</span> : null}
          {production.bpm ? <span className="text-[#9b9b9b]">{production.bpm} BPM</span> : null}
          {production.duration ? <span className="text-[#9b9b9b]">•</span> : null}
          {production.duration ? <span className="text-[#9b9b9b]">{production.duration}</span> : null}
          {version ? (
            <span className="rounded-md bg-[#141414] px-1.5 py-0.5 text-[9px] font-semibold text-white">
              {version}
            </span>
          ) : null}
        </div>
      </div>

      {production.spotifyUrl ? (
        <a
          href={production.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[6px] border border-[#94E400]/30 bg-[#94E400]/10 px-3 text-[11px] font-semibold text-[#9ef7c0] hover:bg-[#94E400]/20 sm:px-3.5 sm:text-xs"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Spotify</span>
        </a>
      ) : null}
      <button
        type="button"
        onClick={download}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[6px] border border-white/[0.1] bg-[#2f2f2f] px-3.5 text-[11px] font-semibold text-white hover:bg-[#3a3a3a] sm:px-4 sm:text-xs"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{access.canDownload ? "Baixar" : access.authenticated ? "Assinar" : "Entrar"}</span>
      </button>
    </article>
  );
}

export function ProductionRail({
  productions,
  embedded = false,
  layout = "carousel",
  renderHeaderActions,
  headerTitle,
  variant = "premium",
}: {
  productions: PublicBrsProduction[];
  embedded?: boolean;
  layout?: "carousel" | "grid" | "list";
  renderHeaderActions?: (actions: { previous: () => void; next: () => void }) => React.ReactNode;
  headerTitle?: string;
  variant?: CardVariant;
}) {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [access, setAccess] = useState<Access>({ authenticated: false, canPlay: false, canDownload: false });

  useEffect(() => {
    void fetch("/api/musicas/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { authenticated?: boolean; canPlay?: boolean }) => {
        const can = Boolean(body.authenticated && body.canPlay);
        setAccess({ authenticated: Boolean(body.authenticated), canPlay: can, canDownload: can });
      })
      .catch(() => undefined);
  }, []);

  function scrollByCard(direction: number) {
    if (!scroller) return;
    scroller.scrollBy({ left: direction * (scroller.clientWidth * 0.8), behavior: "smooth" });
  }

  const rail = (
    <>
      <style>{`
        .brs-production-rail[data-layout="carousel"] .brs-production-card {
          flex: 0 0 84%;
          width: 84%;
          max-width: 84%;
        }
        .brs-production-rail[data-layout="grid"] .brs-production-card {
          flex: 1 1 auto;
          width: 100%;
          max-width: none;
        }
        @media (min-width: 480px) {
          .brs-production-rail[data-layout="carousel"] .brs-production-card {
            flex-basis: 68%;
            width: 68%;
            max-width: 68%;
          }
        }
        @media (min-width: 640px) {
          .brs-production-rail[data-layout="carousel"] .brs-production-card {
            flex-basis: 46%;
            width: 46%;
            max-width: 46%;
          }
        }
        @media (min-width: 1024px) {
          .brs-production-rail[data-layout="carousel"] .brs-production-card {
            flex-basis: 23%;
            width: 23%;
            max-width: 23%;
          }
        }
      `}</style>
    <div>
      {headerTitle !== undefined ? (
        <div className="mb-3 flex min-h-10 w-full items-center justify-between gap-4">
          <h2 className="!m-0 block min-w-0 flex-1 font-display text-xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">{headerTitle}</h2>
          {renderHeaderActions ? renderHeaderActions({ previous: () => scrollByCard(-1), next: () => scrollByCard(1) }) : null}
        </div>
      ) : renderHeaderActions ? renderHeaderActions({ previous: () => scrollByCard(-1), next: () => scrollByCard(1) }) : null}
      {!renderHeaderActions && layout === "carousel" && productions.length > 1 ? (
        <div className="mb-3 flex justify-end gap-1">
          <button type="button" aria-label="Produções anteriores" onClick={() => scrollByCard(-1)} className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-white/80">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Próximas produções" onClick={() => scrollByCard(1)} className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-white/80">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : null}
      <div
        ref={setScroller}
        data-layout={layout}
        className={`brs-production-rail min-w-0 ${layout === "grid"
          ? "grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5"
          : layout === "list"
            ? "flex flex-col gap-3 sm:gap-4"
            : "flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-1 pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5"}`}
      >
        {productions.map((production) =>
          layout === "list" ? (
            <DiscoverProductionRow key={production.id} production={production} access={access} />
          ) : (
            <ProductionCard
              key={production.id}
              production={production}
              access={access}
              fill={layout === "grid"}
              variant={variant}
            />
          ),
        )}
      </div>
    </div>
    </>
  );

  if (embedded) return rail;
  return <VipMusicPlayerProvider canPlayFull={access.canPlay}>{rail}</VipMusicPlayerProvider>;
}

export function ProductionDetail({ production }: { production: PublicBrsProduction }) {
  return (
    <div className="max-w-3xl">
      <ProductionRail productions={[production]} />
      {production.description ? (
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-zinc-300">{production.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {production.spotifyUrl ? (
          <a
            href={production.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#94E400]/30 bg-[#94E400]/10 px-4 py-2 text-xs font-bold text-[#9ef7c0] hover:bg-[#94E400]/20"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Spotify
          </a>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-zinc-500">Produzido por {production.producer}</p>
    </div>
  );
}

export function HomeProductions({
  productions,
  heading = "Produções BRS",
  embedded = false,
}: {
  productions: PublicBrsProduction[];
  heading?: string;
  embedded?: boolean;
}) {
  if (productions.length === 0) return null;
  return (
    <section
      id="producoes-brs"
      className="relative isolate overflow-hidden border-y border-white/[0.06] bg-[#06080c] px-4 py-14 font-[family-name:var(--font-barlow)] sm:px-6 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_0%,rgba(96,205,255,0.14),transparent_36%),radial-gradient(ellipse_at_88%_10%,rgba(126,182,255,0.1),transparent_30%),radial-gradient(ellipse_at_50%_100%,rgba(0,0,0,0.55),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[#60cdff]/40 to-transparent" />
      <div className="mx-auto max-w-6xl">
        <ProductionRail
          productions={productions}
          embedded={embedded}
          variant="premium"
          headerTitle={heading}
          renderHeaderActions={({ previous, next }) => (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Produções anteriores"
                onClick={previous}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition active:scale-95 hover:border-[#60cdff]/40 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Próximas produções"
                onClick={next}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition active:scale-95 hover:border-[#60cdff]/40 hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        />
        <div className="mt-5 flex justify-center sm:mt-6">
          <Link
            href="/discover"
            className="group relative inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-full border border-[#60cdff]/35 bg-[#60cdff]/10 px-5 py-3.5 pr-11 text-center text-[13px] font-bold leading-snug text-[#9adfff] transition active:scale-[0.98] hover:border-[#60cdff] hover:bg-[#60cdff]/15 hover:text-white sm:max-w-xs sm:text-xs sm:font-black sm:uppercase sm:tracking-[0.12em]"
          >
            Descobrir e baixar todas as produções
            <ChevronRight className="absolute right-4 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
