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
      <MusicasListSkeleton rows={8} />
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
      <div className="flex items-start gap-3 rounded-md border border-zinc-700/60 bg-[#141414] px-4 py-3">
        <Loader2 className="mt-0.5 h-4 w-4 flex-shrink-0 animate-spin text-[#1ed760]" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100">As músicas estão carregando…</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Pode demorar um pouco se a pasta tiver muitos arquivos.
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-zinc-700/70 bg-black">
        <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.75rem_3.75rem_5.5rem] gap-x-3 border-b border-zinc-700/60 bg-[#0a0a0a] px-4 py-2">
          <SkeletonPulse className="mx-auto h-3 w-4" />
          <SkeletonPulse className="h-3 w-16" />
          <SkeletonPulse className="mx-auto h-3 w-6" />
          <SkeletonPulse className="mx-auto h-3 w-8" />
          <SkeletonPulse className="ml-auto h-3 w-10" />
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.75rem_3.75rem_5.5rem] items-center gap-x-3 border-b border-zinc-800 px-4 py-3"
          >
            <SkeletonPulse className="mx-auto h-3 w-5" />
            <div className="flex min-w-0 items-center gap-3">
              <SkeletonPulse className="h-9 w-9 flex-shrink-0 rounded-full" />
              <SkeletonPulse className="h-4 w-full max-w-xs" />
            </div>
            <SkeletonPulse className="mx-auto h-3 w-6" />
            <SkeletonPulse className="mx-auto h-3 w-8" />
            <div className="flex justify-end gap-1">
              <SkeletonPulse className="h-7 w-7 rounded-md" />
              <SkeletonPulse className="h-7 w-7 rounded-md" />
            </div>
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
      <div className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-6 sm:px-5 lg:px-8">
        <MusicasPageSkeleton />
      </div>
    </div>
  );
}
