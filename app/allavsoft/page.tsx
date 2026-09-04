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
  Info,
  KeyRound,
  MonitorPlay,
  Music2,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { AllavsoftActions } from "../components/AllavsoftActions";
import { IconBox } from "../components/IconBox";
import { SectionHeading } from "../components/SectionHeading";
import { CARD_COLORS, COLOR_CYCLE, PLACEHOLDER } from "../lib/theme";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("allavsoft");

const features = [
  {
    icon: FileVideo,
    title: "Vídeos e Áudios",
    description:
      "Baixe vídeos em diferentes resoluções e extraia o áudio nos formatos mais usados, como MP3, WAV e FLAC, conforme a disponibilidade do conteúdo.",
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
    icon: Film,
    title: "Conversão de Formatos",
    description:
      "Converta seus arquivos para MP4, AVI, MOV, MKV, MP3, AAC e diversos outros formatos de vídeo e áudio.",
    color: "blue" as const,
  },
  {
    icon: Download,
    title: "Download em Lote",
    description:
      "Adicione vários links de uma só vez e deixe o Allavsoft processar os downloads em sequência, economizando tempo em tarefas repetitivas.",
    color: "green" as const,
  },
  {
    icon: MonitorPlay,
    title: "Gravador de Tela",
    description:
      "Capture conteúdos reproduzidos no computador utilizando o recurso integrado de gravação de tela.",
    color: "yellow" as const,
  },
  {
    icon: Music2,
    title: "Metadados e Legendas",
    description:
      "Quando disponíveis, preserve informações do arquivo e trabalhe com legendas para manter sua biblioteca mais completa e organizada.",
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
    title: "Acesso Protegido",
    description:
      "Use uma ferramenta dedicada para organizar seus downloads e conversões em um ambiente simples e centralizado.",
    color: "yellow" as const,
  },
  {
    icon: Globe,
    title: "Ampla Compatibilidade",
    description:
      "Trabalhe com conteúdos provenientes de diversos sites e serviços compatíveis sem precisar utilizar uma ferramenta diferente para cada fonte.",
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
    title: "Copie o link",
    text: "Copie a URL do vídeo, áudio ou conteúdo disponível em uma plataforma compatível.",
  },
  {
    icon: FileVideo,
    title: "Cole no Allavsoft",
    text: "Adicione o endereço no programa e escolha a qualidade, o formato e as opções desejadas.",
  },
  {
    icon: Download,
    title: "Baixe e converta",
    text: "Inicie o processo e deixe o Allavsoft realizar o download e, quando solicitado, a conversão do arquivo automaticamente.",
  },
];

const formats = [
  {
    icon: FileVideo,
    title: "Vídeo",
    text: "Compatibilidade com formatos populares como MP4, AVI, MOV, MKV, WMV, FLV e outros.",
  },
  {
    icon: Music2,
    title: "Áudio",
    text: "Converta e extraia áudio em formatos como MP3, WAV, FLAC, AAC, M4A e outras opções compatíveis.",
  },
  {
    icon: KeyRound,
    title: "Licença",
    text: "Acesso às funcionalidades premium conforme o tipo e o período da licença disponibilizada no seu plano.",
  },
];

const faqs = [
  {
    q: "O Allavsoft está incluso na assinatura do Brazilian Remix Service?",
    a: "Sim. Assinantes com acesso às ferramentas inclusas podem utilizar o Allavsoft conforme as condições do plano contratado, com instruções enviadas após a confirmação.",
  },
  {
    q: "Posso baixar de quais sites?",
    a: "O Allavsoft é compatível com mais de mil sites e plataformas de mídia, incluindo serviços populares de vídeo, áudio e streaming, conforme suporte da ferramenta.",
  },
  {
    q: "Quais formatos posso converter?",
    a: "É possível trabalhar com formatos de vídeo como MP4, AVI, MOV e MKV, além de áudio em MP3, WAV, FLAC, AAC, M4A e outras opções compatíveis.",
  },
  {
    q: "Como funciona o download em lote?",
    a: "Você pode adicionar vários links de uma só vez e deixar o Allavsoft processar os downloads em sequência, ideal para listas e coleções maiores.",
  },
  {
    q: "Preciso instalar o programa no computador?",
    a: "Sim. O Allavsoft é instalado no seu computador para gerenciar downloads, conversões e gravações de tela de forma local.",
  },
  {
    q: "Posso comprar o Allavsoft sem assinar o plano de pools?",
    a: "Sim. Se você não assina o plano de pools, pode solicitar acesso avulso ao Allavsoft pelo WhatsApp. Nossa equipe informa valores e instruções de ativação.",
  },
  {
    q: "O que inclui a licença premium?",
    a: "A licença libera os recursos premium disponíveis no Allavsoft conforme o plano contratado. As informações de ativação são fornecidas junto com o seu acesso.",
  },
  {
    q: "Onde gerencio minha licença após a compra?",
    a: "Clientes com acesso ativo podem entrar na Área do cliente em /portal com e-mail e senha fornecidos, para consultar credenciais e orientações de uso.",
  },
];

export default function AllavsoftPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:space-y-16 sm:px-6 sm:py-16">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="rounded-xl border border-[#002776]/60 bg-[#002776]/20 p-2 transition-colors hover:bg-[#002776]/40">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-3xl tracking-wide text-[#FFDF00]">ALLAVSOFT</h1>
        </div>
        <AllavsoftActions compact className="!flex-row !gap-2" />
      </div>

      <section className="text-center">
        <SectionHeading
          badge="Ferramenta"
          title="Allavsoft"
          subtitle="Baixe vídeos, músicas e outros conteúdos de diferentes plataformas com mais praticidade. Centralize downloads, conversões e gravações em uma única ferramenta."
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
        <AllavsoftActions className="mt-10" />
      </section>

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

      <section>
        <SectionHeading title="Formatos e utilidades" />
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {formats.map((f, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={f.title} className={`rounded-2xl border ${c.border} bg-white/[0.04] p-6 text-center`}>
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${c.iconBg}`}>
                  <f.icon className={`h-6 w-6 ${c.text}`} />
                </div>
                <h4 className="font-semibold text-white">{f.title}</h4>
                <p className="mt-2 text-sm text-gray-400">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#FFDF00]/30 bg-[#FFDF00]/5 p-8 text-center">
        <h3 className="flex items-center justify-center gap-2 font-display text-xl text-[#FFDF00]">
          <Info className="h-6 w-6" /> Sobre a Licença
        </h3>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">
          A licença libera os recursos premium disponíveis no Allavsoft conforme as condições do plano contratado. As
          informações de ativação e configuração são fornecidas junto com o seu acesso.
        </p>
        <AllavsoftActions className="mt-8" />
      </section>

      <section id="faq" className="border-t border-white/5 site-section-blue px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            badge="FAQ"
            title="Perguntas frequentes"
            subtitle="Tire suas dúvidas sobre o Allavsoft, formatos, licença e formas de acesso."
          />
          <div className="mt-12 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-[#002776]/60 bg-white/[0.04] p-4 open:border-[#009739]/50">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-[#FFDF00] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-gray-400">{faq.a}</p>
              </details>
            ))}
          </div>
          <AllavsoftActions variant="banner" className="mt-12" />
        </div>
      </section>
    </div>
  );
}
