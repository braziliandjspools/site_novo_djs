"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, FolderTree, Music2 } from "lucide-react";
import type { PreviewTrack } from "../../../lib/google-drive";
import { MusicasTracksSkeleton } from "../../components/MusicasSkeletons";
import { VipMusicTrackList } from "../../components/VipMusicTrackList";
import { VipUpgradeBanner } from "../../VipUpgradeGate";
import { useMusicasSession } from "../../components/MusicasSessionContext";
import { MUSICAS_HERO_COVER_SRC } from "../../lib/musicas-hero-art";

type StyleTrack = PreviewTrack & {
  styleFolderId?: string;
  styleName?: string;
  relativePath?: string;
};

type StyleProfileResponse = {
  slug?: string;
  name?: string;
  imageUrl?: string | null;
  trackCount?: number;
  folderCount?: number;
  tracks?: StyleTrack[];
  error?: string;
  canPlay?: boolean;
  canDownload?: boolean;
};

export function EstiloSlugClient({ slug }: { slug: string }) {
  const { authenticated, hasVip } = useMusicasSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StyleProfileResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetch(`/api/musicas/styles/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as StyleProfileResponse;
        if (!res.ok) throw new Error(body.error ?? "Erro ao carregar estilo.");
        if (!cancelled) setProfile(body);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const tracks = useMemo(() => profile?.tracks ?? [], [profile?.tracks]);
  const cover = profile?.imageUrl?.trim() || MUSICAS_HERO_COVER_SRC;
  const title = profile?.name ?? slug.replace(/-/g, " ");

  return (
    <div className="w-full space-y-5">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link href="/musicas/atualizacoes" className="font-medium text-zinc-400 transition-colors hover:text-white">
          Atualizações
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/musicas/estilos" className="font-medium text-zinc-400 transition-colors hover:text-white">
          Estilos
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-white">{title}</span>
      </nav>

      {loading ? (
        <div className="space-y-5" aria-busy="true">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2a24] via-[#121816] to-[#0c0e0d] px-5 py-8 ring-1 ring-white/10">
            <div className="mx-auto h-28 w-28 animate-pulse rounded-2xl bg-white/10 sm:mx-0" />
            <div className="mt-4 h-9 w-2/3 max-w-sm animate-pulse rounded bg-white/10" />
          </div>
          <MusicasTracksSkeleton rows={8} />
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">{error}</p>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111511]">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <Image
                src={cover}
                alt=""
                fill
                priority
                sizes="100vw"
                className="scale-110 object-cover opacity-25 blur-2xl"
                unoptimized={cover.startsWith("/api/")}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/40" />
            </div>
            <div className="relative z-10 flex flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:px-7 sm:py-9">
              <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-[0_16px_35px_rgba(0,0,0,0.45)]">
                <Image src={cover} alt={title} fill sizes="112px" className="object-cover" unoptimized={cover.startsWith("/api/")} />
              </div>
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ed760]">
                  <Music2 className="h-3.5 w-3.5" />
                  Estilo
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/70">
                    {profile?.trackCount ?? 0} {(profile?.trackCount ?? 0) === 1 ? "faixa" : "faixas"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/60">
                    <FolderTree className="h-3.5 w-3.5" />
                    {profile?.folderCount ?? 0} {profile?.folderCount === 1 ? "pasta" : "pastas"}
                  </span>
                  {hasVip ? (
                    <span className="rounded-full border border-[#1ed760]/30 bg-[#1ed760]/10 px-3 py-1.5 text-[#1ed760]">Premium ativo</span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/50">Só navegação</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {!hasVip && authenticated && <VipUpgradeBanner />}
          {!authenticated && <VipUpgradeBanner />}

          <section>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
              Todas as faixas deste estilo
            </h2>
            {tracks.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-[#141816] px-4 py-10 text-center text-sm text-white/50">
                Nenhuma faixa encontrada para este estilo.
              </p>
            ) : (
              <VipMusicTrackList
                folderId={`style:${profile?.slug ?? slug}`}
                tracks={tracks}
                canPlay={Boolean(profile?.canPlay)}
                canDownload={Boolean(profile?.canDownload ?? profile?.canPlay)}
                albumTitle={title}
                coverUrl={cover}
                layout="table"
                groupByDate={false}
                embedded
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
