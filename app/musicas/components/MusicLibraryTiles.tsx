"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, FolderOpen, Music2 } from "lucide-react";
import { prefetchMusicasJson } from "../lib/musicas-fetch-cache";

const TILE_TONES = [
  "from-[#ff6b35] via-[#e85d04] to-[#9b2226]",
  "from-[#00b4d8] via-[#0077b6] to-[#023e8a]",
  "from-[#2dc653] via-[#14919b] to-[#0a4d68]",
  "from-[#f4a261] via-[#e76f51] to-[#9c2a1e]",
  "from-[#48cae4] via-[#0096c7] to-[#014f86]",
  "from-[#80ed99] via-[#57cc99] to-[#22577a]",
  "from-[#ffb703] via-[#fb8500] to-[#8b4513]",
  "from-[#ef476f] via-[#d62828] to-[#6a040f]",
  "from-[#06d6a0] via-[#118ab2] to-[#073b4c]",
  "from-[#ff9f1c] via-[#ffbf69] to-[#c1121f]",
] as const;

export function libraryTileTone(index: number): string {
  return TILE_TONES[Math.abs(index) % TILE_TONES.length]!;
}

type MusicLibraryTileProps = {
  href: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  index?: number;
  tone?: string;
  icon?: LucideIcon;
  resolveSlug?: string;
  trackCount?: number | null;
  folderCount?: number | null;
  imageUrl?: string | null;
  className?: string;
  size?: "shelf" | "grid";
  /** Formato circular (artistas) */
  round?: boolean;
  /** overlay = título na imagem; below = imagem/capa + título embaixo */
  caption?: "overlay" | "below";
};

