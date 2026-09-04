import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Check,
  ChevronDown,
  Clock,
  FolderKanban,
  Globe,
  Headphones,
  HelpCircle,
  KeyRound,
  ListMusic,
  Monitor,
  MonitorSmartphone,
  Music,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Star,
  User,
  Wifi,
  Zap,
  Laptop,
} from "lucide-react";
import { IconBox } from "../components/IconBox";
import { DeemixPurchaseCta } from "../components/DeemixPurchaseCta";
import { SectionHeading } from "../components/SectionHeading";
import { CARD_COLORS, COLOR_CYCLE, PLACEHOLDER } from "../lib/theme";
import { DEEMIX_ENABLED } from "../lib/feature-flags";
import { whatsappUrl } from "../lib/site";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("deemix");

const serverAdvantages = [
  {
    title: "Velocidade Máxima",
    text: "Nossa infraestrutura utiliza conexão de até 1 Gbit/s, permitindo que o servidor processe os downloads com alta velocidade e estabilidade.",
  },
  {
    title: "Sem Burocracia",
    text: "Nada de VPN, proxy ou configurações complicadas. Você acessa o sistema e utiliza as ferramentas de forma simples.",
  },
  {
    title: "Menos uso do seu computador",
    text: "O trabalho pesado acontece no servidor, reduzindo a necessidade de manter seu PC processando tarefas durante os downloads.",
  },
  {
    title: "Mais Privacidade",
    text: "O servidor atua como intermediário durante o processamento, evitando que seu computador faça diretamente todas as conexões com os serviços utilizados.",
  },
];

const serverFeatures = [
  {
    icon: AudioLines,
    title: "Qualidade Hi-Fi (FLAC)",
    description:
      "Baixe suas faixas em FLAC para máxima qualidade ou em MP3 320 kbps para um equilíbrio ideal entre qualidade e tamanho de arquivo.",
    color: "green" as const,
  },
  {
    icon: ListMusic,
    title: "Álbuns e Playlists",
    description:
      "Acesse singles, álbuns, discografias e playlists completas para montar ou ampliar seu acervo com muito mais rapidez.",
    color: "yellow" as const,
  },
  {
    icon: FolderKanban,
    title: "Organização Automática",
    description:
      "Mantenha sua biblioteca organizada automaticamente com tags ID3, capas em alta resolução, nomes padronizados e estrutura de pastas pronta para uso.",
    color: "blue" as const,
  },
  {
    icon: Search,
    title: "Busca Integrada",
    description:
      "Pesquise artistas, álbuns e músicas diretamente pelo sistema, encontre o que precisa em segundos e envie para download sem sair da interface.",
    color: "green" as const,
  },
];

const serverHighlights = [
  {
    icon: Zap,
    title: "Download Rápido",
    description:
      "Baixe músicas, álbuns e playlists com agilidade usando a infraestrutura do servidor, sem sobrecarregar o seu computador.",
    color: "green" as const,
  },
  {
    icon: Shield,
    title: "Acesso Protegido",
    description:
      "Utilize o serviço por meio de uma estrutura centralizada, com conexão protegida e gerenciamento feito pelo servidor.",
    color: "yellow" as const,
  },
  {
    icon: Globe,
    title: "Acesso Global",
    description:
      "Use o sistema de qualquer lugar com conexão à internet e mantenha sua central de downloads sempre disponível.",
    color: "blue" as const,
  },
  {
    icon: Headphones,
    title: "Qualidade Premium",
    description:
      "Escolha entre formatos de alta qualidade, incluindo FLAC e MP3 320 kbps, conforme a disponibilidade da faixa.",
    color: "green" as const,
  },
  {
    icon: Star,
    title: "Interface Intuitiva",
    description: "Pesquise, organize e gerencie seus downloads em uma interface simples, prática e fácil de usar.",
    color: "yellow" as const,
  },
  {
    icon: Clock,
    title: "Disponível 24/7",
    description:
      "Acesse o servidor a qualquer hora do dia para pesquisar músicas, iniciar downloads e organizar seu acervo.",
    color: "blue" as const,
  },
];

