"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteImage } from "./SiteImage";
import { PLACEHOLDER } from "../lib/theme";

const HERO_TYPEWRITER_WORDS = [
  "a sua pista.",
  "seu set.",
  "a noite.",
  "sua festa.",
  "o seu show.",
];

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function readReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function TypewriterWords({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const reduceMotion = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false);

  useEffect(() => {
    if (reduceMotion) return;
    const full = words[index] ?? "";
    const typingMs = deleting ? 36 : 70;
    const pauseMs = deleting ? 220 : 1600;

    if (!deleting && text === full) {
      const pause = window.setTimeout(() => setDeleting(true), pauseMs);
      return () => window.clearTimeout(pause);
    }
    if (deleting && text.length === 0) {
      const next = window.setTimeout(() => {
        setDeleting(false);
        setIndex((current) => (current + 1) % words.length);
      }, pauseMs);
      return () => window.clearTimeout(next);
    }

    const tick = window.setTimeout(() => {
      setText((current) =>
        deleting ? full.slice(0, Math.max(0, current.length - 1)) : full.slice(0, current.length + 1),
      );
    }, typingMs);
    return () => window.clearTimeout(tick);
  }, [deleting, index, reduceMotion, text, words]);

  if (reduceMotion) {
    return <span>{words[0]}</span>;
  }

  return (
    <span className="inline-block min-w-0 text-left sm:min-w-[7ch]">
      {text}
      <span className="ml-0.5 inline-block h-[0.9em] w-[0.08em] translate-y-[0.08em] animate-pulse bg-current align-middle" aria-hidden />
    </span>
  );
}

type ParallaxLayer = {
  depth: number;
  className: string;
};

const floatingLayers: ParallaxLayer[] = [
  {
    depth: 0.04,
    className: "left-[6%] top-[12%] h-48 w-48 rounded-full bg-[#1db954]/25 blur-3xl",
  },
  {
    depth: 0.07,
    className: "right-[8%] top-[8%] h-56 w-56 rounded-full bg-[#FFDF00]/12 blur-3xl",
  },
  {
    depth: 0.05,
    className: "bottom-[12%] left-[28%] h-40 w-40 rounded-full bg-[#002776]/55 blur-3xl",
  },
];

