"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Flame,
  FolderOpen,
  Loader2,
  MonitorDown,
  Music2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { VipMusicHomeSnapshot } from "../../lib/vip-music-home";
import { HomeTrackRow } from "./HomeTrackRow";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import {
  getContinueListening,
  getRecentFolders,
  getUnseenNewCount,
  touchLastVisit,
} from "../lib/music-library-storage";

function formatStat(n: number) {
  return n.toLocaleString("pt-BR");
}

function syncLabel(syncedAt: string) {
  const diff = Date.now() - new Date(syncedAt).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.round(mins / 60);
  return `há ${hours} h`;
}

type MusicasLibraryDashboardProps = {
  home: VipMusicHomeSnapshot | null;
  loading: boolean;
};

export function MusicasLibraryDashboard({ home, loading }: MusicasLibraryDashboardProps) {
  const { hasVip } = useMusicasSession();
  const sync = useDownloaderSync();
  const [continueItem, setContinueItem] = useState(getContinueListening());
  const [recentFolders, setRecentFolders] = useState(getRecentFolders());
  const [period, setPeriod] = useState<"hoje" | "semana" | "mes">("semana");
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    setContinueItem(getContinueListening());
    setRecentFolders(getRecentFolders());
  }, []);

  useEffect(() => {
    if (home) setUnseenCount(getUnseenNewCount(home.newsBanner.newTracksEstimate));
  }, [home]);

  useEffect(() => {
    return () => {
      touchLastVisit();
    };
  }, []);

  const filteredLatest = (() => {
    if (!home) return [];
    if (period === "hoje") return home.latestTracks.slice(0, 6);
    if (period === "semana") return home.topWeek.slice(0, 8);
    return home.latestTracks;
  })();

  const onlineDevices = sync?.devices.filter((d) => d.isOnline) ?? [];
  const downloadingCount = sync
    ? Object.values(sync.jobsByFileId).filter(
        (job) => job.status === "DOWNLOADING" || job.status === "RECEIVED",
      ).length
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
      </div>
    );
  }

  if (!home?.configured) return null;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl border border-[#1ed760]/20 bg-gradient-to-r from-[#1a2e1f] via-[#1f1f1f] to-[#121212] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold text-white sm:text-xl">{home.newsBanner.title}</p>
            <p className="mt-1 text-sm text-zinc-400">{home.newsBanner.subtitle}</p>
          </div>
          <Link
            href={home.newsBanner.href}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1ed760] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#1bc95b]"
          >
            Ver novidades
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Biblioteca</p>
          <p className="mt-2 text-2xl font-black text-white">
            {formatStat(home.stats.trackCount)} <span className="text-sm font-semibold text-zinc-500">faixas</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {formatStat(home.stats.packCount)} packs · {home.stats.genreCount} gêneros · Atualizado hoje
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sincronização</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#1ed760]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#1ed760]" />
            Servidor Sincronizado
          </p>
          <p className="mt-1 text-xs text-zinc-500">Última atualização {syncLabel(home.syncedAt)}</p>
        </div>

        {unseenCount > 0 && (
          <Link
            href={home.newsBanner.href}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 transition-colors hover:bg-amber-500/15"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Novidades</p>
            <p className="mt-2 text-2xl font-black text-amber-300">{unseenCount} novas</p>
            <p className="mt-1 text-xs text-amber-200/70">desde sua última visita</p>
          </Link>
        )}

        {hasVip && (
          <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Downloader</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {onlineDevices.length ? `${onlineDevices[0]?.deviceName ?? "PC"} conectado` : "Nenhum PC online"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {downloadingCount} baixando · {sync?.totalQueueCount ?? 0} na fila
            </p>
            <button
              type="button"
              onClick={() =>
                document.getElementById("downloader-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
              }
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1ed760] hover:underline"
            >
              <MonitorDown className="h-3.5 w-3.5" />
              Abrir Downloader →
            </button>
          </div>
        )}
      </div>

      {continueItem && (
        <section>
          <h2 className="mb-3 text-xl font-bold text-white">Continue ouvindo</h2>
          <Link
            href={continueItem.href}
            className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-[#1a1a1a] p-4 transition-colors hover:border-[#1ed760]/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1ed760]/15 text-[#1ed760]">
              <Music2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-500">Você parou aqui →</p>
              <p className="truncate font-semibold text-white">{continueItem.title}</p>
              <p className="truncate text-xs text-zinc-500">
                {continueItem.artist} · {continueItem.styleName}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-500" />
          </Link>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Últimas adicionadas</h2>
          <div className="flex gap-2">
            {(
              [
                ["hoje", "Hoje"],
                ["semana", "Esta semana"],
                ["mes", "Este mês"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPeriod(id)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                  period === id ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a]/80 p-2">
          {filteredLatest.length === 0 ? (
            <p className="px-3 py-6 text-sm text-zinc-500">Nenhuma faixa neste período.</p>
          ) : (
            filteredLatest.map((track) => <HomeTrackRow key={track.id} track={track} rank={undefined} />)
          )}
        </div>
        <p className="mt-2 text-center text-xs text-zinc-500">
          Toque em uma faixa para abrir no player do pack mensal.
        </p>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-white">
          <TrendingUp className="h-5 w-5 text-[#FFDF00]" />
          Mais baixadas da semana
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a]/80 p-2">
          {home.topWeek.map((track, index) => (
            <HomeTrackRow key={`top-${track.id}`} track={track} rank={index + 1} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">Atalhos por gênero</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {home.genres.map((genre) => (
            <Link
              key={genre.slug + genre.monthSlug}
              href={genre.href}
              className="group rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-[#121212] p-3 transition-transform hover:scale-[1.02] hover:border-[#1ed760]/30"
            >
              <p className="truncate text-sm font-bold text-white group-hover:text-[#1ed760]">{genre.name}</p>
              <p className="mt-1 text-[10px] text-zinc-500">{formatStat(genre.trackCount)} faixas</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-white">
          <FolderOpen className="h-5 w-5 text-amber-400" />
          Visitados recentemente
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a]/80 p-3">
          {recentFolders.length === 0 ? (
            <p className="text-sm text-zinc-500">Abra um pack ou gênero para aparecer aqui.</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {recentFolders.map((folder) => (
                <Link
                  key={folder.href}
                  href={folder.href}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-[#1ed760]/40 hover:text-white"
                >
                  {folder.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[#1DB954]/20 bg-gradient-to-r from-[#0f1f14] to-[#1a1a1a] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#1DB954]">
              <Sparkles className="h-3.5 w-3.5" />
              Produção exclusiva
            </p>
            <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              Quer uma música exclusiva? Nossa DJ produz para você
            </h2>
          </div>
          <Link
            href="/musicproducer#conte-sua-ideia"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1DB954] px-5 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-[#1ed760]"
          >
            Pedir minha música
            <Flame className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
