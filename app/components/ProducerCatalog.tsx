"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  ExternalLink,
  Lock,
  Pause,
  Play,
  Share2,
  Sparkles,
} from "lucide-react";
import type { PublicBrsProduction } from "../lib/brs-productions";
import { productionDownloadTrack, productionToPreviewTrack } from "../lib/brs-productions";
import { startBrowserTrackDownload } from "../musicas/lib/browser-download-file";
import { VipMusicPlayerProvider, useVipMusicPlayer } from "../musicas/components/VipMusicPlayerContext";

const FOLDER_ID = "brs-productions";

type Access = {
  authenticated: boolean;
  canPlay: boolean;
  canDownload: boolean;
};

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

  const tone = production.category === "EQUIPE_BRS"
    ? "from-[#7eb6ff] via-[#1db954] to-[#ffe566]"
    : production.category === "DJ_PARCEIRO"
      ? "from-[#ffe566] via-[#ffb703] to-[#1db954]"
      : "from-[#1ed760] via-[#ffe566] to-[#009739]";

  return (
    <article className="group min-w-0">
      <div className={`rounded-2xl bg-gradient-to-br p-[1.5px] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)] transition duration-300 group-hover:-translate-y-1 ${tone}`}>
      <div className="relative aspect-square overflow-hidden rounded-[14px] bg-[#111]">
        <Image
          src={production.coverUrl}
          alt={production.title}
          fill
          unoptimized={!production.coverUrl.startsWith("/")}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          className="object-cover transition duration-500 group-hover:scale-[1.045]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent opacity-70" />
        <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/65 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#1ed760] backdrop-blur">
          {production.categoryLabel}
        </span>
        <button
          type="button"
          onClick={play}
          className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-[0_8px_25px_rgba(0,0,0,0.45)] transition hover:scale-105"
          aria-label={access.canPlay ? `Ouvir ${production.title}` : "Entrar para ouvir"}
        >
          {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
        </button>
      </div>
      </div>
      <Link
        href={`/producoes/${production.slug}`}
        className="mt-3 block truncate text-[15px] font-bold text-white transition hover:text-[#1ed760]"
      >
        {production.title}
      </Link>
      <p className="mt-1 truncate text-xs text-zinc-500">
        {production.artist}
        <span className="mx-1.5 text-zinc-700">•</span>
        {version}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        {production.genre ? (
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
            {production.genre}
          </span>
        ) : <span />}
        <button
          type="button"
          onClick={download}
          className={access.canDownload
            ? "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#1ed760] px-3 text-[11px] font-black text-black transition hover:brightness-110"
            : "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 text-[11px] font-bold text-zinc-300 transition hover:border-[#1ed760]/30 hover:text-white"}
        >
          {access.canDownload ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          {access.canDownload ? "Baixar" : access.authenticated ? "Membros" : "Entrar"}
        </button>
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
  const [access, setAccess] = useState<Access>({
    authenticated: false,
    canPlay: false,
    canDownload: false,
  });
  const [copied, setCopied] = useState(false);
  const latest = productions[0];

  useEffect(() => {
    void fetch("/api/musicas/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { authenticated?: boolean; canPlay?: boolean }) => {
        const can = Boolean(body.authenticated && body.canPlay);
        setAccess({
          authenticated: Boolean(body.authenticated),
          canPlay: can,
          canDownload: can,
        });
      })
      .catch(() => undefined);
  }, []);

  const years = useMemo(() => {
    const values = productions
      .map((item) => new Date(item.publishedAt).getFullYear())
      .filter((year) => Number.isFinite(year));
    return values.length ? [...new Set(values)].sort((a, b) => a - b) : [];
  }, [productions]);

  async function shareProfile() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: producer.name,
          text: `Confira as produções de ${producer.name} no Brazilian Remix Service.`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // compartilhamento cancelado
    }
  }

  function playLatest() {
    if (!latest) return;
    if (!access.canPlay) {
      router.push(loginHref(`/produtores/${producer.slug}#lancamentos`));
      return;
    }
    const tracks = productions.map(productionToPreviewTrack);
    const track = tracks[0];
    player.registerTrackMeta(track);
    player.setFolderPlayback(FOLDER_ID, {
      tracks,
      hasMore: false,
      loadMore: async () => undefined,
      coverUrl: latest.coverUrl,
      albumTitle: producer.name,
    });
    void player.toggleTrack(FOLDER_ID, track.id);
  }

  const profilePath = `/produtores/${producer.slug}`;

  return (
    <div className="min-h-screen bg-[#080909] text-white">
      <div className="mx-auto w-full max-w-7xl px-3 pb-16 pt-4 sm:px-6 lg:px-8">
        <section className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#101211] shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
          {producer.photoUrl ? (
            <div className="absolute inset-0 -z-20">
              <Image
                src={producer.photoUrl}
                alt=""
                fill
                unoptimized
                sizes="100vw"
                className="scale-110 object-cover opacity-20 blur-2xl"
              />
            </div>
          ) : null}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_18%,rgba(30,215,96,0.2),transparent_35%),linear-gradient(110deg,rgba(8,9,9,0.98),rgba(8,9,9,0.82),rgba(8,9,9,0.96))]" />

          <div className="relative flex min-h-[430px] flex-col justify-end p-5 sm:min-h-[480px] sm:p-8 lg:p-12">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-end">
              <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl sm:h-48 sm:w-48 lg:h-56 lg:w-56">
                {producer.photoUrl ? (
                  <Image
                    src={producer.photoUrl}
                    alt={producer.name}
                    fill
                    unoptimized
                    sizes="224px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#121514] text-6xl font-black text-[#1ed760]">
                    {producer.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1ed760] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">
                    <Sparkles className="h-3 w-3" />
                    Produtor BRS
                  </span>
                  {producer.place ? (
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                      {producer.place}
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-3 max-w-4xl font-display text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                  {producer.name}
                </h1>
                {producer.fullName ? (
                  <p className="mt-1 text-sm text-white/45 sm:text-base">{producer.fullName}</p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
                  <span><strong className="text-white">{total}</strong> {total === 1 ? "lançamento" : "lançamentos"}</span>
                  {years.length ? (
                    <span><strong className="text-white">{years[0]}{years.length > 1 ? `–${years[years.length - 1]}` : ""}</strong> no catálogo</span>
                  ) : null}
                  <span><strong className="text-white">BRS</strong> catálogo oficial</span>
                </div>

                {producer.bio ? (
                  <p className="mt-5 max-w-3xl text-sm leading-7 text-white/55 sm:text-base">
                    {producer.bio}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-2">
                  {latest ? (
                    <button
                      type="button"
                      onClick={playLatest}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1ed760] px-5 text-sm font-black text-black transition hover:brightness-110"
                    >
                      <Play className="h-4 w-4" fill="currentColor" />
                      {access.canPlay ? "Ouvir lançamentos" : "Entrar para ouvir"}
                    </button>
                  ) : null}
                  <a
                    href="#lancamentos"
                    className="inline-flex h-11 items-center rounded-full border border-white/15 bg-white/[0.04] px-5 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                  >
                    Ver catálogo
                  </a>
                  <button
                    type="button"
                    onClick={shareProfile}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-white/70 transition hover:text-white"
                  >
                    <Share2 className="h-4 w-4" />
                    {copied ? "Link copiado" : "Compartilhar"}
                  </button>
                </div>

                {producer.links.length > 0 ? (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {producer.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/45 transition hover:text-[#1ed760]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section id="lancamentos" className="scroll-mt-24 pt-12 sm:pt-16">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1ed760]">Discografia</p>
              <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">Últimos lançamentos</h2>
              <p className="mt-1 text-sm text-zinc-500">Produções de {producer.name} disponíveis no catálogo BRS.</p>
            </div>
            {latest ? (
              <button
                type="button"
                onClick={playLatest}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#1ed760]/30 bg-[#1ed760]/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-[#1ed760] transition hover:bg-[#1ed760]/15"
              >
                <Play className="h-3.5 w-3.5" fill="currentColor" />
                Tocar catálogo
              </button>
            ) : null}
          </div>

          {productions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-12 text-center text-sm text-zinc-500">
              Nenhuma música publicada ainda.
            </div>
          ) : (
            <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
              {productions.map((production) => (
                <ReleaseCard key={production.id} production={production} access={access} />
              ))}
            </div>
          )}

          {pages > 1 ? (
            <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Paginação dos lançamentos">
              {page > 1 ? (
                <Link
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/65 transition hover:text-white"
                  href={`${profilePath}?page=${page - 1}#lancamentos`}
                >
                  Anterior
                </Link>
              ) : null}
              <span className="rounded-full bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/45">
                {page} / {pages}
              </span>
              {page < pages ? (
                <Link
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/65 transition hover:text-white"
                  href={`${profilePath}?page=${page + 1}#lancamentos`}
                >
                  Próxima
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>

        <section className="mt-14 rounded-2xl border border-white/10 bg-[#101211] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1ed760]">Brazilian Remix Service</p>
              <h2 className="mt-2 text-xl font-black">Mais produções, mais música, direto no seu acervo.</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                Explore o catálogo do BRS e, para usuários com acesso ativo, reproduza e baixe as produções diretamente pela plataforma.
              </p>
            </div>
            <Link
              href="/musicas"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-white px-5 text-xs font-black uppercase tracking-[0.1em] text-black transition hover:bg-[#1ed760]"
            >
              Explorar músicas
            </Link>
          </div>
        </section>
      </div>
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
      .then((body: { canPlay?: boolean; authenticated?: boolean }) => {
        setAccess(Boolean(body.authenticated && body.canPlay));
      })
      .catch(() => setAccess(false));
  }, []);

  return (
    <VipMusicPlayerProvider canPlayFull={access}>
      <Catalog {...props} />
    </VipMusicPlayerProvider>
  );
}
