import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ChevronDown,
  Clipboard,
  Download,
  FileVideo,
  Film,
  Globe,
  KeyRound,
  MonitorPlay,
  Music2,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { AllavsoftPurchaseCta } from "../components/AllavsoftPurchaseCta";
import { IconBox } from "../components/IconBox";
import { SectionHeading } from "../components/SectionHeading";
import { SITE_ALLAVSOFT_PLANS } from "../lib/plans";
import { getAuthenticatedPortalUser } from "../lib/portal";
import { CARD_COLORS, COLOR_CYCLE, PLACEHOLDER } from "../lib/theme";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("allavsoft");

const features = [
  {
    icon: Music2,
    title: "Deezer, Spotify e YouTube",
    description:
      "Baixe faixas e vídeos das principais plataformas de streaming e vídeo — Deezer, Spotify, YouTube e muito mais, conforme o suporte do Allavsoft.",
    color: "green" as const,
  },
  {
    icon: Globe,
    title: "+1000 Sites",
    description:
      "Compatível com uma ampla variedade de sites e plataformas de mídia, permitindo centralizar seus downloads em uma única ferramenta.",
    color: "yellow" as const,
  },
  {
    icon: FileVideo,
    title: "Vídeos e Áudios",
    description:
      "Baixe vídeos em diferentes resoluções e extraia o áudio nos formatos mais usados, como MP3, WAV e FLAC, conforme a disponibilidade do conteúdo.",
    color: "blue" as const,
  },
  {
    icon: Film,
    title: "Conversão de Formatos",
    description:
      "Converta seus arquivos para MP4, AVI, MOV, MKV, MP3, AAC e diversos outros formatos de vídeo e áudio.",
    color: "green" as const,
  },
  {
    icon: Download,
    title: "Download em Lote",
    description:
      "Adicione vários links de uma só vez e deixe o Allavsoft processar os downloads em sequência, economizando tempo em tarefas repetitivas.",
    color: "yellow" as const,
  },
  {
    icon: MonitorPlay,
    title: "Gravador de Tela",
    description:
      "Capture conteúdos reproduzidos no computador utilizando o recurso integrado de gravação de tela.",
    color: "blue" as const,
  },
];

const highlights = [
  {
    icon: Zap,
    title: "Download Rápido",
    description:
      "Gerencie seus downloads de forma prática e aproveite os recursos do Allavsoft para baixar e converter arquivos em uma única operação.",
    color: "green" as const,
  },
  {
    icon: Shield,
    title: "Licença vitalícia",
    description:
      "Pagamento único via Mercado Pago. Após a confirmação do webhook, o acesso fica liberado na sua conta sem renovação mensal.",
    color: "yellow" as const,
  },
  {
    icon: KeyRound,
    title: "Serial no portal",
    description:
      "O gerenciamento do serial fica na área do cliente. A geração e a exibição do serial serão disponibilizadas após a liberação do pagamento.",
    color: "blue" as const,
  },
  {
    icon: Film,
    title: "Conversão Total",
    description:
      "Transforme vídeos e áudios entre diversos formatos e escolha a opção mais adequada para computador, celular, players, edição ou arquivamento.",
    color: "green" as const,
  },
  {
    icon: Star,
    title: "Interface Intuitiva",
    description:
      "Cole o link, escolha suas preferências e inicie o processo. A interface foi desenvolvida para tornar downloads e conversões mais simples.",
    color: "yellow" as const,
  },
  {
    icon: MonitorPlay,
    title: "Gravador de Tela",
    description:
      "Além dos downloads, utilize a captura de tela para gravar conteúdos reproduzidos diretamente no seu computador.",
    color: "blue" as const,
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
    q: "Quais formatos posso converter?",
    a: "É possível trabalhar com formatos de vídeo como MP4, AVI, MOV e MKV, além de áudio em MP3, WAV, FLAC, AAC, M4A e outras opções compatíveis.",
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
          className="inline-flex items-center justify-center rounded-full bg-[#FFDF00] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#002776] transition hover:bg-[#FFE566]"
        >
          Comprar por R$ 50
        </a>
      </div>

      <section className="text-center">
        <SectionHeading
          badge="Licença vitalícia"
          title="Allavsoft"
          subtitle="Baixe de Deezer, Spotify, YouTube e +1000 sites. Licença vitalícia por R$ 50,00 via Mercado Pago, com serial no portal do cliente."
        />
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-[#002776]/60 bg-white/[0.03] p-2">
          <Image
            src={PLACEHOLDER.allavsoft}
            alt="Allavsoft"
            width={1200}
            height={600}
            className="h-auto w-full rounded-xl object-contain"
            sizes="(max-width: 768px) 100vw, 768px"
            quality={82}
          />
        </div>
      </section>

      <AllavsoftPurchaseCta plans={plans} alreadyOwned={alreadyOwned} />

      <section>
        <SectionHeading badge="Funcionalidades" title="Principais recursos" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <IconBox key={f.title} icon={f.icon} title={f.title} description={f.description} color={f.color} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Recursos em destaque" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((h) => (
            <IconBox key={h.title} icon={h.icon} title={h.title} description={h.description} color={h.color} />
          ))}
        </div>
      </section>

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