const serverSteps = [
  {
    title: "Assine um plano",
    text: "Escolha o período de acesso que melhor combina com você e conclua sua assinatura de forma simples.",
    icon: Check,
  },
  {
    title: "Receba seu acesso",
    text: "Após a confirmação, você recebe os dados necessários para configurar e utilizar o Deemix Server.",
    icon: KeyRound,
  },
  {
    title: "Baixe e configure",
    text: "Instale o aplicativo compatível com o seu sistema e siga as instruções de configuração para conectar ao servidor.",
    icon: Monitor,
  },
  {
    title: "Comece a baixar",
    text: "Pesquise suas músicas, escolha a qualidade desejada e gerencie seus downloads diretamente pela interface.",
    icon: Music,
  },
];

const serverRequirements = [
  {
    icon: MonitorSmartphone,
    title: "Sistema Operacional",
    text: "Compatível com Windows 10/11, macOS 11+ e principais distribuições Linux, como Ubuntu 20.04 ou superior.",
  },
  {
    icon: Wifi,
    title: "Internet",
    text: "É necessária uma conexão estável com a internet para comunicação com o servidor e gerenciamento dos downloads.",
  },
  {
    icon: ShieldCheck,
    title: "Espaço em Disco",
    text: "Recomendamos pelo menos 2 GB livres para instalação e espaço adicional de acordo com o tamanho da sua biblioteca musical.",
  },
];

const localFeatures = [
  {
    icon: Laptop,
    title: "Instalação no PC",
    description:
      "O Deemix é instalado diretamente no seu computador Windows. Toda a interface e os downloads são gerenciados localmente, sem depender de navegador.",
    color: "green" as const,
  },
  {
    icon: AudioLines,
    title: "Qualidade Hi-Fi (FLAC)",
    description:
      "Baixe faixas em FLAC ou MP3 320 kbps, escolhendo o formato ideal para o seu acervo e para o tipo de set que você prepara.",
    color: "yellow" as const,
  },
  {
    icon: ListMusic,
    title: "Álbuns e Playlists",
    description:
      "Busque singles, álbuns completos, discografias e playlists para montar ou expandir sua biblioteca com agilidade.",
    color: "blue" as const,
  },
  {
    icon: FolderKanban,
    title: "Organização Automática",
    description:
      "Receba arquivos com tags ID3, capas, nomes padronizados e pastas organizadas automaticamente, prontos para uso no seu software de DJ.",
    color: "green" as const,
  },
];

const localHighlights = [
  {
    icon: Zap,
    title: "Download Direto",
    description: "Inicie downloads pelo programa e salve as faixas na pasta que preferir no seu computador.",
    color: "green" as const,
  },
  {
    icon: Search,
    title: "Busca Integrada",
    description: "Pesquise artistas, álbuns e músicas sem sair do Deemix e envie tudo para a fila de download.",
    color: "yellow" as const,
  },
  {
    icon: Headphones,
    title: "Qualidade Premium",
    description: "Escolha entre FLAC e MP3 320 kbps conforme a disponibilidade de cada faixa no catálogo.",
    color: "blue" as const,
  },
  {
    icon: Star,
    title: "Interface Intuitiva",
    description: "Navegue, pesquise e gerencie seus downloads em um programa simples e objetivo.",
    color: "green" as const,
  },
  {
    icon: Music,
    title: "Acervo no seu PC",
    description: "Suas músicas ficam salvas localmente, facilitando backup, organização e uso offline após o download.",
    color: "yellow" as const,
  },
  {
    icon: Check,
    title: "Incluso na assinatura",
    description: "Assinantes do Brazilian Remix Service recebem acesso ao Deemix junto com instruções de instalação e configuração.",
    color: "blue" as const,
  },
];

