import Image from "next/image";
import { MUSICAS_HERO_BG_SRC, MUSICAS_HERO_COVER_SRC } from "./lib/musicas-hero-art";

export function MusicasPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
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
            alt="BRS — Brazilian Remix Service"
            fill
            className="object-cover"
            sizes="144px"
            priority
          />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1ed760]/90">BRS Music</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm text-zinc-300 sm:text-base">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
