import Image from "next/image";
import type { ReactNode } from "react";
import { FolderOpen, Sparkles } from "lucide-react";
import { MUSICAS_HERO_BG_SRC, MUSICAS_HERO_COVER_SRC } from "../lib/musicas-hero-art";

type AtualizacoesAcervoHeroProps = {
  monthCount: number;
  hasVip: boolean;
  badgeActions?: ReactNode;
};

/** Hero da raiz de Atualizações — BR suave (menos saturado), alinhado aos níveis internos. */
export function AtualizacoesAcervoHero({ monthCount, hasVip, badgeActions }: AtualizacoesAcervoHeroProps) {
  return (
    <section className="relative mb-5 overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
      <Image
        src={MUSICAS_HERO_BG_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center scale-105"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#009739]/35 via-[#002776]/30 to-black/75"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-12 top-0 h-44 w-44 rounded-full bg-[#1ed760]/12 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-[#6B9FFF]/12 blur-3xl"
        aria-hidden
      />

      <div className="br-stripe-thin relative z-10" />

      <div className="relative z-10 flex flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:gap-8 sm:px-8 sm:py-10">
        <div className="relative mx-auto h-44 w-44 flex-shrink-0 sm:mx-0 sm:h-52 sm:w-52">
          <div
            className="absolute -inset-[2px] rounded-xl bg-gradient-to-br from-[#009739]/80 to-[#002776]/80 opacity-80"
            aria-hidden
          />
          <div className="relative h-full w-full overflow-hidden rounded-[10px] shadow-[0_20px_50px_rgba(0,0,0,0.55)] ring-1 ring-white/15">
            <Image
              src={MUSICAS_HERO_COVER_SRC}
              alt="BRS — Brazilian Remix Service"
              fill
              className="object-cover"
              sizes="208px"
              priority
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7dffb0]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Acervo VIP · BRS
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Atualizações
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            Explore as pastas do Drive, abra cada nível em uma página nova e ouça as faixas — envie packs ao{" "}
            <span className="font-semibold text-[#1ed760]">BRS Downloader</span> quando quiser baixar no PC.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#009739]/20 px-3 py-1.5 text-[11px] font-bold tabular-nums text-[#7dffb0] ring-1 ring-[#1ed760]/35">
              <FolderOpen className="h-3.5 w-3.5" aria-hidden />
              {monthCount} {monthCount === 1 ? "pasta" : "pastas"}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ${
                hasVip
                  ? "bg-[#1ed760]/18 text-[#1ed760] ring-[#1ed760]/35"
                  : "bg-[#002776]/40 text-[#9ec0ff] ring-[#6B9FFF]/30"
              }`}
            >
              {hasVip ? "Premium ativo" : "Só navegação"}
            </span>
            {badgeActions}
          </div>
        </div>
      </div>
    </section>
  );
}