export function MusicLibraryTile({
  href,
  title,
  subtitle,
  badge,
  index = 0,
  tone,
  icon: Icon = FolderOpen,
  resolveSlug,
  trackCount,
  folderCount,
  imageUrl,
  className = "",
  size = "grid",
  round = false,
  caption = "overlay",
}: MusicLibraryTileProps) {
  const gradient = tone ?? libraryTileTone(index);
  const meta =
    typeof trackCount === "number" && trackCount > 0
      ? `${trackCount.toLocaleString("pt-BR")} ${trackCount === 1 ? "faixa" : "faixas"}`
      : typeof folderCount === "number" && folderCount > 0
        ? `${folderCount} ${folderCount === 1 ? "pasta" : "pastas"}`
        : subtitle?.trim() || null;
  const cover = imageUrl?.trim() || null;

  function prefetchApi() {
    if (!resolveSlug) return;
    prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`);
  }

  const sizeClass =
    size === "shelf"
      ? "h-[148px] w-[148px] shrink-0 sm:h-[168px] sm:w-[168px]"
      : "aspect-square w-full min-h-[140px]";

  const radius = round ? "rounded-full" : "rounded-xl";

  if (caption === "below") {
    return (
      <article className={`group/tile min-w-0 ${className}`}>
        <Link
          href={href}
          prefetch={false}
          onMouseEnter={prefetchApi}
          onFocus={prefetchApi}
          aria-label={title}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1012]"
        >
          <div
            className={`relative overflow-hidden ${radius} shadow-[0_12px_28px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition duration-300 ease-out group-hover/tile:-translate-y-1 group-hover/tile:ring-white/25 ${sizeClass}`}
          >
            {cover ? (
              <span className="absolute inset-0 block" aria-hidden>
                <Image
                  src={cover}
                  alt=""
                  width={size === "shelf" ? 168 : 400}
                  height={size === "shelf" ? 168 : 400}
                  sizes={size === "shelf" ? "168px" : "(max-width:768px) 45vw, 200px"}
                  className="h-full w-full object-cover transition duration-500 group-hover/tile:scale-105"
                  unoptimized={cover.startsWith("/api/")}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
              </span>
            ) : (
              <>
                <span className={`absolute inset-0 bg-gradient-to-br ${gradient}`} aria-hidden />
                <span
                  className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl transition duration-500 group-hover/tile:bg-white/25"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-black/25 blur-2xl"
                  aria-hidden
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/25 text-white/95 ring-1 ring-white/20 backdrop-blur-sm sm:h-16 sm:w-16">
                    <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} aria-hidden />
                  </span>
                </span>
              </>
            )}

            {badge ? (
              <span className="absolute top-2.5 right-2.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
                {badge}
              </span>
            ) : null}
          </div>
        </Link>

        <div className="mt-2.5 min-w-0 px-0.5 text-center">
          <Link
            href={href}
            prefetch={false}
            onMouseEnter={prefetchApi}
            onFocus={prefetchApi}
            className="outline-none"
          >
            <h3 className="line-clamp-2 text-[13px] font-bold leading-snug tracking-tight text-white transition-colors hover:text-[#1ed760] sm:text-[14px]">
              {title}
            </h3>
          </Link>
          {meta ? (
            <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50">
              {meta}
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={prefetchApi}
      onFocus={prefetchApi}
      aria-label={title}
      className={`group relative block overflow-hidden ${radius} shadow-[0_12px_28px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition duration-300 ease-out hover:-translate-y-1 hover:ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760]/60 ${sizeClass} ${className}`}
    >
      {cover ? (
        <span className="absolute inset-0 block overflow-hidden" aria-hidden>
          {/* width/height fixos evitam o warning de fill com parent height 0 no layout inicial */}
          <Image
            src={cover}
            alt=""
            width={size === "shelf" ? 168 : 400}
            height={size === "shelf" ? 168 : 400}
            sizes={size === "shelf" ? "168px" : "(max-width:768px) 45vw, 200px"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            unoptimized={cover.startsWith("/api/")}
          />
          <span
            className={`absolute inset-0 bg-gradient-to-t ${round ? "from-black/80 via-black/20 to-transparent" : "from-black/85 via-black/25 to-black/10"}`}
          />
        </span>
      ) : (
        <>
          <span className={`absolute inset-0 bg-gradient-to-br ${gradient}`} aria-hidden />
          <span
            className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl transition duration-500 group-hover:bg-white/25"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-black/25 blur-2xl"
            aria-hidden
          />
        </>
      )}

      <span className="absolute inset-0 flex flex-col justify-between p-3 sm:p-3.5">
        <span className="flex items-start justify-between gap-2">
          {!cover ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/25 text-white/90 backdrop-blur-sm ring-1 ring-white/15">
              <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </span>
          ) : (
            <span />
          )}
          {badge ? (
            <span className="rounded-md bg-black/35 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
              {badge}
            </span>
          ) : null}
        </span>

        <span className={`min-w-0 ${round ? "text-center" : ""}`}>
          <span className="line-clamp-2 block text-[13px] font-bold leading-snug tracking-tight text-white drop-shadow-sm sm:text-[14px]">
            {title}
          </span>
          {meta ? (
            <span
              className={`mt-1 flex items-center gap-1 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-white/75 ${round ? "justify-center" : ""}`}
            >
              {typeof trackCount === "number" && trackCount > 0 ? (
                <Music2 className="h-3 w-3 flex-shrink-0 opacity-80" aria-hidden />
              ) : null}
              {meta}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}

type MusicLibraryShelfProps = {
  title: string;
  children: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

/** Prateleira horizontal com slide (setas + snap). */
export function MusicLibraryShelf({
  title,
  children,
  actionHref,
  actionLabel = "Ver tudo",
  className = "",
}: MusicLibraryShelfProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const frame = window.requestAnimationFrame(updateArrows);
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(() => {
      window.requestAnimationFrame(updateArrows);
    });
    ro.observe(el);
    return () => {
      window.cancelAnimationFrame(frame);
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.85)) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section className={`relative min-w-0 ${className}`}>
      <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
        <h2 className="text-[17px] font-bold tracking-tight text-white sm:text-[19px]">{title}</h2>
        <div className="flex items-center gap-2">
          {actionHref ? (
            <Link
              href={actionHref}
              prefetch={false}
              className="text-[12px] font-semibold text-white/45 transition-colors hover:text-[#1ed760]"
            >
              {actionLabel}
            </Link>
          ) : null}
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              aria-label="Anterior"
              disabled={!canPrev}
              onClick={() => scrollByDir(-1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15 disabled:cursor-default disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Próximo"
              disabled={!canNext}
              onClick={() => scrollByDir(1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15 disabled:cursor-default disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="relative">
        {canPrev ? (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 bg-gradient-to-r from-[#101412] to-transparent sm:block"
            aria-hidden
          />
        ) : null}
        {canNext ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 bg-gradient-to-l from-[#101412] to-transparent sm:block"
            aria-hidden
          />
        ) : null}
        <div
          ref={scrollerRef}
          className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-2 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:snap-start [&>*]:shrink-0"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
