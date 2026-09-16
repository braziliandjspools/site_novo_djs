"use client";

import { Loader2 } from "lucide-react";

function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

/** Skeleton da home de biblioteca (header + shelves + tiles). */
export function MusicasPageSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Carregando biblioteca">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2a24] via-[#121816] to-[#0c0e0d] px-4 py-5 ring-1 ring-white/10 sm:px-6 sm:py-6">
        <SkeletonPulse className="h-3 w-40" />
        <SkeletonPulse className="mt-3 h-9 w-56 sm:w-72" />
        <SkeletonPulse className="mt-3 h-4 w-full max-w-md" />
        <div className="mt-4 flex flex-wrap gap-2">
          <SkeletonPulse className="h-7 w-20 rounded-lg" />
          <SkeletonPulse className="h-7 w-24 rounded-lg" />
          <SkeletonPulse className="h-7 w-28 rounded-lg" />
        </div>
        <SkeletonPulse className="mt-4 h-11 w-full max-w-xs rounded-full" />
      </div>

      <SkeletonPulse className="h-12 w-full rounded-full bg-[#242424]" />

      <div className="space-y-3">
        <SkeletonPulse className="h-5 w-36" />
        <div className="-mx-1 flex gap-3 overflow-hidden px-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonPulse
              key={index}
              className="h-[148px] w-[148px] flex-shrink-0 rounded-xl sm:h-[168px] sm:w-[168px]"
            />
          ))}
        </div>
      </div>

      <MusicasFolderGridSkeleton cards={12} />
    </div>
  );
}

/** Grade de tiles quadrados — alinhada ao layout Amazon Music. */
export function MusicasFolderGridSkeleton({ cards = 12 }: { cards?: number }) {
  return (
    <div className="w-full" aria-busy="true" aria-label="Carregando pastas">
      <div className="mb-3 space-y-2 px-0.5">
        <SkeletonPulse className="h-5 w-40" />
        <SkeletonPulse className="h-3 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: cards }).map((_, index) => (
          <SkeletonPulse
            key={index}
            className={`aspect-square w-full rounded-xl ring-1 ring-white/5 ${
              index % 3 === 0 ? "opacity-90" : "opacity-70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** @deprecated Prefer MusicasFolderGridSkeleton (tiles). */
export function MusicasFolderButtonsSkeleton({ rows = 8 }: { rows?: number }) {
  return <MusicasFolderGridSkeleton cards={Math.max(rows, 8)} />;
}

export function MusicasBrowseFoldersSkeleton({ rows = 12 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando subpastas">
      <SkeletonPulse className="h-10 w-40 rounded-full lg:hidden" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div className="hidden space-y-3 rounded-2xl border border-white/10 bg-[#121614] p-3.5 lg:block">
          <SkeletonPulse className="h-20 w-full rounded-xl" />
          <SkeletonPulse className="h-32 w-full rounded-xl" />
          <SkeletonPulse className="h-28 w-full rounded-xl" />
        </div>
        <MusicasFolderGridSkeleton cards={rows} />
      </div>
    </div>
  );
}

export function MusicasListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-md border border-zinc-700/70 bg-black" aria-busy="true">
      <div className="border-b border-zinc-700/60 bg-[#0a0a0a] px-4 py-3">
        <SkeletonPulse className="h-3 w-32" />
      </div>
      <div className="divide-y divide-zinc-800">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <SkeletonPulse className="h-4 w-4 flex-shrink-0" />
            <SkeletonPulse className={`h-4 flex-1 ${index % 3 === 0 ? "max-w-[70%]" : "max-w-[55%]"}`} />
            <SkeletonPulse className="h-7 w-7 flex-shrink-0 rounded-md" />
            <SkeletonPulse className="h-7 w-7 flex-shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton de grade de artistas (tiles). */
export function MusicasArtistGridSkeleton({ cards = 12 }: { cards?: number }) {
  return <MusicasFolderGridSkeleton cards={cards} />;
}

export function MusicasTracksSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite" aria-label="Carregando músicas">
      <div className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#12141a] to-[#0f1012] px-4 py-3.5">
        <Loader2 className="mt-0.5 h-4 w-4 flex-shrink-0 animate-spin text-[#1ed760]" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100">As músicas estão carregando…</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Pode demorar um pouco se a pasta tiver muitos arquivos.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#12141a] to-[#0f1012] md:hidden">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-b border-white/[0.06] px-3.5 py-3.5 last:border-b-0"
          >
            <SkeletonPulse className="h-12 w-12 flex-shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonPulse className={`h-3.5 w-full ${index % 3 === 0 ? "max-w-[92%]" : "max-w-[75%]"}`} />
              <SkeletonPulse className={`h-3 w-full ${index % 2 === 0 ? "max-w-[55%]" : "max-w-[40%]"}`} />
              <SkeletonPulse className="h-2.5 w-16" />
            </div>
            <SkeletonPulse className="h-10 w-10 flex-shrink-0 rounded-xl" />
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#12141a] to-[#0f1012] md:block">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[52px_minmax(0,1fr)_auto_48px_36px] items-center gap-x-3 border-b border-white/[0.06] px-3.5 py-2.5 last:border-b-0"
          >
            <SkeletonPulse className="mx-auto h-11 w-11 rounded-xl" />
            <div className="min-w-0 space-y-2 py-0.5">
              <SkeletonPulse className={`h-3.5 w-full ${index % 3 === 0 ? "max-w-[85%]" : "max-w-[70%]"}`} />
              <SkeletonPulse className={`h-3 w-full ${index % 2 === 0 ? "max-w-[45%]" : "max-w-[35%]"}`} />
            </div>
            <SkeletonPulse className="ml-auto h-3 w-8" />
            <SkeletonPulse className="mx-auto h-9 w-9 rounded-xl" />
            <SkeletonPulse className="ml-auto h-9 w-9 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MusicasAuthShellSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[#101412]" aria-busy="true" aria-label="Carregando">
      <div className="border-b border-white/5 bg-[#0e1110]">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-3 sm:h-[4.25rem] sm:px-5 lg:px-8">
          <SkeletonPulse className="h-8 w-36" />
          <div className="ml-4 hidden gap-2 md:flex">
            <SkeletonPulse className="h-9 w-24 rounded-full" />
            <SkeletonPulse className="h-9 w-28 rounded-full" />
            <SkeletonPulse className="h-9 w-24 rounded-full" />
          </div>
          <div className="ml-auto flex gap-2">
            <SkeletonPulse className="h-9 w-9 rounded-full" />
            <SkeletonPulse className="h-9 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-6 sm:px-5 lg:px-8">
        <MusicasPageSkeleton />
      </div>
    </div>
  );
}
