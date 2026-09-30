"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Headphones,
  MapPin,
  Music2,
  Play,
  Share2,
} from "lucide-react";
import { ProductionRail } from "./HomeProductions";
import { productionToPreviewTrack, type PublicBrsProduction } from "../lib/brs-productions";
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

function SocialIcon({ label }: { label: string }) {
  const name = label.toLowerCase();
  const common = {
    className: "h-4 w-4",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true as const,
  };

  if (name.includes("instagram")) {
    return (
      <svg {...common}>
        <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm6.2-.9a1 1 0 1 0 1 1 1 1 0 0 0-1-1zM12 9.2A2.8 2.8 0 1 1 9.2 12 2.8 2.8 0 0 1 12 9.2z" />
      </svg>
    );
  }

  if (name.includes("facebook")) {
    return (
      <svg {...common}>
        <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z" />
      </svg>
    );
  }

  if (name.includes("youtube")) {
    return (
      <svg {...common}>
        <path d="M23 12.2s0-3.2-.4-4.6a3 3 0 0 0-2.1-2.1C18.9 5 12 5 12 5s-6.9 0-8.5.5a3 3 0 0 0-2.1 2.1C1 9 1 12.2 1 12.2s0 3.2.4 4.6a3 3 0 0 0 2.1 2.1C5.1 19.4 12 19.4 12 19.4s6.9 0 8.5-.5a3 3 0 0 0 2.1-2.1c.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.2 3.3z" />
      </svg>
    );
  }

  if (name.includes("soundcloud")) {
    return (
      <svg {...common}>
        <path d="M17.5 10.2a4.4 4.4 0 0 0-4.2 3H7.6a.6.6 0 0 0-.6.6v.8h6.3a3.2 3.2 0 1 0 4.2-4.4zM4 14.8h.8v-2.2H4zm1.4 0h.8v-3.2h-.8zm1.4 0h.8V10h-.8z" />
      </svg>
    );
  }

  if (name.includes("spotify")) {
    return (
      <svg {...common}>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.6 14.4a.6.6 0 0 1-.8.2c-2.3-1.4-5.2-1.7-8.6-.9a.6.6 0 1 1-.3-1.2c3.7-.9 7-0.5 9.6 1.1a.6.6 0 0 1 .1.8zm1.2-2.7a.8.8 0 0 1-1 .2c-2.6-1.6-6.6-2.1-9.7-1.1a.8.8 0 0 1-.5-1.5c3.5-1.1 8-0.6 11 1.3a.8.8 0 0 1 .2 1.1zm.1-2.8C14.8 9.4 9.6 9.2 7 10a1 1 0 1 1-.6-1.9c3-0.9 8.7-.6 12.1 1.4a1 1 0 0 1-1.1 1.6z" />
      </svg>
    );
  }

  return <ExternalLink className="h-4 w-4" />;
}

