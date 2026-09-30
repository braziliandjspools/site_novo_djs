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
    <article className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-4rem)/5)]">
      <div className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#222]">
        <Image
          src={production.coverUrl}
          alt=""
          fill
          unoptimized={!production.coverUrl.startsWith("/")}
          sizes="(max-width: 640px) 78vw, 220px"
          className="object-cover transition duration-300 group-hover:scale-[1.04]"
        />
        <button
          type="button"
          onClick={play}
          className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/45"
          aria-label={access.canPlay ? `Reproduzir ${production.title}` : "Entrar para ouvir"}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff2ea6] text-black opacity-0 shadow-lg transition group-hover:opacity-100">
            {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
          </span>
        </button>
        {production.isFeatured || production.isNew ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#ff2ea6]">
            {production.isFeatured ? "Destaque" : "Novo"}
          </span>
        ) : null}
      </div>
      <Link href={`/producoes/${production.slug}`} className="mt-3 block truncate text-sm font-bold uppercase tracking-wide text-white hover:text-[#ff8ac8]">
        {production.title}
      </Link>
      <p className="truncate text-xs text-zinc-400">
        {production.producerSlug ? (
          <Link href={`/produtores/${production.producerSlug}`} className="hover:text-[#ff8ac8]">
            {production.producer}
          </Link>
        ) : (
          production.producer
        )}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-zinc-500">{production.versionType}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#ff8ac8]">
          {production.categoryLabel}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">{dateLabel}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={play} className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full border border-white/15 text-[10px] font-bold uppercase tracking-wider text-white">
          <Play className="h-3 w-3" fill="currentColor" />
          {access.canPlay ? "Reproduzir" : "Entrar para ouvir"}
        </button>
        {access.canDownload ? (
          <button type="button" onClick={download} className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-[#ff2ea6] text-[10px] font-bold uppercase tracking-wider text-black">
            <Download className="h-3 w-3" /> Baixar
          </button>
        ) : (
          <button type="button" onClick={download} className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full border border-white/15 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            <Lock className="h-3 w-3" />
            {access.authenticated ? "Disponível para membros" : "Entrar para baixar"}
          </button>
        )}
      </div>
    </article>
  );
}

function Rail({ productions }: { productions: PublicBrsProduction[] }) {
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

  return (
    <VipMusicPlayerProvider canPlayFull={access.canPlay}>
    <div className="relative">
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {productions.map((production) => (
          <ProductionCard key={production.id} production={production} access={access} />
        ))}
      </div>
      {productions.length > 1 ? (
        <>
          <button type="button" aria-label="Produções anteriores" onClick={() => scrollByCard(-1)} className="absolute -left-3 top-[28%] hidden h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#1a1a1a] text-white lg:flex">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Próximas produções" onClick={() => scrollByCard(1)} className="absolute -right-3 top-[28%] hidden h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#1a1a1a] text-white lg:flex">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>
    </VipMusicPlayerProvider>
  );
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
}: {
  productions: PublicBrsProduction[];
  heading?: string;
}) {
  if (productions.length === 0) return null;
  return (
    <section id="producoes-brs" className="border-y border-white/5 bg-[#1a1a1a] px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff2ea6]">Catálogo</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">{heading}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Remixes, edits, versões exclusivas e produções da nossa equipe e DJs parceiros.
        </p>
        <div className="mt-8">
          <Rail productions={productions} />
        </div>
      </div>
    </section>
  );
}
