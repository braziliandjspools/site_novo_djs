import { BRS_LOGO_SRC } from "../../components/BrsLogo";
import Image from "next/image";

const WELCOME_TEXT =
  "🎉 Bem-vindo ao nosso acervo exclusivo! 🚀 Usuários VIP têm acesso a downloads ilimitados de todo o nosso conteúdo. Se você é um visitante, para baixar os arquivos e ter acesso completo, é necessário assinar um de nossos planos. Torne-se VIP e aproveite o melhor da música sem limites! ✨";

const HERO_BG = "/images/atualizacoes-hero-bg.jpg";

type AtualizacoesAcervoHeroProps = {
  monthCount: number;
  hasVip: boolean;
};

export function AtualizacoesAcervoHero({ monthCount, hasVip }: AtualizacoesAcervoHeroProps) {
  return (
    <section className="relative mb-8 w-full overflow-hidden rounded-md bg-[#0a0a0a]">
      <Image
        src={HERO_BG}
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="relative mb-4 h-14 w-full max-w-xs sm:h-16">
            <Image
              src={BRS_LOGO_SRC}
              alt="Brazilian Remix Service (BRS)"
              fill
              className="object-contain object-left"
              priority
              sizes="320px"
            />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1ed760]">Acervo VIP</p>
          <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            Atualizações
          </h1>
          <p className="mt-4 max-w-3xl text-justify text-sm leading-relaxed text-zinc-200 sm:text-base">
            {WELCOME_TEXT}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <span className="rounded-full bg-black/40 px-4 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-white/10">
            {monthCount} {monthCount === 1 ? "mês" : "meses"}
          </span>
          <span
            className={`rounded-full px-4 py-2 text-xs font-bold ring-1 ring-white/10 ${
              hasVip ? "bg-[#1ed760]/15 text-[#1ed760]" : "bg-black/40 text-zinc-400"
            }`}
          >
            {hasVip ? "Premium ativo" : "Visualização"}
          </span>
        </div>
      </div>
    </section>
  );
}
