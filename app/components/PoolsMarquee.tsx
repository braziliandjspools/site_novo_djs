"use client";

const MARQUEE_POOLS = [
  "Ultimix",
  "Funkymix",
  "Mastermix",
  "DMC",
  "Club Killers",
  "BPM Supreme",
  "Promo Only",
  "X-Mix",
  "Hot Tracks",
  "Crooklyn Clan",
  "Latin Remix Kings",
  "Beatport",
  "DJ City",
] as const;

const ACCENTS = [
  "from-[#009739]/40 to-[#009739]/10 border-[#009739]/40 text-[#7dffb0]",
  "from-[#FFDF00]/25 to-[#FFDF00]/5 border-[#FFDF00]/35 text-[#FFE566]",
  "from-[#6B9FFF]/30 to-[#002776]/20 border-[#6B9FFF]/35 text-[#9fc2ff]",
  "from-[#1DB954]/35 to-[#1DB954]/10 border-[#1DB954]/40 text-[#1ed760]",
] as const;

function PoolCard({ name, index }: { name: string; index: number }) {
  return (
    <div
      className={`flex h-28 w-52 flex-shrink-0 flex-col justify-between rounded-2xl border bg-gradient-to-br p-4 shadow-[0_12px_32px_rgba(0,0,0,0.35)] sm:h-32 sm:w-60 ${ACCENTS[index % ACCENTS.length]}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Pool</span>
      <p className="font-display text-lg font-bold leading-tight text-white sm:text-xl">{name}</p>
    </div>
  );
}

/** Faixa infinita de pools: direita → esquerda, pausa no hover. */
export function PoolsMarquee() {
  const loop = [...MARQUEE_POOLS, ...MARQUEE_POOLS];

  return (
    <div className="relative w-full overflow-hidden py-2" aria-label="Pools em destaque">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#121212] to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#121212] to-transparent sm:w-24" />

      <div className="pools-marquee-track flex w-max gap-4 hover:[animation-play-state:paused] sm:gap-5">
        {loop.map((name, index) => (
          <PoolCard key={`${name}-${index}`} name={name} index={index} />
        ))}
      </div>
    </div>
  );
}
