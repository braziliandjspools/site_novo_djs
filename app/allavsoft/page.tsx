import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ChevronDown,
  Clipboard,
  Download,
  Infinity,
  KeyRound,
  Shield,
  Wallet,
} from "lucide-react";
import { AllavsoftPlatformsMarquee } from "../components/AllavsoftPlatformsMarquee";
import { AllavsoftPurchaseCta } from "../components/AllavsoftPurchaseCta";
import { IconBox } from "../components/IconBox";
import { SectionHeading } from "../components/SectionHeading";
import { SITE_ALLAVSOFT_PLANS } from "../lib/plans";
import { getAuthenticatedPortalUser } from "../lib/portal";
import { CARD_COLORS, COLOR_CYCLE, PLACEHOLDER } from "../lib/theme";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("allavsoft");

const highlightBoxes = [
  {
    icon: Wallet,
    title: "R$ 50,00",
    description: "Pagamento único. Sem mensalidade e sem surpresa no cartão.",
    color: "yellow" as const,
  },
  {
    icon: Infinity,
    title: "Licença vitalícia",
    description: "Um pagamento e o Allavsoft fica disponível para você continuar usando.",
    color: "green" as const,
  },
  {
    icon: KeyRound,
    title: "Serial no portal",
    description: "Após a compra, o serial de ativação fica no portal do cliente.",
    color: "blue" as const,
  },
  {
    icon: Download,
    title: "Várias plataformas",
    description: "Deezer, Spotify, YouTube e +1000 sites compatíveis em um só app.",
    color: "yellow" as const,
  },
];

const steps = [
  {
    icon: Clipboard,
    title: "Pague no Mercado Pago",
    text: "Escolha a licença vitalícia de R$ 50,00, faça login e conclua o pagamento único no Checkout Pro.",
  },
  {
    icon: Shield,
    title: "Webhook libera o acesso",
    text: "Com o pagamento aprovado, o webhook ativa o Allavsoft na sua conta automaticamente.",
  },
  {
    icon: KeyRound,
    title: "Serial no portal",
    text: "O serial será gerenciado na área do cliente. Em seguida, use o Allavsoft no seu computador.",
  },
];

const faqs = [
  {
    q: "Quanto custa a licença do Allavsoft?",
    a: "R$ 50,00 em pagamento único via Mercado Pago, com licença vitalícia.",
  },
  {
    q: "Como funciona a liberação após o pagamento?",
    a: "O Mercado Pago notifica nosso webhook. Com o pagamento aprovado, o acesso Allavsoft é liberado automaticamente na sua conta.",
  },
  {
    q: "Onde vejo o serial?",
    a: "No portal do cliente (/portal). A geração e a disponibilidade do serial serão disponibilizadas na área do serviço Allavsoft.",
  },
  {
    q: "Preciso assinar o plano de pools?",
    a: "Não. A licença Allavsoft é um produto separado, com valor único e vitalício.",
  },
  {
    q: "Posso baixar de quais sites?",
    a: "Sim. O Allavsoft cobre Deezer, Spotify, YouTube e mais de mil sites de áudio, vídeo e streaming, conforme o suporte atual da ferramenta.",
  },
  {
    q: "Preciso instalar o programa no computador?",
    a: "Sim. O Allavsoft é instalado no seu computador para gerenciar downloads, conversões e gravações de tela de forma local.",
  },
];

