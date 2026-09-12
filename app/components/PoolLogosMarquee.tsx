"use client";

import Image from "next/image";

type PoolLogo = {
  src: string;
  name: string;
  /** Logos escuras: inverte para aparecer no fundo dark */
  dark?: boolean;
};

const POOL_LOGOS: PoolLogo[] = [
  { src: "/images/pools/pool-01.png", name: "Pool" },
  { src: "/images/pools/pool-02-remixplanet.png", name: "RemixPlanet" },
  { src: "/images/pools/pool-03-digital-music-pool.png", name: "Digital Music Pool" },
  { src: "/images/pools/pool-04-mastermix.png", name: "Mastermix", dark: true },
  { src: "/images/pools/pool-05.png", name: "Pool" },
  { src: "/images/pools/pool-06.png", name: "Pool" },
  { src: "/images/pools/pool-07.png", name: "Pool", dark: true },
  { src: "/images/pools/pool-08-throwbackz.png", name: "Da Throwbackz", dark: true },
  { src: "/images/pools/pool-09-club-killers.png", name: "Club Killers" },
  { src: "/images/pools/pool-10-ultimix.png", name: "Ultimix", dark: true },
];

function LogoCard({ logo }: { logo: PoolLogo }) {
  return (
    <div className="flex h-28 w-40 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#1a1a1a] px-3 py-3 sm:h-32 sm:w-48">
      <Image
        src={logo.src}
        alt={logo.name}
        width={180}
        height={180}
        sizes="160px"
        quality={70}
        loading="lazy"
        className={`h-full w-full object-contain ${
          logo.dark
            ? "pool-logo-dark"
            : "pool-logo-light"
        }`}
      />
    </div>
  );
}

/** 10 logos de pools correndo sob o catálogo — pausa no hover. */
export function PoolLogosMarquee({ className = "" }: { className?: string }) {
  const loop = [...POOL_LOGOS, ...POOL_LOGOS];

  return (
    <div
      className={`relative w-full min-w-0 max-w-full overflow-hidden py-1 ${className}`}
      aria-label="Logos de pools"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#121212] to-transparent sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#121212] to-transparent sm:w-20" />

      <div className="pools-marquee-track flex w-max gap-4 hover:[animation-play-state:paused] sm:gap-5">
        {loop.map((logo, index) => (
          <LogoCard key={`${logo.src}-${index}`} logo={logo} />
        ))}
      </div>
    </div>
  );
}