const HERO_STATS = [
  {
    target: 315,
    prefix: "+",
    suffix: " GB",
    label: "Acervo VIP",
    color: "text-[#1ed760]",
  },
  {
    target: 739,
    prefix: "",
    suffix: "",
    label: "Pastas",
    color: "text-[#FFDF00]",
  },
  {
    target: 40012,
    prefix: "+",
    suffix: "",
    label: "Músicas",
    color: "text-[#7eb6ff]",
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
  format,
  active,
  delayMs,
}: {
  target: number;
  prefix: string;
  suffix: string;
  label: string;
  color: string;
  format?: "pt-BR";
  active: boolean;
  delayMs: number;
}) {
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => {
        setValue(target);
        setDone(true);
      });
      return () => cancelAnimationFrame(frame);
    }

    let frame = 0;
    let startAt = 0;
    const duration = 1800;

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
    <div className="min-w-0 px-1 text-center sm:text-left">
      <p
        className={`font-display text-[1.35rem] font-extrabold leading-none tracking-[-0.04em] min-[400px]:text-2xl sm:text-4xl ${color}`}
        aria-label={`${prefix}${formatStatValue(target, format === "pt-BR" ? "pt-BR" : undefined)}${suffix} ${label}`}
      >
        <span className="tabular-nums">
          {prefix}
          {formatStatValue(value, format)}
          {suffix}
        </span>
        {!done ? (
          <span className="ml-1 inline-block h-[0.72em] w-[0.08em] animate-pulse bg-current align-[-0.06em] opacity-80" />
        ) : null}
      </p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-zinc-500 min-[400px]:text-[10px] min-[400px]:tracking-[0.14em] sm:tracking-[0.18em]">{label}</p>
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frameRef = useRef(0);
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
      { threshold: 0.2 },
    );
    observer.observe(node);

    const fallback = window.setTimeout(() => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setStatsActive(true);
        observer.disconnect();
      }
    }, 400);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      floatingLayers.forEach((layer, index) => {
        const node = layerRefs.current[index];
        if (!node) return;
        node.style.transform = `translate(${x * layer.depth * 90}px, ${y * layer.depth * 90}px)`;
      });
      if (contentRef.current) {
        contentRef.current.style.transform = `translate(${x * -8}px, ${y * -5}px)`;
      }
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    floatingLayers.forEach((_, index) => {
      const node = layerRefs.current[index];
      if (node) node.style.transform = "translate(0px, 0px)";
    });
    if (contentRef.current) contentRef.current.style.transform = "translate(0px, 0px)";
  }, []);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden bg-[#0b0b0d]"
    >
      {floatingLayers.map((layer, index) => (
        <div
          key={layer.className}
          ref={(node) => {
            layerRefs.current[index] = node;
          }}
          className={`pointer-events-none absolute will-change-transform ${layer.className}`}
          aria-hidden
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(29,185,84,0.18),transparent_46%),radial-gradient(ellipse_at_80%_20%,rgba(255,223,0,0.08),transparent_32%),linear-gradient(180deg,#10141a_0%,#0b0b0d_72%)]" />
      <div className="br-pattern pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 pb-6 pt-10 sm:gap-10 sm:px-6 sm:pb-8 sm:pt-14 md:pt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:pb-10 lg:pt-24">
        <div ref={contentRef} className="animate-fade-in-up text-center lg:text-left">
          <span className="mb-4 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-[#1db954]/35 bg-[#1db954]/10 px-3 py-2 text-[9px] font-extrabold uppercase leading-snug tracking-[0.12em] text-[#86efac] sm:mb-5 sm:px-4 sm:text-[10px] sm:tracking-[0.18em]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#1ed760]" />
            Pools · Curadoria · Remix Services
          </span>
          <h1 className="font-display text-balance break-words text-[1.85rem] font-black leading-[1.08] tracking-tight text-white min-[400px]:text-[2.05rem] sm:text-5xl md:text-6xl lg:text-[4.15rem]">
            O repertório que move{" "}
            <span className="bg-gradient-to-r from-[#1ed760] to-[#b6f5cf] bg-clip-text text-transparent">
              <TypewriterWords words={HERO_TYPEWRITER_WORDS} />
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-300 sm:mt-5 sm:text-lg lg:mx-0">
            Remixes, DJ pools, versões extended e intro edits em um só lugar. Descubra novos sons, organize seu repertório e prepare sets para qualquer pista.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center lg:justify-start">
            <a
              href="/musicas"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1db954] px-6 py-3.5 text-sm font-extrabold text-black shadow-[0_16px_40px_-18px_rgba(29,185,84,0.95)] transition active:scale-[0.98] hover:bg-[#1ed760] sm:w-auto sm:min-w-[230px] sm:px-7 sm:text-base [@media(hover:hover)]:hover:-translate-y-0.5"
            >
              Explorar a plataforma
              <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              href="/musicas/atualizacoes"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-white transition active:scale-[0.98] hover:border-[#1ed760]/45 hover:bg-[#1db954]/10 sm:w-auto sm:min-w-[230px] sm:px-7 sm:text-base"
            >
              Ver últimas atualizações
            </Link>
            <Link
              href="/plans"
              className="inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full border border-[#FFDF00]/35 px-6 py-3.5 text-sm font-semibold text-[#FFDF00] transition active:scale-[0.98] hover:bg-[#FFDF00]/10 hover:text-white sm:hidden"
            >
              Ver planos VIP
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Link
            href="/plans"
            className="mt-4 hidden items-center gap-1.5 text-sm font-semibold text-[#FFDF00] transition hover:text-white sm:inline-flex"
          >
            Ver planos VIP
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#111] shadow-[0_30px_80px_-36px_rgba(0,0,0,0.85)]">
            <SiteImage
              src={PLACEHOLDER.musicasPortal}
              alt="Portal de atualizações Brazilian Remix Service"
              fill
              priority
              quality={75}
              sizes="(max-width: 1024px) 92vw, 560px"
              className="object-cover object-[left_center]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1ed760] sm:tracking-[0.2em]">Plataforma VIP</p>
              <p className="mt-1 font-display text-lg font-semibold text-white sm:text-xl">
                Atualizações, previews e download no navegador
              </p>
            </div>
          </div>
        </div>
      </div>

      <div ref={statsRef} className="relative z-10 mx-auto max-w-6xl px-4 pb-8 sm:px-6 md:pb-10">
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-black/40 px-2 py-4 backdrop-blur-md min-[400px]:gap-2 min-[400px]:px-3 sm:gap-4 sm:px-6 sm:py-5">
          {HERO_STATS.map((stat, index) => (
            <StatCounter key={stat.label} {...stat} active={statsActive} delayMs={index * 140} />
          ))}
        </div>
      </div>
      <div className="br-stripe relative z-10" />
    </section>
  );
}
