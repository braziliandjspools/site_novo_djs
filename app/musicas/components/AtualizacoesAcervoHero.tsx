import Image from "next/image";
import { Music2 } from "lucide-react";
import { BRS_LOGO_SRC } from "../../components/BrsLogo";

type AtualizacoesAcervoHeroProps = {
  monthCount: number;
  hasVip: boolean;
};

/** Hero estilo capa de playlist (streaming). */
export function AtualizacoesAcervoHero({ monthCount, hasVip }: AtualizacoesAcervoHeroProps) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#1ed760]/35 via-[#0d3d22] to-[#121212]"
        aria-hidden
      />
      <div
        className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#1ed760]/20 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:gap-8 sm:px-8 sm:py-10">
        <div className="relative mx-auto flex h-44 w-44 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#1ed760] to-[#0a5c2c] shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:mx-0 sm:h-52 sm:w-52">
          <Image
            src={BRS_LOGO_SRC}
            alt=""
            fill
            className="object-contain p-6 opacity-95"
            sizes="208px"
            priority
          />
          <Music2 className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 text-black/40" />
        </div>

        <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">Acervo VIP</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
            Atualizações
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            Navegue pelas pastas, ouça as faixas e envie packs ao BRS Downloader — layout em tela cheia para
            explorar o acervo como em um streaming.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold tabular-nums text-white ring-1 ring-white/15">
              {monthCount} {monthCount === 1 ? "pasta" : "pastas"}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
                hasVip
                  ? "bg-[#1ed760]/20 text-[#1ed760] ring-[#1ed760]/40"
                  : "bg-black/35 text-zinc-300 ring-white/15"
              }`}
            >
              {hasVip ? "Premium ativo" : "Prévia 1 min"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
