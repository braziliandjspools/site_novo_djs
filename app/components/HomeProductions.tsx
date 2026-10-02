"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Lock, Pause, Play } from "lucide-react";
import type { PublicBrsProduction } from "../lib/brs-productions";
import { productionDownloadTrack, productionToPreviewTrack } from "../lib/brs-productions";
import { startBrowserTrackDownload } from "../musicas/lib/browser-download-file";
import { VipMusicPlayerProvider, useVipMusicPlayer } from "../musicas/components/VipMusicPlayerContext";

const FOLDER_ID = "brs-productions";

type Access = { authenticated: boolean; canPlay: boolean; canDownload: boolean };

function loginHref(slug: string) {
  return `/musicas/entrar?return=${encodeURIComponent(`/m/${slug}`)}`;
}

function catalogTone(category: string) {
  if (category === "EQUIPE_BRS") {
    return {
      frame: "from-[#7eb6ff] via-[#1db954] to-[#ffe566]",
      chip: "border-[#7eb6ff]/45 bg-[#002776]/70 text-[#d7e7ff]",
      glow: "hover:shadow-[0_28px_70px_-28px_rgba(107,159,255,0.55)]",
    };
  }
  if (category === "DJ_PARCEIRO") {
    return {
      frame: "from-[#ffe566] via-[#ffb703] to-[#1db954]",
      chip: "border-[#ffe566]/50 bg-[#3a3200]/80 text-[#ffe566]",
      glow: "hover:shadow-[0_28px_70px_-28px_rgba(255,223,0,0.42)]",
    };
  }
  return {
    frame: "from-[#1ed760] via-[#ffe566] to-[#009739]",
    chip: "border-[#1db954]/40 bg-[#063318]/80 text-[#9ef7c0]",
    glow: "hover:shadow-[0_28px_70px_-28px_rgba(29,185,84,0.5)]",
  };
}

