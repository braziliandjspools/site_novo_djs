import Image from "next/image";
import type { ReactNode } from "react";
import { FolderOpen } from "lucide-react";
import { MUSICAS_HERO_BG_SRC, MUSICAS_HERO_COVER_SRC } from "../lib/musicas-hero-art";

type AtualizacoesAcervoHeroProps = {
  monthCount: number;
  hasVip: boolean;
  badgeActions?: ReactNode;
};

/** Hero minimalista da raiz de Atualizações. */
export function AtualizacoesAcervoHero({ monthCount, hasVip, badgeActions }: AtualizacoesAcervoHeroProps) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-xl">
      <Image
        src={MUSICAS_HERO_BG_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/30" aria-hidden />

      <div className="relative z-10 flex flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:gap-8 sm:px-7 sm:py-10">
        <div className="relative mx-auto h-40 w-40 flex-shrink-0 overflow-hidden rounded-md shadow-[0_16px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:mx-0 sm:h-48 sm:w-48">
          <Image
            src={MUSICAS_HERO_COVER_SRC}
            alt="BRS — Brazilian Remix Service"
            fill
            className="object-cover"
            sizes="192px"
            priority
          />
        </div>

        <div className="min-w-0 flex-1 text-center sm:pb-0.5 sm:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Acervo VIP</p>
          <h1 className="mt-1.5 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Atualizações
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            Navegue pelas pastas do Drive e ouça as faixas. Envie packs ao BRS Downloader quando quiser baixar no PC.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-zinc-400 sm:justify-start">
            <span className="inline-flex items-center gap-1.5 tabular-nums text-zinc-300">
              <FolderOpen className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
              {monthCount} {monthCount === 1 ? "pasta" : "pastas"}
            </span>
            <span className="text-zinc-700" aria-hidden>
              ·
            </span>
            <span className={hasVip ? "text-[#1ed760]" : "text-zinc-500"}>
              {hasVip ? "Premium ativo" : "Só navegação"}
            </span>
            {badgeActions ? <span className="inline-flex items-center gap-2">{badgeActions}</span> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
