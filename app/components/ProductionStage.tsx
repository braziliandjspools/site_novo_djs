"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Lock, Pause, Play, Share2 } from "lucide-react";
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

function Sheet({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/10 py-2">
      <dt className="text-[11px] uppercase tracking-[0.16em] text-[#7eb6ff]">{label}</dt>
      <dd className="text-right text-sm text-white">{value}</dd>
    </div>
  );
}

function Stage({ production, more }: { production: PublicBrsProduction; more: PublicBrsProduction[] }) {
  const player = useVipMusicPlayer();
  const router = useRouter();
  const [access, setAccess] = useState({ authenticated: false, canPlay: false, canDownload: false });
  const playing = player.playingId === production.audioFileId && player.isPlaying;

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
    <div className="font-[family-name:var(--font-space)]">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 items-start justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/25 p-3 sm:p-6">
          <button
            type="button"
            onClick={play}
            aria-label={access.canPlay ? `Reproduzir ${production.title}` : "Entrar para ouvir"}
            className="group relative aspect-square w-full max-w-[440px] overflow-hidden rounded-full border border-white/10 shadow-[0_0_60px_rgba(0,80,180,0.22)]"
          >
            <Image
              src={production.coverUrl}
              alt=""
              fill
              unoptimized={!production.coverUrl.startsWith("/")}
              sizes="(max-width: 1024px) 92vw, 440px"
              className={`object-cover ${playing ? "animate-[spin_12s_linear_infinite]" : ""}`}
            />
            <span className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/75 text-[#7eb6ff] opacity-100 shadow-[0_0_30px_rgba(0,0,0,0.45)] transition">
              {playing ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="ml-1 h-6 w-6" fill="currentColor" />}
            </span>
          </button>
        </div>
        {production.description?.trim() ? (
          <section className="rounded-2xl border border-[#7eb6ff]/30 bg-[linear-gradient(160deg,rgba(0,39,118,0.55),rgba(5,7,13,0.35))] p-5 sm:p-6 lg:block">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7eb6ff]">Descrição</h2>
            <p className="mt-4 whitespace-pre-line text-justify text-sm leading-8 text-zinc-100">{production.description.trim()}</p>
          </section>
        ) : null}
        </div>

        <div className="order-2 flex flex-col justify-start rounded-[28px] border border-white/10 bg-black/25 p-6 sm:p-8 lg:order-none">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7eb6ff]">Exclusiva BRS</p>
          <h1 className="mt-3 break-words text-[clamp(1.2rem,2.1vw,1.7rem)] font-bold leading-tight tracking-[-0.03em] text-white" title={production.title}>{production.title}</h1>
          <p className="mt-4 text-sm text-zinc-300">
            {production.producerSlug ? (
              <Link href={`/p/${production.producerSlug}`} className="text-[#9ef7c0] hover:text-white">{production.producer}</Link>
            ) : production.producer}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-md bg-[#002776] px-2 py-1 text-xs font-bold text-[#d7e7ff]">{production.versionType}</span>
            <span className="rounded-md bg-[#1db954]/15 px-2 py-1 text-xs font-bold text-[#9ef7c0]">{production.categoryLabel}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => void share()} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-white/75 transition hover:border-white/20 hover:text-white" aria-label="Compartilhar produção">
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
            <button type="button" onClick={play} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1db954] px-5 text-sm font-bold text-black">
              <Play className="h-4 w-4" fill="currentColor" />
              {access.canPlay ? "Ouvir" : "Entrar para ouvir"}
            </button>
            <button type="button" onClick={download} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#7eb6ff]/40 px-5 text-sm font-bold text-white">
              {access.canDownload ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {access.canDownload ? "Baixar" : access.authenticated ? "Membros" : "Entrar para baixar"}
            </button>
          </div>
          {production.description?.trim() ? (
            <section className="mt-6 rounded-2xl border border-[#7eb6ff]/30 bg-[linear-gradient(160deg,rgba(0,39,118,0.55),rgba(5,7,13,0.35))] p-5 lg:hidden">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7eb6ff]">Descrição</h2>
              <p className="mt-4 whitespace-pre-line text-justify text-sm leading-8 text-zinc-100">{production.description.trim()}</p>
            </section>
          ) : null}
          <dl className="mt-8">
            <Sheet label="Tipo" value={production.versionType} />
            <Sheet label="Duração" value={production.duration} />
            <Sheet label="BPM" value={production.bpm} />
            <Sheet label="Lançamento" value={new Date(production.publishedAt).toLocaleDateString("pt-BR")} />
            <Sheet label="Gênero" value={formatStyleNameForDisplay(production.genre)} />
            <Sheet label="Versão" value={production.versionLabel} />
            <Sheet label="Formato" value={production.format} />
            <Sheet label="Bitrate" value={production.bitrate} />
          </dl>
        </div>
      </div>
      {more.length > 0 && production.producerSlug ? (
        <section className="mt-14 border-t border-white/10 pt-10">
          <ProductionRail
            productions={more}
            embedded
            headerTitle="Do mesmo produtor"
            renderHeaderActions={({ previous, next }) => (
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" aria-label="Produções anteriores" onClick={previous} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:border-[#1db954]/40 hover:text-white">
                  <span className="text-lg leading-none">‹</span>
                </button>
                <button type="button" aria-label="Próximas produções" onClick={next} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:border-[#1db954]/40 hover:text-white">
                  <span className="text-lg leading-none">›</span>
                </button>
              </div>
            )}
          />
          <div className="mt-4 flex justify-end">
            <Link href={`/p/${production.producerSlug}`} className="text-xs font-bold uppercase tracking-[0.14em] text-[#9ef7c0] hover:text-white">Ver perfil do produtor</Link>
          </div>
        </section>
      ) : null}
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
