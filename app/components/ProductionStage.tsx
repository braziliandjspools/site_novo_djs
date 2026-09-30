"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Lock, Pause, Play } from "lucide-react";
import type { PublicBrsProduction } from "../lib/brs-productions";
import { productionDownloadTrack, productionToPreviewTrack } from "../lib/brs-productions";
import { formatStyleNameForDisplay } from "../lib/style-display";
import { startBrowserTrackDownload } from "../musicas/lib/browser-download-file";
import { VipMusicPlayerProvider, useVipMusicPlayer } from "../musicas/components/VipMusicPlayerContext";

const FOLDER_ID = "brs-production";
const BARS = [18, 28, 16, 36, 22, 42, 20, 34, 14, 40, 24, 32, 18, 38, 22, 30, 16, 36, 26, 44, 20, 34, 18, 28];

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
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative mx-auto aspect-square w-full max-w-[440px]">
          <div className="absolute inset-[6%] rounded-full">
            {BARS.map((height, index) => (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 w-1 origin-bottom rounded-full bg-gradient-to-t from-[#1db954] via-[#7eb6ff] to-[#ffe566]"
                style={{
                  height: `${playing ? height : 10}px`,
                  transform: `rotate(${index * (360 / BARS.length)}deg) translateY(-188px)`,
                  opacity: playing ? 0.95 : 0.35,
                  transition: "height 180ms linear",
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={play}
            aria-label={access.canPlay ? `Reproduzir ${production.title}` : "Entrar para ouvir"}
            className="group absolute inset-[16%] overflow-hidden rounded-full border-4 border-[#102033] shadow-[0_0_80px_rgba(0,80,180,0.35)]"
          >
            <Image
              src={production.coverUrl}
              alt=""
              fill
              unoptimized={!production.coverUrl.startsWith("/")}
              sizes="360px"
              className={`object-cover ${playing ? "animate-[spin_8s_linear_infinite]" : ""}`}
            />
            <span className={`absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-[#7eb6ff] transition ${playing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
              {playing ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="ml-1 h-6 w-6" fill="currentColor" />}
            </span>
          </button>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7eb6ff]">Exclusiva BRS</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-white sm:text-6xl">{production.title}</h1>
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
            <button type="button" onClick={play} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1db954] px-5 text-sm font-bold text-black">
              <Play className="h-4 w-4" fill="currentColor" />
              {access.canPlay ? "Ouvir" : "Entrar para ouvir"}
            </button>
            <button type="button" onClick={download} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#7eb6ff]/40 px-5 text-sm font-bold text-white">
              {access.canDownload ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {access.canDownload ? "Baixar" : access.authenticated ? "Membros" : "Entrar para baixar"}
            </button>
          </div>
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
          {production.description?.trim() ? (
            <section className="mt-8 rounded-2xl border border-[#7eb6ff]/30 bg-[linear-gradient(160deg,rgba(0,39,118,0.55),rgba(5,7,13,0.35))] p-5 sm:p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7eb6ff]">Descrição</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-8 text-zinc-100">{production.description.trim()}</p>
            </section>
          ) : null}
        </div>
      </div>
      {more.length > 0 && production.producerSlug ? (
        <section className="mt-16 border-t border-white/10 pt-10 font-[family-name:var(--font-space)]">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7eb6ff]">Do mesmo produtor</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Mais produções</h2>
            </div>
            <Link href={`/p/${production.producerSlug}`} className="text-xs font-bold uppercase tracking-[0.14em] text-[#9ef7c0] hover:text-white">
              Ver perfil
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {more.map((item) => (
              <li key={item.id}>
                <Link href={`/m/${item.slug}`} className="flex items-center gap-4 rounded-2xl border border-[#7eb6ff]/25 bg-[linear-gradient(135deg,rgba(0,39,118,0.45),rgba(5,7,13,0.2))] p-3 transition hover:border-[#7eb6ff]/70">
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#102033]">
                    <Image src={item.coverUrl} alt="" fill unoptimized={!item.coverUrl.startsWith("/")} sizes="64px" className="object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-white">{item.title}</span>
                    <span className="mt-2 inline-flex rounded-md bg-[#002776] px-2 py-0.5 text-[10px] font-bold text-[#d7e7ff]">{item.versionType}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
