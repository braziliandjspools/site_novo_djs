"use client";

import { Loader2 } from "lucide-react";

function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}

export function MusicasPageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Carregando">
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#181818] p-5 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <SkeletonPulse className="mx-auto h-40 w-40 flex-shrink-0 sm:mx-0 sm:h-48 sm:w-48" />
          <div className="min-w-0 flex-1 space-y-3">
            <SkeletonPulse className="h-3 w-24" />
            <SkeletonPulse className="h-10 w-3/4 max-w-md" />
            <SkeletonPulse className="h-4 w-full max-w-lg" />
            <div className="flex gap-2 pt-2">
              <SkeletonPulse className="h-7 w-20 rounded-full" />
              <SkeletonPulse className="h-7 w-28 rounded-full" />
            </div>
          </div>
          <SkeletonPulse className="h-28 w-full max-w-sm flex-shrink-0" />
        </div>
      </div>
      <MusicasFolderGridSkeleton cards={8} />
    </div>
  );
}

export function MusicasFolderGridSkeleton({ cards = 8 }: { cards?: number }) {
  const tones = [
    "from-[#00c853]/80 via-[#0a7a4a]/80 to-[#050505]/90",
    "from-[#3b82f6]/80 via-[#1e3a8a]/80 to-[#050505]/90",
    "from-[#f59e0b]/80 via-[#9a3412]/80 to-[#050505]/90",
    "from-[#14b8a6]/80 via-[#0f766e]/80 to-[#050505]/90",
    "from-[#a3e635]/80 via-[#4d7c0f]/80 to-[#050505]/90",
  ];
  return (
    <div className="mx-auto w-full max-w-[1280px]" aria-busy="true" aria-label="Carregando pastas">
      <div className="mb-6 flex flex-col items-center gap-2 sm:mb-8">
        <SkeletonPulse className="h-6 w-36" />
        <SkeletonPulse className="h-3 w-64" />
      </div>
      <div className="grid grid-cols-1 justify-items-center gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: cards }).map((_, index) => (
          <div
            key={index}
            className={`flex h-[300px] w-full max-w-[240px] flex-col justify-between overflow-hidden rounded-[22px] border border-white/[0.08] bg-gradient-to-b p-4 sm:h-[390px] sm:p-5 ${tones[index % tones.length]}`}
          >
            <SkeletonPulse className="h-3 w-16" />
            <div className="space-y-2">
              <SkeletonPulse className="h-5 w-[90%]" />
              <SkeletonPulse className="h-3 w-full" />
              <SkeletonPulse className="h-3 w-[70%]" />
              <SkeletonPulse className="mt-3 h-3 w-24" />
            </div>
            <SkeletonPulse className="h-3 w-28" />
          </div>
        ))}
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

      {/* Mobile: alinhado ao StreamingTrackRow */}
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

      {/* Desktop: capa | título | duração | ações */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#12141a] to-[#0f1012] md:block">
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.015] px-3.5 py-2.5">
          <SkeletonPulse className="h-7 w-36 rounded-full" />
        </div>
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
    <div className="flex min-h-screen flex-col bg-[#121212]" aria-busy="true" aria-label="Carregando">
      <div className="border-b border-white/5 bg-[#0a0a0a]">
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
      <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-5 px-3 py-6 sm:px-5 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#181818] p-5 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <SkeletonPulse className="mx-auto h-40 w-40 flex-shrink-0 sm:mx-0 sm:h-48 sm:w-48" />
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonPulse className="h-3 w-24" />
              <SkeletonPulse className="h-10 w-3/4 max-w-md" />
              <SkeletonPulse className="h-4 w-full max-w-lg" />
            </div>
          </div>
        </div>
        <MusicasFolderGridSkeleton cards={6} />
      </div>
    </div>
  );
}
