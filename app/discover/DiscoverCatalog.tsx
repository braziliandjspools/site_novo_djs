"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Download, Heart, Lock, Pause, Play } from "lucide-react";
import type { PublicBrsProduction } from "../lib/brs-productions";
import { productionDownloadTrack, productionToPreviewTrack } from "../lib/brs-productions";
import { startBrowserTrackDownload } from "../musicas/lib/browser-download-file";
import { VipMusicPlayerProvider, useVipMusicPlayer } from "../musicas/components/VipMusicPlayerContext";

const FOLDER_ID = "brs-productions-discover";

type Access = { authenticated: boolean; canPlay: boolean; canDownload: boolean };

function loginHref(returnTo = "/discover") {
  return `/musicas/entrar?return=${encodeURIComponent(returnTo)}`;
}

function DiscoverRow({
  production,
  access,
}: {
  production: PublicBrsProduction;
  access: Access;
}) {
  const router = useRouter();
  const player = useVipMusicPlayer();
  const track = productionToPreviewTrack(production);
  const playing = player.playingId === track.id && player.isPlaying;
  const exclusive = production.isFeatured || production.isNew;

  function play() {
    if (!access.canPlay) {
      router.push(loginHref(`/m/${production.slug}`));
      return;
    }
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
      router.push(loginHref(`/m/${production.slug}`));
      return;
    }
    if (!access.canDownload) {
      router.push("/plans");
      return;
    }
    startBrowserTrackDownload(productionDownloadTrack(production));
  }

  return (
    <article className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)] items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5">
      <button
        type="button"
        onClick={play}
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a] sm:h-16 sm:w-16"
        aria-label={playing ? `Pausar ${production.title}` : `Reproduzir ${production.title}`}
      >
        <Image
          src={production.coverUrl}
          alt=""
          fill
          unoptimized={!production.coverUrl.startsWith("/")}
          sizes="64px"
          className="object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition hover:opacity-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b6f03a] text-black">
            {playing ? <Pause className="h-3.5 w-3.5" fill="currentColor" /> : <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />}
          </span>
        </span>
      </button>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href={`/m/${production.slug}`}
            className="truncate text-[14px] font-bold leading-tight text-white hover:text-[#b6f03a] sm:text-[15px]"
            title={production.title}
          >
            {production.title}
          </Link>
          {exclusive ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/50 bg-orange-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-orange-300">
              <Crown className="h-3 w-3" />
              Exclusiva CLUB
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-[#9a9a9a] sm:text-xs">
          {production.producerSlug ? (
            <Link href={`/p/${production.producerSlug}`} className="font-medium text-[#c8c8c8] hover:text-white hover:underline">
              {production.producer}
            </Link>
          ) : (
            <span className="font-medium text-[#c8c8c8]">{production.producer || production.artist}</span>
          )}
          {production.genre ? (
            <>
              <span>·</span>
              <span>{production.genre}</span>
            </>
          ) : null}
          {production.bpm ? (
            <>
              <span>·</span>
              <span>{production.bpm} BPM</span>
            </>
          ) : null}
          {production.duration ? (
            <>
              <span>·</span>
              <span>{production.duration}</span>
            </>
          ) : null}
          {production.versionLabel || production.versionType ? (
            <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-medium text-[#8f8f8f]">
              {production.versionLabel || production.versionType}
            </span>
          ) : null}
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1 sm:gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#8f8f8f] transition hover:bg-white/5 hover:text-white"
          aria-label="Favoritar"
        >
          <Heart className="h-4 w-4" />
        </button>
        {access.canDownload ? (
          <button
            type="button"
            onClick={download}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#b6f03a] px-4 text-[12px] font-extrabold text-black transition hover:bg-[#c6ff4d]"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        ) : (
          <button
            type="button"
            onClick={download}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-[#222] px-4 text-[12px] font-bold text-white transition hover:bg-[#2c2c2c]"
          >
            <Lock className="h-3.5 w-3.5" />
            {access.authenticated ? "Assinar" : "Entrar"}
          </button>
        )}
      </div>
    </article>
  );
}

export function DiscoverCatalog({ productions }: { productions: PublicBrsProduction[] }) {
  const [access, setAccess] = useState<Access>({ authenticated: false, canPlay: false, canDownload: false });

  useEffect(() => {
    void fetch("/api/musicas/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { authenticated?: boolean; canPlay?: boolean; hasVip?: boolean; planExpired?: boolean }) => {
        const activePlan = Boolean(body.authenticated && body.canPlay && !body.planExpired);
        setAccess({
          authenticated: Boolean(body.authenticated),
          canPlay: activePlan,
          canDownload: activePlan,
        });
      })
      .catch(() => undefined);
  }, []);

  return (
    <VipMusicPlayerProvider canPlayFull={access.canPlay}>
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414]">
        {productions.map((production) => (
          <DiscoverRow key={production.id} production={production} access={access} />
        ))}
      </div>
    </VipMusicPlayerProvider>
  );
}