const localSteps = [
  {
    title: "Assine um plano",
    text: "Escolha o período de acesso e conclua sua assinatura do Brazilian Remix Service.",
    icon: Check,
  },
  {
    title: "Receba sua ARL",
    text: "Após a confirmação, você recebe a credencial e as instruções para configurar o Deemix no seu computador.",
    icon: KeyRound,
  },
  {
    title: "Instale no PC",
    text: "Baixe e instale o Deemix no Windows, siga o passo a passo de configuração e conecte com a ARL fornecida.",
    icon: Monitor,
  },
  {
    title: "Comece a baixar",
    text: "Pesquise suas músicas, escolha a qualidade desejada e organize sua biblioteca direto no programa.",
    icon: Music,
  },
];

const localRequirements = [
  {
    icon: Laptop,
    title: "Somente PC (Windows)",
    text: "O Deemix funciona exclusivamente em computador com Windows 10 ou 11. Não há suporte para celular, tablet ou Mac nesta versão.",
  },
  {
    icon: Wifi,
    title: "Internet",
    text: "Conexão estável com a internet para pesquisar faixas, autenticar o acesso e realizar os downloads.",
  },
  {
    icon: ShieldCheck,
    title: "Espaço em Disco",
    text: "Reserve pelo menos 2 GB para instalação e espaço adicional conforme o tamanho da biblioteca que pretende baixar.",
  },
];

const faqs = [
  {
    q: "Qual a diferença entre Deemix e Deemix Server?",
    a: "O Deemix é instalado no seu PC Windows e roda localmente. O Deemix Server utiliza infraestrutura na nuvem para processar os downloads, com interface conectada ao servidor remoto.",
  },
  {
    q: "Posso usar o Deemix no celular ou Mac?",
    a: "Não. O Deemix só pode ser utilizado em computador com Windows. Não há versão para celular, tablet ou Mac nesta modalidade.",
  },
  {
    q: "O Deemix está incluso na assinatura?",
    a: "Sim. Assinantes do Brazilian Remix Service têm acesso ao Deemix com instruções de instalação e configuração enviadas após a confirmação do pagamento.",
  },
  {
    q: "O Deemix Server está incluso na assinatura?",
    a: "Sim. Assinantes do Brazilian Remix Service têm acesso ao Deemix Server conforme as condições do plano contratado, com instruções enviadas após a confirmação do pagamento.",
  },
  {
    q: "Quais formatos de áudio posso baixar?",
    a: "Dependendo da disponibilidade da faixa, é possível baixar em FLAC (qualidade máxima) ou MP3 320 kbps. A organização com tags ID3 e capas é feita automaticamente.",
  },
  {
    q: "Por que o Deemix Server 2026 está indisponível?",
    a: "A nova versão do Deemix Server 2026 está em fase de preparação e ainda não está liberada para novos acessos. Assinantes serão avisados assim que o serviço estiver disponível.",
  },
  {
    q: "Como funciona a ARL e links do Spotify?",
    a: "A ARL é a credencial usada para autenticação com serviços compatíveis. Quando necessária, ela é fornecida junto com as instruções de acesso. Links e playlists do Spotify podem ser usados como referência para localizar conteúdos correspondentes.",
  },
  {
    q: "Posso comprar o Deemix sem assinar o plano de pools?",
    a: "Sim. Se você não assina o plano de pools, pode solicitar acesso avulso ao Deemix ou Deemix Server pelo WhatsApp. Nossa equipe envia as instruções, valores e orientações de configuração após o contato.",
  },
];

