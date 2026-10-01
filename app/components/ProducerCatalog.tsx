"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
} from "lucide-react";
import { ProductionRail } from "./HomeProductions";
import { productionToPreviewTrack, type PublicBrsProduction } from "../lib/brs-productions";
import { VipMusicPlayerProvider, useVipMusicPlayer } from "../musicas/components/VipMusicPlayerContext";

const FOLDER_ID = "brs-productions";
const PROFILE_BARS = [18, 28, 16, 36, 22, 42, 20, 34, 14, 40, 24, 32, 18, 38, 22, 30, 16, 36, 26, 44, 20, 34, 18, 28];

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
  fallbackPhotoUrl: string | null;
  place: string | null;
  links: { href: string; label: string }[];
};

function loginHref(returnPath: string) {
  return `/musicas/entrar?return=${encodeURIComponent(returnPath)}`;
}

function SocialIcon({ label }: { label: string }) {
  const name = label.toLowerCase();
  const icon = name.includes("instagram")
    ? "fa-brands fa-instagram"
    : name.includes("facebook")
      ? "fa-brands fa-facebook"
      : name.includes("whatsapp")
        ? "fa-brands fa-whatsapp"
        : name.includes("youtube")
          ? "fa-brands fa-youtube"
          : name.includes("soundcloud")
            ? "fa-brands fa-soundcloud"
            : name.includes("spotify")
              ? "fa-brands fa-spotify"
              : "fa-solid fa-globe";
  return <i className={`${icon} text-[15px] leading-none`} aria-hidden="true" />;
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
  const latest = productions[0];
  const [photo, setPhoto] = useState(producer.photoUrl || producer.fallbackPhotoUrl);
  const [expanded, setExpanded] = useState(false);

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
    } catch {
      // compartilhamento cancelado
    }
  }

  function playLatest() {
    if (!latest) return;
    if (!access.canPlay) {
      router.push(loginHref(`/p/${producer.slug}#lancamentos`));
      return;
    }
    const tracks = productions.map(productionToPreviewTrack);
    const track = tracks[0];
    if (!track) return;
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

  const profilePath = `/p/${producer.slug}`;
  const initials = producer.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "P";
  const spinning = Boolean(latest && player.playingId === latest.audioFileId && player.isPlaying);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_18%_0%,rgba(0,70,160,0.48),transparent_42%),linear-gradient(180deg,#05070d_0%,#02040a_100%)] font-[family-name:var(--font-barlow)] text-white">
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <section className="grid items-start gap-4 lg:grid-cols-2">
          <div className="flex flex-col items-center gap-4">
          <div className="relative aspect-square w-full max-w-[420px]">
            <div className="absolute inset-[6%] z-0 rounded-full">
              {PROFILE_BARS.map((height, index) => (
                <span
                  key={index}
                  className="absolute left-1/2 top-1/2 w-1 origin-bottom rounded-full bg-gradient-to-t from-[#1db954] via-[#7eb6ff] to-[#ffe566]"
                  style={{
                    height: `${spinning ? height : 10}px`,
                    transform: `rotate(${index * (360 / PROFILE_BARS.length)}deg) translateY(-176px)`,
                    opacity: spinning ? 0.95 : 0.35,
                    transition: "height 180ms linear",
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => photo && setExpanded(true)}
              aria-label={photo ? `Ampliar foto de ${producer.name}` : producer.name}
              className="absolute inset-[18%] z-10 overflow-hidden rounded-full border-4 border-[#102033] bg-[#07111c] shadow-[0_0_80px_rgba(0,80,180,0.35)]"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt=""
                  className={`absolute inset-0 z-10 h-full w-full object-cover ${spinning ? "animate-[spin_8s_linear_infinite]" : ""}`}
                  onError={() => {
                    if (producer.fallbackPhotoUrl && photo !== producer.fallbackPhotoUrl) setPhoto(producer.fallbackPhotoUrl);
                    else setPhoto(null);
                  }}
                />
              ) : (
                <span className={`flex h-full items-center justify-center text-5xl font-semibold text-[#9ef7c0] ${spinning ? "animate-[spin_8s_linear_infinite]" : ""}`}>{initials}</span>
              )}
            </button>
          </div>
          <div className="w-full max-w-[420px] rounded-2xl border border-[#7eb6ff]/25 bg-[linear-gradient(160deg,rgba(0,39,118,0.45),rgba(5,7,13,0.55))] px-5 py-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7eb6ff]">No catálogo BRS</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{total}</p>
            <p className="text-sm text-white">{total === 1 ? "faixa publicada" : "faixas publicadas"}</p>
            {producer.place ? <p className="mt-2 text-sm text-white">{producer.place}</p> : null}
            {latest ? <p className="mt-3 truncate text-sm text-white">Último lançamento · {latest.title}</p> : null}
          </div>
          </div>
          <div className="flex h-full flex-col justify-start rounded-[28px] border border-white/10 bg-black/25 p-6 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7eb6ff]">Perfil público · Produtor</p>
            <div className="mt-3 flex items-center gap-3">
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">{producer.name}</h1>
              <span className="group relative inline-flex shrink-0">
                <i className="fa-solid fa-circle-check text-2xl text-[#1db954] sm:text-3xl" aria-hidden="true" />
                <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  Verificado
                </span>
              </span>
            </div>
            {producer.fullName ? <p className="mt-2 text-sm text-zinc-400">{producer.fullName}</p> : null}
            <p className="mt-5 max-w-xl text-justify text-sm leading-7 text-white sm:text-base">
              {producer.bio || "Catálogo oficial de produções no Brazilian Remix Service."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-md bg-[#002776] px-2 py-1 text-xs font-bold text-[#d7e7ff]">
                {total} {total === 1 ? "faixa" : "faixas"}
              </span>
              <span className="rounded-md bg-[#1db954]/15 px-2 py-1 text-xs font-bold text-[#9ef7c0]">
                {producer.place || "Catálogo BRS"}
              </span>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {latest ? (
                <button type="button" onClick={playLatest} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1db954] px-5 text-sm font-bold text-black">
                  <Play className="h-4 w-4" fill="currentColor" />
                  Ouvir lançamento mais recente
                </button>
              ) : null}
              <a href="#lancamentos" className="inline-flex h-11 items-center rounded-full border border-[#7eb6ff]/40 px-5 text-sm font-semibold text-white">
                Ver lançamentos
              </a>
              <button type="button" onClick={() => void shareProfile()} aria-label="Compartilhar perfil" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80">
                <i className="fa-solid fa-share-nodes text-[15px] leading-none" aria-hidden="true" />
              </button>
              {producer.links.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80">
                  <SocialIcon label={link.label} />
                </a>
              ))}
            </div>
          </div>
        </section>
        {expanded && photo ? (
          <button
            type="button"
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-6"
            aria-label="Fechar foto"
            onClick={() => setExpanded(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={producer.name} className="max-h-[86vh] max-w-[86vw] rounded-3xl object-contain shadow-2xl" />
          </button>
        ) : null}

        <section id="lancamentos" className="scroll-mt-24 pt-12 sm:pt-16">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1ed760]">Catálogo público</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Lançamentos</h2>
              <p className="mt-1 text-sm text-white">Produções de {producer.name} disponíveis no catálogo BRS.</p>
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
            <div className="mt-7">
              <ProductionRail productions={productions} layout="grid" embedded />
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
