import {
  CheckCircle2,
  ChevronDown,
  CloudCog,
  Folder,
  HardDrive,
  Layers,
  ListMusic,
  MessageCircle,
  Music2,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { DriveCatalog } from "./components/DriveCatalog";
import { Hero } from "./components/Hero";
import { IconBox } from "./components/IconBox";
import { SectionHeading } from "./components/SectionHeading";
import { SiteImage } from "./components/SiteImage";
import { TestimonialsCarousel } from "./components/TestimonialsCarousel";
import { TrackShowcase } from "./components/TrackShowcase";
import { ToolPromoSection } from "./components/ToolPromoSection";
import { getPreviewPlaylists } from "./lib/google-drive";
import { checkoutUrl, whatsappUrl } from "./lib/site";
import { SITE_FAQS } from "./lib/site-faqs";
import { CARD_COLORS, COLOR_CYCLE, PLACEHOLDER } from "./lib/theme";

const poolHighlights = [
  {
    icon: Layers,
    title: "400+ Pools",
    description:
      "Mais de 400 pools e fontes de conteúdo para DJs, reunindo remix services, edits, versões exclusivas e repertório atualizado. Tudo organizado para você encontrar rapidamente as músicas certas para seus sets.",
    color: "green" as const,
  },
  {
    icon: Sparkles,
    title: "Curadoria BR",
    description:
      "Seleção especial para a pista brasileira, com funk, sertanejo, pop, eletrônico e open format. Conteúdo escolhido para acompanhar as tendências e garantir um repertório atual, versátil e pronto para qualquer tipo de evento.",
    color: "yellow" as const,
  },
  {
    icon: RefreshCw,
    title: "Atualizações Mensais",
    description:
      "Novos packs, edits, remixes e extended versions adicionados todos os meses. Mantenha seu repertório sempre atualizado com novidades selecionadas para diferentes estilos, pistas e momentos do seu set.",
    color: "blue" as const,
  },
  {
    icon: ListMusic,
    title: "Organização por Gênero",
    description:
      "Conteúdo organizado por pool, gênero, data e tipo de edit para facilitar sua busca. Encontre rapidamente o que precisa e monte seus sets com mais agilidade, praticidade e organização.",
    color: "green" as const,
  },
  {
    icon: Zap,
    title: "Edits Prontos",
    description:
      "Extended, intro edits, clean e dirty versions em alta qualidade, prontos para baixar e levar direto para o seu USB. Tenha as versões certas para cada momento da pista, sem perder tempo na preparação.",
    color: "yellow" as const,
  },
  {
    icon: Users,
    title: "Comunidade de DJs",
    description:
      "Faça parte de uma comunidade de DJs que compartilha experiência, novidades e conteúdo exclusivo. Conte com suporte humano via WhatsApp e acesso à plataforma VIP com milhares de assinantes.",
    color: "blue" as const,
  },
];

const accessMethods = [
  {
    icon: HardDrive,
    title: "FTP Access",
    text: "Acesse o acervo via FileZilla e faça downloads em massa com mais praticidade. Ideal para transferir grandes volumes de arquivos com conexão estável, organização e acesso direto às pastas disponíveis.",
    bgImage: PLACEHOLDER.ftpAccess,
  },
  {
    icon: CloudCog,
    title: "Google Drive",
    text: "Acesse o acervo pelo Google Drive com pastas organizadas por pool, gênero e data de atualização. Encontre seus arquivos com facilidade, navegue de forma simples e mantenha tudo disponível na nuvem.",
    bgImage: PLACEHOLDER.googleDrive,
  },
  {
    icon: Folder,
    title: "RaiDrive",
    text: "Integre o acervo ao seu computador e acesse os arquivos como se estivessem em um disco rígido local. Navegue pelas pastas com praticidade, abra conteúdos rapidamente e simplifique o acesso ao seu repertório.",
    bgImage: PLACEHOLDER.raidrive,
  },
  {
    icon: Music2,
    title: "Plataforma VIP",
    text: "Navegue, ouça e baixe as atualizações direto no navegador. Mês a mês, por estilo, com busca integrada — o portal online do Brazilian Packs, sem instalar nada além do login.",
    bgImage: PLACEHOLDER.musicasPortal,
  },
];

const testimonials = [
  {
    name: "DJ Rafael Martins",
    role: "DJ Open Format",
    quote:
      "Com o Brazilian Packs ficou muito mais fácil preparar meus sets. Encontro edits, versões extended e remixes organizados sem perder horas pesquisando antes de cada evento.",
  },
  {
    name: "DJ Bruno Almeida",
    role: "DJ de Eventos & Casamentos",
    quote:
      "Antes eu perdia muito tempo procurando versões diferentes da mesma música. Hoje consigo encontrar rapidamente o que preciso e deixar meu repertório muito mais organizado para cada tipo de pista.",
  },
  {
    name: "DJ Lucas Ferreira",
    role: "DJ & Prod.",
    quote:
      "Curti bastante o acervo. Tem mt coisa organizada, vários edits e versões que eu usaria na pista. Pra quem toca direto, ajuda d+ e economiza um tempão na preparação.",
  },
  {
    name: "DJ Matheus Costa",
    role: "DJ de Eventos & Open Format",
    quote:
      "Assino principalmente pela praticidade. Sempre encontro versões boas, packs atualizados e material que realmente uso nos eventos. Virou parte da minha preparação semanal.",
  },
];

const plans = [
  {
    name: "1 Mês",
    price: "R$ 50",
    period: "Pagamento único",
    equivalent: null as string | null,
    badge: null as string | null,
    features: [
      "Acesso completo ao acervo por 30 dias",
      "Músicas, edits, remixes e vídeos",
      "Acesso ao Google Drive e FTP",
      "Atualizações disponíveis durante o período",
      "Acesso às ferramentas inclusas",
      "Renovação manual, sem cobrança automática",
    ],
    highlight: false,
  },
  {
    name: "3 Meses",
    price: "R$ 135",
    period: "Pagamento único — 10% de desconto",
    equivalent: "Equivale a R$ 45 por mês",
    badge: "10% off",
    features: [
      "Acesso completo ao acervo por 3 meses",
      "Músicas, edits, remixes e vídeos",
      "Acesso ao Google Drive e FTP",
      "Atualizações disponíveis durante todo o período",
      "Acesso às ferramentas inclusas",
      "Renovação manual, sem cobrança automática",
    ],
    highlight: false,
  },
  {
    name: "1 Ano",
    price: "R$ 504",
    period: "Pagamento único — melhor custo-benefício",
    equivalent: "Equivale a R$ 42 por mês",
    badge: "Melhor custo-benefício",
    features: [
      "Acesso completo ao acervo por 12 meses",
      "Músicas, edits, remixes e vídeos",
      "Acesso ao Google Drive e FTP",
      "Atualizações disponíveis durante todo o período",
      "Acesso às ferramentas inclusas",
      "Renovação manual, sem cobrança automática",
    ],
    highlight: true,
  },
];

export default async function Home() {
  const previewPlaylists = await getPreviewPlaylists().catch(() => []);

  return (
    <div className="flex min-h-screen flex-col">
      <Hero />

      <section id="pools" className="px-4 pb-12 pt-4 br-pattern sm:px-6 md:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto grid max-w-md gap-4 sm:max-w-none sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {poolHighlights.map((item) => (
              <IconBox key={item.title} icon={item.icon} title={item.title} description={item.description} color={item.color} />
            ))}
          </div>
        </div>
      </section>

      {/* Curadoria + imagem */}
      <section id="curadoria" className="border-y border-white/5 site-section-blue px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 text-center md:grid-cols-2 md:items-center md:gap-12 md:text-left">
          <div className="mx-auto max-w-lg md:mx-0 md:max-w-none">
            <SectionHeading
              badge="Curadoria"
              title="Seleção pensada para a pista brasileira"
              centered={false}
            />
            <div className="mt-8 space-y-4 text-sm leading-relaxed text-gray-400">
              <p>
                Um repertório selecionado especialmente para DJs que precisam estar sempre preparados para qualquer
                pista. Reunimos músicas, remixes, edits e versões que fazem sentido para o público brasileiro, com foco
                no que realmente funciona nos eventos.
              </p>
              <p>
                Do funk ao sertanejo, do pop ao eletrônico, passando pelo open format e pelos grandes sucessos
                nacionais e internacionais. Nossa curadoria acompanha as tendências e prioriza conteúdos que ajudam você
                a manter seu repertório atual, variado e competitivo.
              </p>
              <p>
                Tudo organizado para facilitar sua preparação, economizar tempo e deixar você pronto para tocar em
                festas, clubs, eventos e diferentes formatos de pista.
              </p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md md:max-w-none">
            <div className="overflow-hidden rounded-2xl border border-[#009739]/40 bg-white/[0.03] p-2 shadow-2xl shadow-[#002776]/40">
              <SiteImage
                src={PLACEHOLDER.curadoria}
                alt="Curadoria Brazilian Packs"
                width={960}
                height={720}
                className="h-auto w-full rounded-xl object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Métodos de acesso */}
      <section id="acesso" className="border-y border-white/5 site-section-green px-4 py-12 sm:px-6 lg:px-10 xl:px-14 2xl:px-16 md:py-20">
        <div className="mx-auto w-full max-w-[90rem]">
          <SectionHeading
            badge="Acesso"
            title="Como você baixa o acervo"
            subtitle="Escolha a forma mais prática para acessar seus arquivos. Você pode baixar diretamente pela plataforma ou utilizar o acesso via FTP para transferências maiores e mais rápidas — tudo incluso na mesma assinatura."
          />
          <div className="mt-10 grid grid-cols-1 gap-8 sm:mt-12 md:grid-cols-2 md:gap-x-10 md:gap-y-12 lg:gap-x-14 lg:gap-y-14">
            {accessMethods.map((method, index) => {
              const colorKey = COLOR_CYCLE[index % COLOR_CYCLE.length];
              const c = CARD_COLORS[colorKey];
              const accentBar =
                colorKey === "green"
                  ? "via-[#00B347]"
                  : colorKey === "yellow"
                    ? "via-[#FFDF00]"
                    : "via-[#6B9FFF]";
              return (
                <article
                  key={method.title}
                  className={`group relative aspect-[21/9] min-h-[180px] overflow-hidden rounded-2xl border ${c.border} ${c.hoverBorder} shadow-lg shadow-black/40 ring-1 ring-inset ring-white/[0.06] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/60 md:min-h-[220px] lg:min-h-[240px]`}
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <SiteImage
                      src={method.bgImage}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      quality={75}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#121212]/88 to-[#121212]/35" />
                  <div
                    className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent ${accentBar} to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 ${c.iconBg} shadow-lg backdrop-blur-md`}
                    >
                      <method.icon className={`h-5 w-5 ${c.text}`} />
                    </div>
                    <div className="mt-auto pt-4">
                      <h3 className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
                        {method.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-300/90">
                        {method.text}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portal de atualizações */}
      <ToolPromoSection
        id="musicas"
        badge="Plataforma VIP"
        title="Portal de atualizações online"
        description="Acesse o acervo pelo navegador: navegue por mês e estilo, ouça previews, baixe faixas e acompanhe as novidades sem depender só do Drive ou FTP. Tudo organizado na plataforma que criamos para assinantes VIP."
        image={PLACEHOLDER.musicasPortal}
        imageAlt="Portal de atualizações Brazilian Packs"
        href="/musicas/atualizacoes"
        buttonLabel="Acessar atualizações"
        accent="green"
      />

      {/* Catálogo */}
      <section id="acervo" className="px-4 py-12 br-pattern sm:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            badge="Catálogo"
            title="Pools & remix services disponíveis"
            subtitle="Explore centenas de pools, remix services e fontes de conteúdo reunidos no acervo Brazilian Packs. Encontre edits, remixes, extended versions e materiais de diferentes estilos, tudo organizado para facilitar sua busca e a preparação dos seus sets."
          />
          <div className="mt-12">
            <DriveCatalog />
          </div>
        </div>
      </section>

      {/* Faixas exemplo */}
      <section className="border-y border-white/5 site-section-yellow px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            badge="Preview"
            title="Ouça algumas faixas do acervo"
            subtitle="Confira uma seleção de faixas disponíveis no Brazilian Packs e conheça um pouco da variedade do nosso acervo. Ouça exemplos de remixes, edits, extended versions e outras versões pensadas para DJs e diferentes tipos de pista."
          />
          <div className="mt-12">
            <TrackShowcase initialPlaylists={previewPlaylists} />
          </div>
        </div>
      </section>

      {/* Produção Musical */}
      <ToolPromoSection
        id="music-producer"
        badge="Music Producer"
        title="Sua música produzida do zero"
        description={
          <>
            <p>
              Você traz a <strong className="font-semibold text-gray-200">ideia, a história e a mensagem</strong>.
              Nós transformamos tudo em uma música criada especialmente para você.
            </p>
            <p>
              Da composição da letra à escolha do estilo, voz, instrumental, arranjo, mixagem e finalização, cada
              detalhe é desenvolvido de acordo com o seu projeto.
            </p>
            <p>
              Produzimos{" "}
              <strong className="font-semibold text-gray-200">
                músicas para aniversários, casamentos, empresas, escolas, eventos, jingles comerciais e políticos,
                música eletrônica, vinhetas, intros e projetos especiais
              </strong>
              .
            </p>
            <p>
              Você não precisa entender de produção musical. Basta contar o que imagina, enviar suas referências e
              explicar o que deseja transmitir.
            </p>
            <p>
              <strong className="font-semibold text-gray-200">
                Sua ideia. Sua história. Sua música — produzida do zero.
              </strong>
            </p>
          </>
        }
        descriptionClassName="max-w-3xl text-justify"
        imageMaxWidth="max-w-md"
        image={PLACEHOLDER.musicProducerHero}
        imageAlt="DJ Jéssika Luana — Produção Musical Brazilian Packs"
        href="/musicproducer"
        buttonLabel="Conhecer a produção musical"
        accent="green"
      />

      {/* Deemix Server */}
      <ToolPromoSection
        id="deemix-server"
        badge="Deemix Server"
        title="Servidor dedicado para downloads rápidos"
        description="Com o Deemix Server, o processamento acontece na nossa infraestrutura na nuvem. Você instala o programa no seu PC e baixa músicas com velocidade máxima, sem consumir sua banda nem configurar VPN ou proxies."
        image={PLACEHOLDER.deemix}
        imageAlt="Deemix Server"
        href="/deemix"
        buttonLabel="Conhecer o Deemix Server"
        accent="blue"
      />

      {/* Deemix */}
      <ToolPromoSection
        id="deemix"
        badge="Deemix"
        title="Deemix incluso no seu acesso"
        description="Baixe e organize suas músicas com praticidade usando o Deemix. Uma ferramenta simples para ampliar seu repertório e agilizar a preparação dos seus sets."
        image={PLACEHOLDER.deemix}
        imageAlt="Deemix"
        href="/deemix"
        buttonLabel="Saiba mais sobre o Deemix"
        accent="green"
      />

      {/* Allavsoft */}
      <ToolPromoSection
        id="allavsoft"
        badge="Allavsoft"
        title="Allavsoft incluso no seu acesso"
        description="Baixe vídeos, músicas e outros conteúdos de diferentes plataformas com mais praticidade. O Allavsoft ajuda a centralizar seus downloads, converter arquivos e agilizar a preparação do seu material em um só lugar."
        image={PLACEHOLDER.allavsoft}
        imageAlt="Allavsoft"
        href="/allavsoft"
        buttonLabel="Saiba mais sobre o Allavsoft"
        accent="yellow"
      />

      {/* Depoimentos */}
      <section id="depoimentos" className="px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            badge="Depoimentos"
            title="O que dizem os DJs assinantes"
            subtitle="Veja a experiência de quem já usa o Brazilian Packs no dia a dia. Relatos de DJs que economizam tempo na pesquisa, encontram versões certas com mais facilidade e mantêm o repertório sempre pronto para a pista."
          />
          <div className="mt-12">
            <TestimonialsCarousel testimonials={testimonials} />
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="border-y border-white/5 site-section-rainbow px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            badge="Acesso"
            title="Escolha seu acesso"
            subtitle="Escolha o plano que melhor combina com a sua rotina e tenha acesso ao acervo Brazilian Packs, ferramentas inclusas e atualizações frequentes. Compare as opções e encontre a melhor forma de manter seu repertório sempre completo e organizado."
          />
          <div className="mx-auto mt-10 grid max-w-md gap-4 sm:mt-12 sm:max-w-none sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 text-center transition-all md:p-8 md:text-left ${
                  plan.highlight
                    ? "border-[#FFDF00]/60 bg-gradient-to-b from-[#009739]/20 to-transparent shadow-2xl shadow-[#009739]/20 md:scale-[1.03]"
                    : "border-white/10 bg-[#282828] hover:border-[#009739]/40"
                }`}
              >
                {plan.badge && plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FFDF00] px-4 py-1 text-xs font-bold uppercase tracking-wide text-[#002776]">
                    {plan.badge}
                  </span>
                )}
                {plan.badge && !plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[#009739]/50 bg-[#009739]/20 px-4 py-1 text-xs font-bold uppercase tracking-wide text-[#00B347]">
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-display text-lg text-white">{plan.name}</h3>
                <p className="mt-4 font-display text-4xl font-bold text-white">{plan.price}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{plan.period}</p>
                {plan.equivalent && (
                  <p className="mt-2 text-sm font-medium text-[#FFDF00]">{plan.equivalent}</p>
                )}
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start justify-center gap-2 text-sm text-gray-300 md:justify-start">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#009739]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={checkoutUrl(plan.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-bold uppercase tracking-wide transition-all hover:scale-105 ${
                    plan.highlight ? "bg-[#009739] text-white hover:bg-[#00B347]" : "border border-[#009739]/60 text-[#00B347] hover:bg-[#009739]/10"
                  }`}
                >
                  Comprar
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="px-4 py-12 text-center sm:px-6 md:py-16">
        <div className="mx-auto max-w-2xl">
          <SectionHeading
            title="Ainda tem dúvidas?"
            subtitle="Nossa equipe está pronta para ajudar. Fale com a gente pelo WhatsApp para tirar dúvidas sobre o acervo, formas de acesso, planos, downloads e funcionamento da plataforma antes de assinar."
          />
          <a
            href={whatsappUrl("Olá! Vim pelo site e quero saber mais sobre pools e curadoria.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#009739] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#009739]/30 transition-all hover:scale-105 hover:bg-[#00B347]"
          >
            <MessageCircle size={18} /> Falar no WhatsApp
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/5 site-section-blue px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            badge="FAQ"
            title="Perguntas frequentes"
            subtitle="Tire suas dúvidas sobre o acervo, formas de acesso, atualizações, Deemix e como começar no Brazilian Packs."
          />
          <div className="mt-12 space-y-3">
            {SITE_FAQS.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-white/10 bg-[#282828] p-4 open:border-[#009739]/50">
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
