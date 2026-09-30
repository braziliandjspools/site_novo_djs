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
  return `/musicas/entrar?return=${encodeURIComponent(`/producoes/${slug}`)}`;
}

function ProductionCard({
  production,
  access,
}: {
  production: PublicBrsProduction;
  access: Access;
}) {
  const player = useVipMusicPlayer();
  const router = useRouter();
  const playing = player.playingId === production.audioFileId && player.isPlaying;
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
    <article className="group/card relative w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/[0.10] bg-[linear-gradient(155deg,rgba(255,255,255,0.055),rgba(255,255,255,0.012))] p-2.5 shadow-[0_22px_60px_-35px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1 hover:border-[#1db954]/45 hover:shadow-[0_26px_70px_-32px_rgba(29,185,84,0.28)] sm:w-[46%] lg:w-[calc((100%-3.75rem)/4)]">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#1db954]/70 to-transparent opacity-0 transition group-hover/card:opacity-100" />
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-[#161816] ring-1 ring-inset ring-white/[0.06]">
        <Image
          src={production.coverUrl}
          alt=""
          fill
          unoptimized={!production.coverUrl.startsWith("/")}
          sizes="(max-width: 640px) 78vw, 220px"
          className="object-cover transition duration-500 group-hover:scale-[1.05]"
        />
        <button
          type="button"
          onClick={play}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/35 via-transparent to-transparent transition group-hover:bg-black/35"
          aria-label={access.canPlay ? `Reproduzir ${production.title}` : "Entrar para ouvir"}
        >
          <span className="flex h-14 w-14 scale-90 items-center justify-center rounded-full bg-[#1db954] text-black opacity-0 shadow-[0_12px_35px_rgba(29,185,84,0.38)] transition duration-300 group-hover:scale-100 group-hover:opacity-100">
            {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
          </span>
        </button>
        {production.isFeatured || production.isNew ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[#1db954]/30 bg-black/80 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#72e89c] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1db954] shadow-[0_0_8px_#1db954]" />
            {production.isFeatured ? "Destaque" : "Novo"}
          </span>
        ) : null}
      </div>
      <div className="px-1.5 pb-1 pt-4">
        <Link href={`/producoes/${production.slug}`} className="block truncate text-[15px] font-bold tracking-[-0.01em] text-white transition hover:text-[#1ed760]">
          {production.title}
        </Link>
        <p className="mt-1.5 truncate text-xs text-zinc-400">
          {production.producerSlug ? (
            <Link href={`/produtores/${production.producerSlug}`} className="hover:text-[#1ed760]">
              {production.producer}
            </Link>
          ) : (
            production.producer
          )}
          <span className="mx-1.5 text-zinc-600">·</span>
          {production.versionType}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="truncate rounded-full border border-[#1db954]/20 bg-[#1db954]/[0.07] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-[#72e89c]">
            {production.categoryLabel}
          </span>
          <span className="shrink-0 text-[9px] font-medium uppercase tracking-wider text-zinc-500">{dateLabel}</span>
        </div>
        <div className="mt-4 flex gap-2 border-t border-white/[0.07] pt-3.5">
          <button type="button" onClick={play} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] text-[10px] font-bold text-white transition hover:border-[#1db954]/45 hover:bg-[#1db954]/[0.06]">
            <Play className="h-3 w-3" fill="currentColor" />
            {access.canPlay ? "Ouvir" : "Entrar"}
          </button>
          {access.canDownload ? (
            <button type="button" onClick={download} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1db954] text-[10px] font-extrabold text-[#06150b] shadow-[0_8px_24px_-10px_rgba(29,185,84,0.9)] transition hover:bg-[#1ed760]">
              <Download className="h-3 w-3" /> Baixar
            </button>
          ) : (
            <button type="button" onClick={download} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] text-[10px] font-bold text-zinc-400 transition hover:border-[#1db954]/35">
              <Lock className="h-3 w-3" />
              {access.authenticated ? "Membros" : "Entrar"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Rail({ productions, embedded = false }: { productions: PublicBrsProduction[]; embedded?: boolean }) {
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
    <div className="relative">
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-1 pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {productions.map((production) => (
          <ProductionCard key={production.id} production={production} access={access} />
        ))}
      </div>
      {productions.length > 1 ? (
        <>
          <button type="button" aria-label="Produções anteriores" onClick={() => scrollByCard(-1)} className="absolute -left-5 top-[34%] hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white shadow-xl backdrop-blur-md transition hover:border-[#1db954]/45 hover:text-[#1ed760] lg:flex">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Próximas produções" onClick={() => scrollByCard(1)} className="absolute -right-5 top-[34%] hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white shadow-xl backdrop-blur-md transition hover:border-[#1db954]/45 hover:text-[#1ed760] lg:flex">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>
  );

  if (embedded) return rail;
  return <VipMusicPlayerProvider canPlayFull={access.canPlay}>{rail}</VipMusicPlayerProvider>;
}

export function ProductionDetail({ production }: { production: PublicBrsProduction }) {
  return (
    <div className="max-w-3xl">
      <Rail productions={[production]} />
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
    <section id="producoes-brs" className="relative isolate overflow-hidden border-y border-white/[0.07] bg-[#070908] px-4 py-14 sm:px-6 md:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_0%,rgba(29,185,84,0.14),transparent_38%),radial-gradient(ellipse_at_88%_100%,rgba(0,151,57,0.07),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[#1db954]/45 to-transparent" />
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#72e89c]">
              <span className="h-px w-8 bg-[#1db954]" />
              Catálogo público
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">{heading}</h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-right sm:text-base">
            Remixes, edits, versões exclusivas e produções da nossa equipe e DJs parceiros.
          </p>
        </div>
        <div className="mt-8">
          <Rail productions={productions} embedded={embedded} />
        </div>
      </div>
    </section>
  );
}
