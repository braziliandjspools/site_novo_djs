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
    className: "left-[8%] top-[18%] h-48 w-48 rounded-full bg-[#009739]/25 blur-3xl",
  },
  {
    depth: 0.07,
    className: "right-[10%] top-[22%] h-56 w-56 rounded-full bg-[#FFDF00]/15 blur-3xl",
  },
  {
    depth: 0.05,
    className: "bottom-[20%] left-[35%] h-40 w-40 rounded-full bg-[#002776]/50 blur-3xl",
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

/** DJs + 4 variantes no typewriter */
const DJ_VARIANTS = ["DJs", "sets", "a pista", "clubs", "festas"] as const;

const HERO_STATS = [
  {
    target: 315,
    prefix: "+",
    suffix: " GB",
    label: "Acervo VIP",
    color: "text-[#1ed760]",
    accent: "from-[#009739]/35 via-transparent to-transparent",
    ring: "ring-[#1ed760]/25",
  },
  {
    target: 739,
    prefix: "",
    suffix: "",
    label: "Pastas",
    color: "text-[#FFDF00]",
    accent: "from-[#FFDF00]/25 via-transparent to-transparent",
    ring: "ring-[#FFDF00]/20",
  },
  {
    target: 40012,
    prefix: "+",
    suffix: "",
    label: "Músicas",
    color: "text-[#7eb6ff]",
    accent: "from-[#6B9FFF]/30 via-transparent to-transparent",
    ring: "ring-[#6B9FFF]/25",
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

function TypewriterAudience() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const boot = window.setTimeout(() => setStarted(true), 400);
    return () => window.clearTimeout(boot);
  }, []);

  useEffect(() => {
    if (!started) return;

    const current = DJ_VARIANTS[index];
    const isFull = text === current;
    const isEmpty = text.length === 0;

    let delay = deleting ? 36 : 70;
    if (!deleting && isFull) delay = 1800;
    if (deleting && isEmpty) delay = 320;
    if (!deleting && isEmpty) delay = 120;

    const timer = window.setTimeout(() => {
      if (!deleting && !isFull) {
        setText(current.slice(0, text.length + 1));
        return;
      }
      if (!deleting && isFull) {
        setDeleting(true);
        return;
      }
      if (deleting && !isEmpty) {
        setText(current.slice(0, Math.max(0, text.length - 1)));
        return;
      }
      setDeleting(false);
      setIndex((prev) => (prev + 1) % DJ_VARIANTS.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [deleting, index, started, text]);

  return (
    <span className="inline-flex min-h-[1.05em] min-w-[6ch] items-baseline justify-center align-baseline sm:min-w-[7.5ch] md:justify-start">
      <span className="bg-gradient-to-r from-[#1ed760] via-[#FFDF00] to-[#6B9FFF] bg-clip-text text-transparent">
        {text || "\u00A0"}
      </span>
      <span
        className="ml-1 inline-block h-[0.82em] w-[0.11em] translate-y-[0.08em] animate-pulse bg-[#FFDF00]"
        aria-hidden
      />
    </span>
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
        className="relative overflow-hidden br-pattern"
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

        <div className="absolute inset-0 bg-gradient-to-b from-[#002776]/55 via-[#121212]/90 to-[#121212]" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-10 pt-16 text-center sm:px-6 md:pb-14 md:pt-28">
          <div
            className="animate-fade-in-up transition-transform duration-300 ease-out will-change-transform"
            style={{
              transform: `translate(${offset.x * -8}px, ${offset.y * -6}px)`,
            }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FFDF00]/40 bg-[#FFDF00]/10 px-5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FFDF00]">
              <span className="h-2 w-2 rounded-full bg-[#009739]" />
              Pools · Curadoria · Remix Services
            </span>
            <h1 className="font-display break-words text-3xl font-semibold leading-[1.08] text-white sm:text-5xl md:text-7xl">
              Packs, curadoria e conteúdo para <TypewriterAudience />
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300 sm:text-lg">
              Encontre músicas, edits, remixes, acapellas e versões exclusivas selecionadas para facilitar sua
              preparação. Tenha um repertório atualizado, organizado e pronto para deixar seus sets ainda mais
              completos.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <a
                href="#acervo"
                className="site-btn site-btn-primary w-full max-w-md px-8 py-4 text-base sm:w-auto sm:min-w-[260px] sm:px-10 sm:py-4 sm:text-lg"
              >
                Ver catálogo de pools
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link
                href="/musicas/atualizacoes"
                className="site-btn site-btn-ghost w-full max-w-md border-[#FFDF00]/60 px-8 py-4 text-base uppercase tracking-[0.08em] text-[#FFDF00] hover:bg-[#FFDF00]/10 sm:w-auto sm:min-w-[320px] sm:px-10 sm:py-4 sm:text-lg"
              >
                Acessar plataforma de músicas
              </Link>
            </div>
          </div>
        </div>
        <div className="br-stripe relative z-10" />
      </section>

      <section
        ref={statsRef}
        className="relative z-10 border-b border-white/5 bg-[#0b0b0b] px-4 py-10 sm:px-6 md:-mt-2 md:py-12"
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
