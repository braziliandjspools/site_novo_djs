"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MUSICAS_HERO_BG_SRC, MUSICAS_HERO_COVER_SRC } from "./lib/musicas-hero-art";

function formatUserDateTime(date: Date) {
  const datePart = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
  return { datePart, timePart };
}

export function MusicasPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const clock = now ? formatUserDateTime(now) : null;

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl">
      <Image
        src={MUSICAS_HERO_BG_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/35" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/25" aria-hidden />

      <div className="relative flex flex-col gap-5 px-3 py-6 sm:flex-row sm:items-end sm:gap-6 sm:px-4 sm:py-8">
        <div className="relative mx-auto h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg shadow-[0_16px_36px_rgba(0,0,0,0.5)] ring-1 ring-white/15 sm:mx-0 sm:h-36 sm:w-36">
          <Image
            src={MUSICAS_HERO_COVER_SRC}
            alt="Brazilian Remix Service"
            fill
            className="object-cover"
            sizes="144px"
            priority
          />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-eyebrow text-[#1ed760]/90">Brazilian Remix Service</p>
          <h1 className="text-page-title mt-2 text-white">{title}</h1>
          {subtitle && <p className="text-secondary mt-2 max-w-2xl">{subtitle}</p>}
          {clock ? (
            <div className="mt-4 space-y-1">
              <p className="text-base capitalize text-zinc-200 sm:text-lg md:text-xl">
                {clock.datePart}
              </p>
              <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-[#1ed760] sm:text-3xl md:text-4xl">
                {clock.timePart}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2" aria-hidden>
              <p className="h-5 w-56 animate-pulse rounded bg-white/10 sm:h-6 sm:w-72" />
              <p className="h-8 w-36 animate-pulse rounded bg-white/10 sm:h-9" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