function ProfilePage({
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

  const latest = productions[0];
  const latestDate = latest
    ? new Date(latest.publishedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const profilePath = `/p/${producer.slug}`;
  const initials =
    producer.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "P";

  const heroImage = producer.photoUrl || latest?.coverUrl || null;

  const genreList = useMemo(() => {
    const values = productions
      .map((item) => item.genre?.trim())
      .filter((item): item is string => Boolean(item));
    return [...new Set(values)].slice(0, 4);
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
    } catch {
      // compartilhamento cancelado
    }
  }

  function playLatest() {
    if (!latest) return;
    if (!access.canPlay) {
      router.push(loginHref(`${profilePath}#lancamentos`));
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050607] font-[family-name:var(--font-barlow)] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/[0.08]">
        <div className="absolute inset-0 -z-20 bg-[#050607]" />
        {heroImage ? (
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center opacity-25 blur-2xl scale-110"
            style={{ backgroundImage: `url("${heroImage}")` }}
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,7,8,0.25)_0%,rgba(5,6,7,0.92)_78%,#050607_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_25%,rgba(29,185,84,0.18),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(126,182,255,0.14),transparent_28%)]" />

        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 lg:px-8">
          <div className="mb-7 flex items-center justify-between">
            <Link
              href="/musicas"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45 transition hover:text-white"
            >
              Brazilian Remix Service
            </Link>
            <button
              type="button"
              onClick={() => void shareProfile()}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 backdrop-blur transition hover:border-white/20 hover:text-white"
            >
              <Share2 className="h-3.5 w-3.5" />
              Compartilhar
            </button>
          </div>

          <div className="grid items-end gap-8 md:grid-cols-[230px_minmax(0,1fr)] lg:grid-cols-[270px_minmax(0,1fr)]">
            <div className="relative mx-auto w-full max-w-[270px] md:mx-0">
              <div className="absolute -inset-3 rounded-[30px] bg-[#1db954]/15 blur-2xl" />
              <div className="relative aspect-square overflow-hidden rounded-[26px] border border-white/15 bg-[#111514] shadow-2xl">
                {heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#1db95433,transparent_45%),#111514] text-6xl font-black text-[#9ef7c0]">
                    {initials}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-3 left-5 inline-flex items-center gap-1.5 rounded-full border border-[#1db954]/30 bg-[#07110b]/95 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#8af2ad] shadow-xl backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1ed760] shadow-[0_0_9px_#1ed760]" />
                Produtor BRS
              </span>
            </div>

            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#72e89c]">
                <span>Perfil oficial</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>Produções BRS</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
                  {producer.name}
                </h1>
                <CheckCircle2 className="mt-2 h-6 w-6 shrink-0 text-[#1ed760] sm:h-7 sm:w-7" fill="currentColor" strokeWidth={2.5} />
              </div>

              {producer.fullName && producer.fullName !== producer.name ? (
                <p className="mt-2 text-sm font-medium text-white/45">{producer.fullName}</p>
              ) : null}

              <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
                {producer.bio ||
                  `Conheça o catálogo oficial de ${producer.name}, com produções, remixes, edits e versões exclusivas disponíveis no Brazilian Remix Service.`}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                {producer.place ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/60">
                    <MapPin className="h-3.5 w-3.5" />
                    {producer.place}
                  </span>
                ) : null}
                {genreList.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-[#7eb6ff]/20 bg-[#7eb6ff]/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#b9d6ff]"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                {latest ? (
                  <button
                    type="button"
                    onClick={playLatest}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1ed760] px-5 text-xs font-black uppercase tracking-[0.08em] text-[#031008] shadow-[0_12px_35px_-14px_rgba(30,215,96,0.9)] transition hover:bg-[#35e777]"
                  >
                    <Play className="h-4 w-4" fill="currentColor" />
                    {access.canPlay ? "Ouvir lançamentos" : "Entrar para ouvir"}
                  </button>
                ) : null}

                <a
                  href="#lancamentos"
                  className="inline-flex h-11 items-center rounded-full border border-white/15 bg-white/[0.03] px-5 text-xs font-black uppercase tracking-[0.08em] text-white/80 transition hover:border-white/25 hover:text-white"
                >
                  Ver catálogo
                </a>

                {producer.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    title={link.label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition hover:border-[#1ed760]/35 hover:bg-[#1ed760]/10 hover:text-[#1ed760]"
                  >
                    <SocialIcon label={link.label} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/25 backdrop-blur sm:grid-cols-4">
            <div className="border-b border-white/[0.07] p-4 sm:border-b-0 sm:border-r">
              <div className="flex items-center gap-2 text-white/35">
                <Music2 className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em]">Faixas</span>
              </div>
              <p className="mt-2 text-2xl font-black tracking-tight text-white">{total}</p>
            </div>
            <div className="border-b border-white/[0.07] p-4 sm:border-b-0 sm:border-r">
              <div className="flex items-center gap-2 text-white/35">
                <Headphones className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em]">Catálogo</span>
              </div>
              <p className="mt-2 text-2xl font-black tracking-tight text-white">BRS</p>
            </div>
            <div className="border-r border-white/[0.07] p-4">
              <div className="flex items-center gap-2 text-white/35">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em]">Status</span>
              </div>
              <p className="mt-2 text-2xl font-black tracking-tight text-[#1ed760]">Oficial</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-white/35">
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em]">Último lançamento</span>
              </div>
              <p className="mt-2 truncate text-sm font-bold capitalize text-white">
                {latestDate || "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <section id="lancamentos" className="scroll-mt-24 pt-12 sm:pt-16">
          <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1ed760]">
                Discografia
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">
                Lançamentos
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Explore as produções de {producer.name}, com reprodução e download para usuários com acesso ativo ao BRS.
              </p>
            </div>
            {latest ? (
              <button
                type="button"
                onClick={playLatest}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#1ed760]/30 bg-[#1ed760]/[0.08] px-4 text-[10px] font-black uppercase tracking-[0.12em] text-[#1ed760] transition hover:bg-[#1ed760]/15"
              >
                <Play className="h-3.5 w-3.5" fill="currentColor" />
                Tocar catálogo
              </button>
            ) : null}
          </div>

          {productions.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-14 text-center text-sm text-white/40">
              Nenhuma produção publicada ainda.
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
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60 transition hover:border-white/20 hover:text-white"
                  href={`${profilePath}?page=${page - 1}#lancamentos`}
                >
                  Anterior
                </Link>
              ) : null}
              <span className="rounded-full bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/40">
                {page} / {pages}
              </span>
              {page < pages ? (
                <Link
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60 transition hover:border-white/20 hover:text-white"
                  href={`${profilePath}?page=${page + 1}#lancamentos`}
                >
                  Próxima
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>

        <section className="mt-14 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d100f]">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#72e89c]">
                Sobre o produtor
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                {producer.name}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
                {producer.bio ||
                  `Perfil oficial de ${producer.name} no Brazilian Remix Service. Aqui você encontra os lançamentos publicados, versões produzidas e o catálogo disponível na plataforma.`}
              </p>
            </div>
            <div className="border-t border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Acesso ao catálogo
              </p>
              <div className="mt-4 flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-[#1ed760]/10 p-2.5 text-[#1ed760]">
                  <Headphones className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {access.canDownload ? "Download liberado" : "Catálogo para membros"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/40">
                    {access.canDownload
                      ? "Você pode reproduzir e baixar as produções disponíveis."
                      : "Entre com sua conta BRS para acessar a reprodução e os downloads."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
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
      <ProfilePage {...props} />
    </VipMusicPlayerProvider>
  );
}
