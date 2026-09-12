"use client";

import Image from "next/image";

const PLATFORMS = [
  { src: "/images/allavsoft-platforms/deezer.png", name: "Deezer" },
  { src: "/images/allavsoft-platforms/spotify.png", name: "Spotify" },
  { src: "/images/allavsoft-platforms/youtube.png", name: "YouTube" },
  { src: "/images/allavsoft-platforms/vimeo.png", name: "Vimeo" },
] as const;

function LogoCard({ src, name }: { src: string; name: string }) {
  return (
    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] sm:h-20 sm:w-20">
      <Image
        src={src}
        alt={name}
        width={80}
        height={80}
        sizes="80px"
        quality={70}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

/** Logos Deezer / Spotify / YouTube / Vimeo sob a seção Allavsoft. */
export function AllavsoftPlatformsMarquee() {
  // Repete para o loop ficar contínuo com poucas logos
  const loop = [...PLATFORMS, ...PLATFORMS, ...PLATFORMS, ...PLATFORMS];

  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden py-1" aria-label="Plataformas suportadas pelo Allavsoft">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#121212] to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#121212] to-transparent sm:w-16" />

      <div className="allavsoft-marquee-track flex w-max max-w-none gap-3 hover:[animation-play-state:paused] sm:gap-4">
        {loop.map((logo, index) => (
          <LogoCard key={`${logo.name}-${index}`} src={logo.src} name={logo.name} />
        ))}
      </div>
    </div>
  );
}