export default function DeemixPage() {
  if (!DEEMIX_ENABLED) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-16 text-center sm:px-6">
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl border border-[#002776]/60 bg-[#002776]/20 p-2 transition-colors hover:bg-[#002776]/40"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-3xl tracking-wide text-[#FFDF00]">DEEMIX</h1>
        </div>
        <p className="text-lg font-semibold text-white">Temporariamente indisponível</p>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-zinc-400">
          O Deemix e o Deemix Server estão desativados no site por enquanto. Em breve avisaremos quando o
          serviço voltar a ficar disponível.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-[#009739]/40 bg-[#009739]/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#00B347] transition-colors hover:bg-[#009739]/20"
          >
            Voltar ao início
          </Link>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:bg-white/10"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:space-y-16 sm:px-6 sm:py-16">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="rounded-xl border border-[#002776]/60 bg-[#002776]/20 p-2 transition-colors hover:bg-[#002776]/40">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-3xl tracking-wide text-[#FFDF00]">DEEMIX</h1>
        </div>
        <Link
          href="/portal"
          className="rounded-full border border-[#009739]/40 bg-[#009739]/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#00B347] transition-colors hover:bg-[#009739]/20"
        >
          Área do cliente
        </Link>
      </div>

      <section id="deemix-server" className="text-center">
        <SectionHeading
          badge="Deemix Server"
          title="Deemix Server 2026"
          subtitle="Tenha sua própria central de música na nuvem com acesso ao Deemix em servidor dedicado. Pesquise, baixe e organize suas faixas de qualquer lugar, sem depender de instalação local e com acesso simplificado pelo navegador."
        />
        <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-[#FFDF00]/40 bg-[#FFDF00]/10 px-5 py-3 text-sm text-[#FFDF00]">
          O Deemix Server 2026 está <strong className="font-semibold">indisponível em 2026</strong> — a nova versão ainda
          está em preparação. Assinantes serão avisados quando o acesso for liberado.
        </div>
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-[#009739]/40 bg-white/[0.03] p-2">
          <Image
            src={PLACEHOLDER.deemix}
            alt="Deemix Server 2026"
            width={1200}
            height={600}
            className="h-auto w-full rounded-xl object-contain"
            sizes="(max-width: 768px) 100vw, 768px"
            quality={82}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#002776]/60 bg-[#002776]/10 p-8">
        <SectionHeading
          title="A vantagem do servidor dedicado"
          subtitle="Você usa uma interface simples no seu computador, enquanto o processamento acontece na nossa infraestrutura em nuvem. Mais desempenho, menos configuração e uma experiência muito mais prática no dia a dia."
        />
        <div className="mt-10 flex flex-col items-center justify-center gap-4 text-center md:flex-row md:gap-8">
          <div className="flex flex-col items-center">
            <User size={36} className="text-[#00B347]" />
            <p className="mt-2 font-semibold">Seu PC</p>
            <p className="text-xs text-gray-500">Interface leve e acesso simplificado</p>
          </div>
          <ArrowRight size={28} className="hidden text-[#FFDF00] md:block" />
          <div className="flex flex-col items-center">
            <Server size={36} className="text-[#6B9FFF]" />
            <p className="mt-2 font-semibold">Nosso Servidor</p>
            <p className="text-xs text-gray-500">Processamento e gerenciamento dos downloads</p>
          </div>
          <ArrowRight size={28} className="hidden text-[#FFDF00] md:block" />
          <div className="flex flex-col items-center">
            <Music size={36} className="text-[#FFDF00]" />
            <p className="mt-2 font-semibold">Deezer</p>
            <p className="text-xs text-gray-500">Fonte integrada ao sistema</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {serverAdvantages.map((a, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={a.title} className={`flex items-start gap-3 rounded-xl border ${c.border} bg-white/[0.03] p-4`}>
                <Check className={`mt-0.5 h-5 w-5 flex-shrink-0 ${c.text}`} />
                <span className="text-sm text-gray-300">
                  <span className="font-semibold text-white">{a.title}:</span> {a.text}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading badge="Funcionalidades" title="Principais recursos do Server" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {serverFeatures.map((f) => (
            <IconBox key={f.title} icon={f.icon} title={f.title} description={f.description} color={f.color} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Recursos em destaque — Server" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {serverHighlights.map((h) => (
            <IconBox key={h.title} icon={h.icon} title={h.title} description={h.description} color={h.color} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Como funciona — Server" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {serverSteps.map((step, index) => {
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
        <SectionHeading title="Requisitos — Server" />
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {serverRequirements.map((r, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={r.title} className={`rounded-2xl border ${c.border} bg-white/[0.04] p-6 text-center`}>
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${c.iconBg}`}>
                  <r.icon className={`h-6 w-6 ${c.text}`} />
                </div>
                <h4 className="font-semibold text-white">{r.title}</h4>
                <p className="mt-2 text-sm text-gray-400">{r.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <DeemixPurchaseCta product="Deemix Server" accent="blue" />

      <div className="br-stripe" />

      {/* Deemix (PC) */}
      <section id="deemix" className="text-center">
        <SectionHeading
          badge="Deemix"
          title="Deemix incluso no seu acesso"
          subtitle="Baixe e organize suas músicas com praticidade usando o Deemix instalado no seu computador. Uma ferramenta simples para ampliar seu repertório e agilizar a preparação dos seus sets."
        />
        <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-[#009739]/40 bg-[#009739]/10 px-5 py-3 text-sm text-[#00B347]">
          O Deemix <strong className="font-semibold">só pode ser utilizado em PC (Windows)</strong>. Não há versão para
          celular, tablet ou Mac.
        </div>
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-[#009739]/40 bg-white/[0.03] p-2">
          <Image
            src={PLACEHOLDER.deemix}
            alt="Deemix para Windows"
            width={1200}
            height={600}
            className="h-auto w-full rounded-xl object-contain"
            sizes="(max-width: 768px) 100vw, 768px"
            quality={82}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#009739]/40 bg-[#009739]/10 p-8">
        <SectionHeading
          title="Deemix no seu computador"
          subtitle="Instale o programa no Windows, configure com a ARL fornecida e gerencie downloads, pastas e qualidade das faixas direto no seu PC — sem depender de servidor remoto."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {localFeatures.map((f) => (
            <IconBox key={f.title} icon={f.icon} title={f.title} description={f.description} color={f.color} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Recursos em destaque — Deemix" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {localHighlights.map((h) => (
            <IconBox key={h.title} icon={h.icon} title={h.title} description={h.description} color={h.color} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Como funciona — Deemix" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {localSteps.map((step, index) => {
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
        <SectionHeading title="Requisitos — Deemix" />
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {localRequirements.map((r, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={r.title} className={`rounded-2xl border ${c.border} bg-white/[0.04] p-6 text-center`}>
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${c.iconBg}`}>
                  <r.icon className={`h-6 w-6 ${c.text}`} />
                </div>
                <h4 className="font-semibold text-white">{r.title}</h4>
                <p className="mt-2 text-sm text-gray-400">{r.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <DeemixPurchaseCta product="Deemix" accent="green" />

      <section className="rounded-2xl border border-[#009739]/40 bg-[#009739]/10 p-8 text-center">
        <h3 className="flex items-center justify-center gap-2 font-display text-xl text-[#00B347]">
          <HelpCircle className="h-6 w-6" /> Sobre a ARL e o Spotify
        </h3>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">
          A ARL é a credencial utilizada pelo sistema para autenticação com serviços compatíveis. Quando necessária, a
          configuração é fornecida junto com as instruções de acesso ao servidor.
        </p>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-gray-300">
          Links e playlists do Spotify podem ser utilizados como referência para localizar conteúdos correspondentes,
          conforme os recursos disponíveis na plataforma.
        </p>
      </section>

      <section id="faq" className="border-t border-white/5 site-section-blue px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            badge="FAQ"
            title="Perguntas frequentes"
            subtitle="Tire suas dúvidas sobre o Deemix, o Deemix Server, requisitos, formatos e formas de acesso."
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
        </div>
      </section>

      <div className="flex items-center justify-center gap-3 rounded-xl border border-[#002776]/60 bg-white/[0.04] p-4 text-center text-sm text-gray-400">
        <Laptop className="h-5 w-5 flex-shrink-0 text-[#FFDF00]" />
        O Deemix funciona exclusivamente em computador Windows. Para usar a ferramenta, é necessário instalar o programa
        no PC.
      </div>
    </div>
  );
}
