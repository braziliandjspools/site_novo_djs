import Image from "next/image";
import type { ReactNode } from "react";
import { MUSICAS_HERO_BG_SRC, MUSICAS_HERO_COVER_SRC } from "../lib/musicas-hero-art";

type AtualizacoesAcervoHeroProps = {
  monthCount: number;
  hasVip: boolean;
  badgeActions?: ReactNode;
};

/** Hero estilo capa de playlist (streaming). */
export function AtualizacoesAcervoHero({ monthCount, hasVip, badgeActions }: AtualizacoesAcervoHeroProps) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl">
      <Image
        src={MUSICAS_HERO_BG_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/30" aria-hidden />

      <div className="relative flex flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:gap-8 sm:px-8 sm:py-10">
        <div className="relative mx-auto h-44 w-44 flex-shrink-0 overflow-hidden rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.55)] ring-1 ring-white/15 sm:mx-0 sm:h-52 sm:w-52">
          <Image
            src={MUSICAS_HERO_COVER_SRC}
            alt="BRS — Brazilian Remix Service"
            fill
            className="object-cover"
            sizes="208px"
            priority
          />
        </div>

        <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
          <p className="text-eyebrow text-white/70">Acervo VIP</p>
          <h1 className="text-page-title mt-2 text-white">Atualizações</h1>
          <p className="text-secondary mt-3 max-w-2xl">
            Navegue pelas pastas, ouça as faixas e envie packs ao BRS Downloader — layout em tela cheia para
            explorar o acervo como em um streaming.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="text-badge rounded-full bg-black/35 px-3 py-1.5 tabular-nums text-white ring-1 ring-white/15">
              {monthCount} {monthCount === 1 ? "pasta" : "pastas"}
            </span>
            <span
              className={`text-badge rounded-full px-3 py-1.5 ring-1 ${
                hasVip
                  ? "bg-[#1ed760]/20 text-[#1ed760] ring-[#1ed760]/40"
                  : "bg-black/35 text-zinc-300 ring-white/15"
              }`}
            >
              {hasVip ? "Premium ativo" : "Prévia 1 min"}
            </span>
            {badgeActions}
          </div>
        </div>
      </div>
    </section>
  );
}