function ProductionCard({
  production,
  access,
  fill = false,
  list = false,
}: {
  production: PublicBrsProduction;
  access: Access;
  fill?: boolean;
  list?: boolean;
}) {
  const player = useVipMusicPlayer();
  const router = useRouter();
  const playing = player.playingId === production.audioFileId && player.isPlaying;
  const tone = catalogTone(production.category);
  const date = new Date(production.publishedAt);
  const dateLabel = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");

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

  return (
    <article className={`brs-production-card group/card relative flex h-full min-w-0 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#101311] p-1.5 sm:p-2 shadow-[0_22px_60px_-35px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1 ${tone.glow} ${list ? "w-full flex-row items-stretch" : "flex-col"} ${fill ? "w-full flex-none" : "min-w-0 flex-[0_0_calc(50%_-_6px)] snap-start sm:flex-[0_0_46%] lg:flex-[0_0_23%]"}`}>
      <div className={`rounded-xl bg-gradient-to-br p-[1px] sm:p-[1.5px] ${tone.frame} ${list ? "w-24 shrink-0 self-stretch sm:w-32" : ""}`}>
      <div className={`group relative overflow-hidden rounded-[11px] bg-[#161816] ${list ? "h-full min-h-24 sm:min-h-32" : "aspect-square"}`}>
        <Image
          src={production.coverUrl}
          alt=""
          fill
          unoptimized={!production.coverUrl.startsWith("/")}
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 44vw, 220px"
          className="object-cover transition duration-500 group-hover:scale-[1.05]"
        />
        <button
          type="button"
          onClick={play}
          className={`absolute inset-0 flex items-center justify-center transition ${playing ? "bg-black/35" : "bg-gradient-to-t from-black/35 via-transparent to-transparent group-hover:bg-black/35"}`}
          aria-label={playing ? `Pausar ${production.title}` : access.canPlay ? `Reproduzir ${production.title}` : "Entrar para ouvir"}
        >
          <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-[#1db954] text-black shadow-[0_12px_35px_rgba(29,185,84,0.38)] transition duration-300 ${playing ? "scale-100 opacity-100" : "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"}`}>
            {playing ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" />}
          </span>
        </button>
        {!list && (production.isFeatured || production.isNew) ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[#1db954]/30 bg-black/80 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#72e89c] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1db954] shadow-[0_0_8px_#1db954]" />
            {production.isFeatured ? "Destaque" : "Novo"}
          </span>
        ) : null}
        {!list ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full border border-[#60cdff]/45 bg-[#0b1520]/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#60cdff] shadow-[0_8px_18px_rgba(0,0,0,0.35)] backdrop-blur-md">
            Exclusivas BRS
          </span>
        ) : null}
      </div>
      </div>
      <div className={`flex min-w-0 flex-1 flex-col px-1 pb-1 pt-2.5 sm:px-1.5 sm:pt-4 ${list ? "justify-center pl-3 sm:pl-5" : ""}`}>
        <Link href={`/m/${production.slug}`} title={production.title} className="block truncate whitespace-nowrap text-[12px] font-bold leading-tight tracking-[-0.01em] text-white transition hover:text-[#1ed760] sm:text-[15px] sm:leading-none">
          {production.title}
        </Link>
        {!list ? (
          <>
            <div className="mt-0.5 flex justify-end">
              <span className="rounded-md bg-[#002776] px-1.5 py-0.5 text-[8px] font-bold leading-none text-[#d7e7ff] sm:px-2 sm:text-[10px]">
                {production.versionType}
              </span>
            </div>
            <p className="mt-1 flex min-w-0 items-center whitespace-nowrap text-[10px] text-zinc-400 sm:mt-1.5 sm:text-xs">
              <span className="truncate">
                {production.producerSlug ? (
                  <Link href={`/p/${production.producerSlug}`} className="hover:text-[#1ed760]">
                    {production.producer}
                  </Link>
                ) : (
                  production.producer
                )}
              </span>
            </p>
            <div className="mt-2 flex items-center justify-between gap-1 sm:mt-4 sm:gap-2">
              <span className={`truncate rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] ${tone.chip} sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.13em]`}>
                {production.categoryLabel}
              </span>
              <span className="shrink-0 text-[9px] font-medium uppercase tracking-wider text-white">{dateLabel}</span>
            </div>
          </>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:mt-4 sm:grid-cols-5 sm:gap-4 sm:text-xs">
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">Autor:</span>
              <span className="mt-0.5 block truncate font-semibold text-white">{production.artist || production.producer}</span>
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">Gênero:</span>
              <span className="mt-0.5 block truncate font-semibold text-white">{production.genre || "—"}</span>
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">BPM:</span>
              <span className="mt-0.5 block truncate font-semibold text-white">{production.bpm || "—"}</span>
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">Duração:</span>
              <span className="mt-0.5 block truncate font-semibold text-white">{production.duration || "—"}</span>
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">Versão:</span>
              <span className="mt-0.5 block truncate font-semibold text-white">{production.versionType || "—"}</span>
            </div>
          </div>
        )}
        <div className="mt-auto flex gap-1.5 border-t border-white/[0.07] pt-2 sm:gap-2 sm:pt-3.5">
          <button type="button" onClick={play} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.035] text-[9px] font-bold text-white transition hover:border-[#1db954]/45 hover:bg-[#1db954]/[0.06] sm:h-9 sm:gap-1.5 sm:rounded-xl sm:text-[10px]">
            <Play className="h-3 w-3" fill="currentColor" />
            {access.canPlay ? "Ouvir" : "Entrar"}
          </button>
          {access.canDownload ? (
            <button type="button" onClick={download} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-[#1db954] text-[9px] font-extrabold text-[#06150b] shadow-[0_8px_24px_-10px_rgba(29,185,84,0.9)] transition hover:bg-[#1ed760] sm:h-9 sm:gap-1.5 sm:rounded-xl sm:text-[10px]">
              <Download className="h-3 w-3" /> Baixar
            </button>
          ) : (
            <button type="button" onClick={download} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.035] text-[9px] font-bold text-zinc-400 transition hover:border-[#1db954]/35 sm:h-9 sm:gap-1.5 sm:rounded-xl sm:text-[10px]">
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

  return (
    <article className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.08] px-4 py-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5">
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
        <span className="absolute inset-0 flex items-center justify-center bg-black/0">
          <span className={"flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#2f2f2f] text-white " + (playing ? "opacity-100" : "opacity-0 hover:opacity-100")}>
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
          {production.versionType ? (
            <span className="rounded-[4px] border border-white/10 px-1.5 py-0.5 text-[9px] font-medium text-[#9b9b9b]">
              {production.versionType}
            </span>
          ) : null}
        </div>
      </div>

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
}: {
  productions: PublicBrsProduction[];
  embedded?: boolean;
  layout?: "carousel" | "grid" | "list";
  renderHeaderActions?: (actions: { previous: () => void; next: () => void }) => React.ReactNode;
  headerTitle?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
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
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * (node.clientWidth * 0.8), behavior: "smooth" });
  }

  const rail = (
    <>
      <style>{`
        .brs-production-rail[data-layout="carousel"] .brs-production-card {
          flex: 0 0 calc(50% - 6px);
          width: calc(50% - 6px);
          max-width: calc(50% - 6px);
        }
        .brs-production-rail[data-layout="grid"] .brs-production-card {
          flex: 1 1 auto;
          width: 100%;
          max-width: none;
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
          <h2 className="!m-0 block whitespace-nowrap font-display text-2xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">{headerTitle}</h2>
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
        ref={scroller}
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
            <ProductionCard key={production.id} production={production} access={access} fill={layout === "grid"} />
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
    <section id="producoes-brs" className="relative isolate overflow-hidden border-y border-white/[0.07] bg-[#070908] px-4 py-14 font-[family-name:var(--font-barlow)] sm:px-6 md:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_8%_0%,rgba(29,185,84,0.18),transparent_34%),radial-gradient(ellipse_at_92%_8%,rgba(255,223,0,0.1),transparent_28%),radial-gradient(ellipse_at_70%_100%,rgba(0,39,118,0.24),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[#1db954]/45 to-transparent" />
      <div className="mx-auto max-w-6xl">
        <ProductionRail
            productions={productions}
            embedded={embedded}
            headerTitle={heading}
            renderHeaderActions={({ previous, next }) => (
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" aria-label="Produções anteriores" onClick={previous} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:border-[#1db954]/40 hover:text-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" aria-label="Próximas produções" onClick={next} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:border-[#1db954]/40 hover:text-white">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          />
        <div className="mt-5 flex justify-center sm:mt-6">
          <Link
            href="/discover"
            className="group relative inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full text-center border border-[#1db954]/35 bg-[#1db954]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#8ef0b0] transition hover:-translate-y-0.5 hover:border-[#1db954] hover:bg-[#1db954]/15 hover:text-white"
          >
            Descobrir e baixar todas as produções
            <ChevronRight className="absolute right-4 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