export default async function AllavsoftPage() {
  const plans = SITE_ALLAVSOFT_PLANS.filter((plan) => plan.id).map((plan) => ({
    id: plan.id!,
    name: plan.name,
    price: plan.price,
    period: plan.period,
    features: plan.features,
    description: plan.description,
  }));

  const user = await getAuthenticatedPortalUser();
  const alreadyOwned = Boolean(user?.services.allavsoft);

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:space-y-16 sm:px-6 sm:py-16">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="rounded-xl border border-[#002776]/60 bg-[#002776]/20 p-2 transition-colors hover:bg-[#002776]/40"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-3xl tracking-wide text-[#FFDF00]">ALLAVSOFT</h1>
        </div>
        <a
          href="#allavsoft-plano"
          className="inline-flex items-center justify-center rounded-full bg-[#009739] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#00B347]"
        >
          Comprar por R$ 50
        </a>
      </div>

      <section>
        <SectionHeading badge="Licença vitalícia" title="Licença vitalícia do Allavsoft" />
        <div className="mx-auto mt-6 max-w-5xl space-y-4 text-justify text-base leading-relaxed text-gray-400 md:text-lg">
          <p>
            Tenha acesso a uma ferramenta completa para facilitar seus downloads de músicas e vídeos de diferentes
            plataformas em um só lugar. O Allavsoft é uma solução prática para quem trabalha com música, vídeo,
            criação de conteúdo ou simplesmente quer organizar seus arquivos de forma mais rápida e eficiente.
          </p>
          <p>
            Com ele, você pode baixar conteúdos de plataformas como{" "}
            <strong className="font-semibold text-gray-200">Deezer, Spotify, YouTube</strong> e diversos outros
            serviços compatíveis, reunindo em um único programa várias possibilidades de download. Isso ajuda a
            economizar tempo, evita depender de várias ferramentas diferentes e deixa sua rotina muito mais simples.
          </p>
          <p>
            A licença é <strong className="font-semibold text-gray-200">vitalícia</strong>, ou seja, você faz um único
            pagamento de <strong className="font-semibold text-gray-200">R$ 50,00</strong> e não precisa pagar
            mensalidade para continuar usando. Após a confirmação da compra, o serial de ativação fica disponível
            diretamente no portal do cliente, para que você possa consultar sempre que precisar.
          </p>
          <p>
            É uma opção interessante para DJs, produtores, criadores de conteúdo e usuários que baixam músicas e
            vídeos com frequência e procuram uma solução prática para o dia a dia.
          </p>
          <p>
            Além da facilidade de uso, o Allavsoft permite centralizar vários tipos de download em um único aplicativo,
            trazendo mais agilidade para quem precisa montar repertórios, salvar referências, organizar conteúdos ou
            preparar materiais para uso posterior.
          </p>
          <p>
            O processo é simples: você adquire a licença, acessa o portal do cliente, consulta seu serial e realiza a
            ativação do programa. Depois disso, a licença permanece disponível para seu uso, sem cobrança recorrente.
          </p>
          <p>
            <strong className="font-semibold text-gray-200">Valor da licença: R$ 50,00</strong>
            <br />
            Pagamento único. Licença vitalícia. Serial disponível no portal do cliente.
          </p>
          <p>
            Compatível com downloads de músicas e vídeos de diferentes plataformas suportadas pelo programa. Uma
            solução prática para quem quer mais liberdade, organização e rapidez na hora de baixar seus conteúdos.
          </p>
          <p className="text-sm text-zinc-500 md:text-base">
            Use sempre de acordo com os termos de cada plataforma e apenas para conteúdos que você tenha autorização
            ou direito de baixar.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlightBoxes.map((box) => (
            <IconBox
              key={box.title}
              icon={box.icon}
              title={box.title}
              description={box.description}
              color={box.color}
            />
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border border-[#009739]/30 bg-white/[0.03] p-2">
          <Image
            src={PLACEHOLDER.allavsoft}
            alt="Allavsoft"
            width={1200}
            height={600}
            className="h-auto w-full rounded-xl object-contain"
            sizes="(max-width: 768px) 100vw, 1024px"
            quality={82}
            priority
          />
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Compatível com Deezer, Spotify, YouTube, Vimeo e +1000 sites
          </p>
          <AllavsoftPlatformsMarquee />
        </div>
      </section>

      <AllavsoftPurchaseCta plans={plans} alreadyOwned={alreadyOwned} />

      <section>
        <SectionHeading title="Como funciona" />
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={step.title} className={`rounded-2xl border ${c.border} bg-white/[0.04] p-6`}>
                <span className={`font-display text-3xl font-bold ${c.text} opacity-50`}>{`0${index + 1}`}</span>
                <div className="mt-3 flex items-center gap-2">
                  <step.icon className={`h-5 w-5 ${c.text}`} />
                  <h4 className="font-semibold text-white">{step.title}</h4>
                </div>
                <p className="mt-2 text-sm text-gray-400">{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <AllavsoftPurchaseCta plans={plans} alreadyOwned={alreadyOwned} />

      <section id="faq" className="border-t border-white/5 site-section-blue px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            badge="FAQ"
            title="Perguntas frequentes"
            subtitle="Pagamento, webhook, serial no portal e uso do Allavsoft."
          />
          <div className="mt-12 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-[#002776]/60 bg-white/[0.04] p-4 open:border-[#009739]/50"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-[#FFDF00] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-gray-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
