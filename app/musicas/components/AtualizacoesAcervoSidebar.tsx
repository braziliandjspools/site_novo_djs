"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Clock3,
  Disc3,
  FolderOpen,
  Music2,
  Sparkles,
} from "lucide-react";
import type { VipMusicHomeSnapshot } from "../../lib/vip-music-home";
import { getTrackDisplayMetadata } from "../../lib/track-display-metadata";
import {
  getContinueListening,
  getRecentFolders,
  type ContinueListening,
  type RecentFolder,
} from "../lib/music-library-storage";

type AtualizacoesAcervoSidebarProps = {
  home: VipMusicHomeSnapshot | null;
  loading?: boolean;
};

function SidebarSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof Music2;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/25">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-[#1ed760]/25 bg-[#1ed760]/10 text-[#1ed760]">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
        </span>
        <h3 className="min-w-0 flex-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
          {title}
        </h3>
        <ChevronDown
          className={`h-4 w-4 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? <div className="space-y-1.5 border-t border-white/[0.05] px-2.5 py-2.5">{children}</div> : null}
    </section>
  );
}

function SidebarLink({
  href,
  title,
  subtitle,
  meta,
}: {
  href: string;
  title: string;
  subtitle?: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-2.5 rounded-lg border border-transparent bg-white/[0.02] px-2.5 py-2 transition-colors hover:border-[#1ed760]/30 hover:bg-[rgba(30,215,96,0.06)]"
    >
      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1ed760]/70 opacity-70 group-hover:opacity-100" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold leading-snug text-white/90 group-hover:text-white">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-[11px] text-white/40 group-hover:text-white/55">
            {subtitle}
          </span>
        ) : null}
      </span>
      {meta ? (
        <span className="mt-0.5 flex-shrink-0 text-[10px] font-semibold tabular-nums text-white/30">
          {meta}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando atalhos">
      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/25 p-3">
          <div className="mb-3 h-3 w-24 animate-pulse rounded bg-white/10" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, row) => (
              <div key={row} className="h-10 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Sidebar da raiz de atualizações: recentes, estilos e atalhos. */
export function AtualizacoesAcervoSidebar({ home, loading = false }: AtualizacoesAcervoSidebarProps) {
  const [continueItem, setContinueItem] = useState<ContinueListening | null>(null);
  const [recentFolders, setRecentFolders] = useState<RecentFolder[]>([]);

  useEffect(() => {
    setContinueItem(getContinueListening());
    setRecentFolders(getRecentFolders().slice(0, 5));
  }, []);

  if (loading && !home) {
    return (
      <aside className="rounded-2xl border border-[#1ed760]/20 bg-[#17191d] p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:p-4">
        <SidebarSkeleton />
      </aside>
    );
  }

  const continueDisplay = continueItem ? getTrackDisplayMetadata(continueItem) : null;
  const latest = home?.latestTracks.slice(0, 5) ?? [];
  const genres = home?.genres.slice(0, 10) ?? [];
  const periods = home?.periodLinks.slice(0, 5) ?? [];
  const news = home?.newsBanner;

  return (
    <aside className="rounded-2xl border border-[#1ed760]/20 bg-[#17191d] p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:p-4">
      <div className="mb-3.5 rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#1ed760]/10 via-transparent to-transparent px-3.5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1ed760]/90">Atalhos</p>
        <h2 className="mt-1 text-[15px] font-bold tracking-tight text-white">Seu fluxo rápido</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-white/45">
          Recentes, estilos e pastas sem perder o ritmo.
        </p>
        {news ? (
          <Link
            href={news.href}
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[#1ed760]/30 bg-[#1ed760]/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1ed760] transition-colors hover:bg-[#1ed760]/20"
          >
            Ver novidades
          </Link>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {continueDisplay && continueItem ? (
          <SidebarSection title="Continuar" icon={Disc3}>
            <SidebarLink
              href={continueItem.href}
              title={continueDisplay.title}
              subtitle={`${continueDisplay.artist} · ${continueItem.styleName}`}
            />
          </SidebarSection>
        ) : null}

        <SidebarSection title="Mais recentes" icon={Sparkles}>
          {latest.length > 0 ? (
            latest.map((track) => {
              const display = getTrackDisplayMetadata(track);
              return (
                <SidebarLink
                  key={track.id}
                  href={track.href}
                  title={display.title}
                  subtitle={`${display.artist} · ${track.styleName}`}
                />
              );
            })
          ) : (
            <p className="px-2 py-3 text-center text-[12px] text-white/35">
              Sem lançamentos recentes no momento.
            </p>
          )}
        </SidebarSection>

        <SidebarSection title="Estilos" icon={Music2}>
          {genres.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 px-0.5 pb-0.5">
              {genres.map((genre) => (
                <Link
                  key={`${genre.styleFolderId}-${genre.slug}`}
                  href={genre.href}
                  className="rounded-md border border-[#1ed760]/25 bg-[rgba(30,215,96,0.07)] px-2.5 py-1 text-[11px] font-semibold text-white/80 transition-colors hover:border-[#1ed760]/45 hover:bg-[#1ed760]/15 hover:text-white"
                >
                  {genre.name}
                  {genre.trackCount > 0 ? (
                    <span className="ml-1 tabular-nums text-white/35">{genre.trackCount}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-2 py-2 text-[12px] text-white/35">
              Estilos aparecem conforme o acervo sincroniza.
            </p>
          )}
        </SidebarSection>

        {recentFolders.length > 0 ? (
          <SidebarSection title="Visitadas" icon={Clock3} defaultOpen={false}>
            {recentFolders.map((folder) => (
              <SidebarLink
                key={`${folder.href}-${folder.visitedAt}`}
                href={folder.href}
                title={folder.name}
              />
            ))}
          </SidebarSection>
        ) : null}

        {periods.length > 0 ? (
          <SidebarSection title="Períodos" icon={FolderOpen} defaultOpen={false}>
            {periods.map((period) => (
              <SidebarLink
                key={period.id}
                href={period.href}
                title={period.label}
                meta={period.count > 0 ? String(period.count) : undefined}
              />
            ))}
          </SidebarSection>
        ) : null}
      </div>
    </aside>
  );
}
