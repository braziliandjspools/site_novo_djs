"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ParallaxLayer = {
  depth: number;
  className: string;
  content?: React.ReactNode;
};

const floatingLayers: ParallaxLayer[] = [
  {
    depth: 0.04,
    className: "left-[8%] top-[18%] h-48 w-48 rounded-full bg-green-600/30 blur-3xl",
  },
  {
    depth: 0.07,
    className: "right-[10%] top-[22%] h-56 w-56 rounded-full bg-emerald-600/20 blur-3xl",
  },
  {
    depth: 0.05,
    className: "bottom-[20%] left-[35%] h-40 w-40 rounded-full bg-green-600/35 blur-3xl",
  },
  {
    depth: 0.1,
    className:
      "right-[22%] bottom-[28%] h-32 w-32 rotate-45 rounded-2xl border border-[#FFDF00]/20 bg-[#FFDF00]/5 backdrop-blur-sm",
  },
  {
    depth: 0.08,
    className:
      "left-[14%] bottom-[30%] h-24 w-24 rounded-full border border-[#009739]/30 bg-[#009739]/10 backdrop-blur-sm",
  },
  {
    depth: 0.12,
    className:
      "top-[32%] right-[8%] h-16 w-16 rounded-full border border-[#6B9FFF]/30 bg-[#002776]/40 backdrop-blur-sm",
  },
];

const HERO_STATS = [
  {
    target: 315,
    prefix: "+",
    suffix: " GB",
    label: "Acervo VIP",
    color: "text-green-300",
    accent: "from-green-500/25 via-transparent to-transparent",
    ring: "ring-green-400/25",
  },
  {
    target: 739,
    prefix: "",
    suffix: "",
    label: "Pastas",
    color: "text-emerald-300",
    accent: "from-emerald-500/20 via-transparent to-transparent",
    ring: "ring-emerald-400/20",
  },
  {
    target: 40012,
    prefix: "+",
    suffix: "",
    label: "Músicas",
    color: "text-green-300",
    accent: "from-green-500/25 via-transparent to-transparent",
    ring: "ring-green-400/25",
    format: "pt-BR" as const,
  },
];

function formatStatValue(value: number, format?: "pt-BR") {
  if (format === "pt-BR") {
    return new Intl.NumberFormat("pt-BR").format(Math.round(value));
  }
  return String(Math.round(value));
}

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function StatCounter({
  target,
  prefix,
  suffix,
  label,
  color,
  accent,
  ring,
  format,
  active,
  delayMs,
}: {
  target: number;
  prefix: string;
  suffix: string;
  label: string;
  color: string;
  accent: string;
  ring: string;
  format?: "pt-BR";
  active: boolean;
  delayMs: number;
}) {
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    let startAt = 0;
    const duration = 2200;

    const tick = (now: number) => {
      if (!startAt) startAt = now + delayMs;
      const elapsed = now - startAt;
      if (elapsed < 0) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, elapsed / duration);
      setValue(target * easeOutExpo(progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setValue(target);
        setDone(true);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, delayMs, target]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#101010] p-6 ring-1 transition-all duration-700 sm:p-8 ${ring} ${
        active ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-[0.97] opacity-0"
      }`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} aria-hidden />
      <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 sm:text-[11px]">
        {label}
      </p>
      <p
        className={`relative mt-3 font-display text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl md:text-7xl ${color}`}
        aria-label={`${prefix}${formatStatValue(target, format)}${suffix} ${label}`}
      >
        <span className="tabular-nums">
          {prefix}
          {formatStatValue(value, format)}
          {suffix}
        </span>
        {!done ? (
          <span className="ml-1 inline-block h-[0.78em] w-[0.1em] animate-pulse bg-current align-[-0.08em] opacity-80" />
        ) : null}
      </p>
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [statsActive, setStatsActive] = useState(false);

  useEffect(() => {
    const node = statsRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStatsActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);

    // Fallback: se já estiver no viewport no load, anima mesmo assim
    const fallback = window.setTimeout(() => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setStatsActive(true);
        observer.disconnect();
      }
    }, 500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden bg-[#100b1c]"
      >
        {floatingLayers.map((layer, index) => (
          <div
            key={index}
            className={`pointer-events-none absolute transition-transform duration-300 ease-out will-change-transform ${layer.className}`}
            style={{
              transform: `translate(${offset.x * layer.depth * 120}px, ${offset.y * layer.depth * 120}px)`,
            }}
            aria-hidden
          >
            {layer.content}
          </div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-br from-[#102615]/80 via-[#130e21]/90 to-[#0b0a11]" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-16 text-center sm:px-6 md:pb-20 md:pt-24">
          <div
            className="animate-fade-in-up transition-transform duration-300 ease-out will-change-transform"
            style={{
              transform: `translate(${offset.x * -8}px, ${offset.y * -6}px)`,
            }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-400/35 bg-green-400/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-green-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Pools · Curadoria · Remix Services
            </span>
            <h1 className="font-display break-words text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl md:text-7xl">
              O repertório que move <span className="bg-gradient-to-r from-green-300 via-emerald-300 to-green-400 bg-clip-text text-transparent">a sua pista.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300 sm:text-lg">
              Remixes, DJ pools, versões extended e intro edits em um só lugar. Descubra novos sons, organize seu repertório e prepare sets para qualquer pista.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <a
                href="/musicas"
                className="inline-flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-green-500 px-7 py-4 text-sm font-extrabold text-white shadow-[0_12px_35px_-14px_rgba(30,215,96,0.85)] transition hover:bg-green-400 sm:w-auto sm:min-w-[245px] sm:text-base"
              >
                Explorar a plataforma
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link
                href="/musicas/atualizacoes"
                className="inline-flex w-full max-w-md items-center justify-center rounded-full border border-green-300/35 bg-white/[0.06] px-7 py-4 text-sm font-bold text-white transition hover:bg-green-400/15 sm:w-auto sm:min-w-[260px] sm:text-base"
              >
                Ver últimas atualizações
              </Link>
            </div>
          </div>
        </div>
        <div className="br-stripe relative z-10" />
      </section>

      <section
        ref={statsRef}
        className="relative z-10 border-b border-green-400/10 bg-[#100d1b] px-4 py-10 sm:px-6 md:-mt-2 md:py-12"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {HERO_STATS.map((stat, i) => (
            <StatCounter key={stat.label} {...stat} active={statsActive} delayMs={i * 180} />
          ))}
        </div>
      </section>
    </>
  );
}
