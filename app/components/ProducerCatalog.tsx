"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Lock, Pause, Play } from "lucide-react";
import type { PublicBrsProduction } from "../lib/brs-productions";
import { productionDownloadTrack, productionToPreviewTrack } from "../lib/brs-productions";
import { startBrowserTrackDownload } from "../musicas/lib/browser-download-file";
import { VipMusicPlayerProvider, useVipMusicPlayer } from "../musicas/components/VipMusicPlayerContext";

const FOLDER_ID = "brs-productions";

type Access = { authenticated: boolean; canPlay: boolean; canDownload: boolean };

type ProducerProfile = {
  name: string;
  slug: string;
  fullName: string | null;
  bio: string | null;
  photoUrl: string | null;
  place: string | null;
  links: { href: string; label: string }[];
};

function loginHref(returnPath: string) {
  return `/musicas/entrar?return=${encodeURIComponent(returnPath)}`;
}

function ReleaseCard({
  production,
  access,
}: {
  production: PublicBrsProduction;
  access: Access;
}) {
  const player = useVipMusicPlayer();
  const router = useRouter();
  const playing = player.playingId === production.audioFileId && player.isPlaying;
  const version = production.versionLabel || production.versionType;

  function play() {
    if (!access.canPlay) {
      router.push(loginHref(`/producoes/${production.slug}`));
      return;
    }
    const track = productionToPreviewTrack(production);
    player.registerTrackMeta(track);
    player.setFolderPlayback(FOLDER_ID, {
      tracks: [track],
      hasMore: false,
      loadMore: async () => undefined,
      coverUrl: production.coverUrl,
      albumTitle: production.producer,
    });
    void player.toggleTrack(FOLDER_ID, track.id);
  }

  function download() {
    if (!access.authenticated) {
      router.push(loginHref(`/produtores/${production.producerSlug ?? ""}#lancamentos`));
      return;
    }
    if (!access.canDownload) {
      router.push("/plans");
      return;
    }
    startBrowserTrackDownload(productionDownloadTrack(production));
  }

  return (
    <article className="min-w-0">
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-[#111]">
        <Image
          src={production.coverUrl}
          alt=""
          fill
          unoptimized={!production.coverUrl.startsWith("/")}
          sizes="(max-width: 640px) 50vw, 240px"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <button
          type="button"
          onClick={play}
          className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40"
          aria-label={access.canPlay ? `Ouvir ${production.title}` : "Entrar para ouvir"}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1db954] text-black opacity-0 shadow-lg transition group-hover:opacity-100">
            {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
          </span>
        </button>
        <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#1db954]">
          {production.categoryLabel}
        </span>
      </div>
      <Link href={`/producoes/${production.slug}`} className="mt-3 block truncate text-sm font-semibold text-white hover:text-[#1ed760]">
        {production.title}
      </Link>
      <p className="mt-1 truncate text-xs text-zinc-500">
        {production.artist}
        <span className="mx-1.5 text-zinc-700">·</span>
        {version}
      </p>
      <div className="mt-3 flex justify-end">
        {access.canDownload ? (
          <button type="button" onClick={download} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#1db954] px-3 text-[11px] font-bold text-black">
            <Download className="h-3.5 w-3.5" /> Baixar
          </button>
        ) : (
          <button type="button" onClick={download} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 px-3 text-[11px] font-bold text-zinc-300">
            <Lock className="h-3.5 w-3.5" />
            {access.authenticated ? "Membros" : "Entrar"}
          </button>
        )}
      </div>
    </article>
  );
}

function Catalog({
  producer,
  productions,
  page,
  pages,
  total,
}: {
  producer: ProducerProfile;
  productions: PublicBrsProduction[];
  page: number;
  pages: number;
  total: number;
}) {
  const player = useVipMusicPlayer();
  const router = useRouter();
  const [access, setAccess] = useState<Access>({ authenticated: false, canPlay: false, canDownload: false });
  const latest = productions[0];
  const countLabel = `${total} ${total === 1 ? "faixa publicada" : "faixas publicadas"}`;

  useEffect(() => {
    void fetch("/api/musicas/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { authenticated?: boolean; canPlay?: boolean }) => {
        const can = Boolean(body.authenticated && body.canPlay);
        setAccess({ authenticated: Boolean(body.authenticated), canPlay: can, canDownload: can });
      })
      .catch(() => undefined);
  }, []);

  function playLatest() {
    if (!latest) return;
    if (!access.canPlay) {
      router.push(loginHref(`/producoes/${latest.slug}`));
      return;
    }
    const track = productionToPreviewTrack(latest);
    player.registerTrackMeta(track);
    player.setFolderPlayback(FOLDER_ID, {
      tracks: productions.map(productionToPreviewTrack),
      hasMore: false,
      loadMore: async () => undefined,
      coverUrl: latest.coverUrl,
      albumTitle: producer.name,
    });
    void player.toggleTrack(FOLDER_ID, track.id);
  }

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6">
      <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(ellipse_at_80%_0%,rgba(29,185,84,0.22),transparent_46%),linear-gradient(180deg,#121212,#0c0c0c)] px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-black ring-1 ring-white/15 sm:h-32 sm:w-32">
            {producer.photoUrl ? (
              <Image src={producer.photoUrl} alt="" fill unoptimized className="object-cover" sizes="128px" />
            ) : (
              <span className="flex h-full items-center justify-center text-3xl font-bold text-[#1db954]">
                {producer.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1db954]">
              Perfil público · Produtor
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-5xl">{producer.name}</h1>
            {producer.fullName ? <p className="mt-1 text-sm text-zinc-500">{producer.fullName}</p> : null}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-zinc-400 sm:justify-start">
              <span>{countLabel}</span>
              {producer.place ? <span>{producer.place}</span> : <span>Catálogo BRS</span>}
            </div>
            {producer.bio ? <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:mx-0">{producer.bio}</p> : null}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {latest ? (
                <button type="button" onClick={playLatest} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1db954] px-4 text-sm font-bold text-black">
                  <Play className="h-4 w-4" fill="currentColor" /> Ouvir lançamento mais recente
                </button>
              ) : null}
              <a href="#lancamentos" className="inline-flex h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-white">
                Ver lançamentos
              </a>
            </div>
            {producer.links.length > 0 ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {producer.links.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="text-xs text-zinc-400 hover:text-[#1ed760]">
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section id="lancamentos" className="scroll-mt-24 pt-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1db954]">Catálogo público</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-white">Lançamentos</h2>
        {productions.length === 0 ? (
          <p className="mt-8 text-sm text-zinc-500">Nenhuma música publicada ainda.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {productions.map((production) => (
              <ReleaseCard key={production.id} production={production} access={access} />
            ))}
          </div>
        )}
        {pages > 1 ? (
          <nav className="mt-8 flex gap-3 text-sm">
            {page > 1 ? <Link className="text-[#1db954]" href={`/produtores/${producer.slug}?page=${page - 1}#lancamentos`}>Anterior</Link> : null}
            <span className="text-white/40">{page} / {pages}</span>
            {page < pages ? <Link className="text-[#1db954]" href={`/produtores/${producer.slug}?page=${page + 1}#lancamentos`}>Próxima</Link> : null}
          </nav>
        ) : null}
      </section>
    </div>
  );
}

export function ProducerCatalog(props: {
  producer: ProducerProfile;
  productions: PublicBrsProduction[];
  page: number;
  pages: number;
  total: number;
}) {
  const [access, setAccess] = useState(false);
  useEffect(() => {
    void fetch("/api/musicas/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { canPlay?: boolean; authenticated?: boolean }) => setAccess(Boolean(body.authenticated && body.canPlay)))
      .catch(() => setAccess(false));
  }, []);

  return (
    <VipMusicPlayerProvider canPlayFull={access}>
      <Catalog {...props} />
    </VipMusicPlayerProvider>
  );
}
