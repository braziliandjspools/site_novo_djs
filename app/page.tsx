import type { Metadata } from "next";
import {
  ChevronDown,
  Download,
  Layers,
  ListMusic,
  MessageCircle,
  Monitor,
  Music2,
  RefreshCw,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { DriveCatalog } from "./components/DriveCatalog";
import { Hero } from "./components/Hero";
import { IconBox } from "./components/IconBox";
import { SectionHeading } from "./components/SectionHeading";
import { SiteImage } from "./components/SiteImage";
import { TestimonialsCarousel } from "./components/TestimonialsCarousel";
import { TrackShowcase } from "./components/TrackShowcase";
import { ToolPromoSection } from "./components/ToolPromoSection";
import { getLatestVipPreviewPlaylists } from "./lib/vip-music-catalog";
import { getDownloaderReleaseManifest } from "./lib/downloader-updates";
import { DOWNLOADER_NAME } from "./lib/branding";
import { whatsappUrl } from "./lib/site";
import { SITE_FAQS } from "./lib/site-faqs";
import { buildPageMetadata, faqJsonLd } from "./lib/seo";
import { PLACEHOLDER } from "./lib/theme";
import { DEEMIX_ENABLED } from "./lib/feature-flags";
import { JsonLd } from "./components/JsonLd";

export const metadata: Metadata = buildPageMetadata("home");

const poolHighlights = [
  {
    icon: Layers,
    title: "+315 GB",
    description:
      "Acervo VIP com mais de 315 GB de packs, edits e extended versions. Centenas de pastas e dezenas de milhares de faixas organizadas para a rotina do DJ.",
    color: "green" as const,
  },
  {
    icon: Sparkles,
    title: "739 pastas",
    description:
      "Estrutura por mês, semana e estilo para achar rápido o que precisa — funk, sertanejo, pop, eletrônico e open format com curadoria BR.",
    color: "yellow" as const,
  },
  {
    icon: RefreshCw,
    title: "+40.012 músicas",
    description:
      "Repertório amplo e atualizado com frequência. Mantenha o set em dia com novidades selecionadas para diferentes pistas e momentos.",
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
    icon: Smartphone,
    title: "Site — download direto",
    text: "No celular ou no navegador: abra a plataforma VIP, navegue pelas atualizações e baixe as faixas na hora. Ideal para dispositivos móveis e acesso rápido sem instalar nada.",
    href: "/musicas/atualizacoes",
    cta: "Abrir plataforma",
    accent: "green" as const,
  },
  {
    icon: Monitor,
    title: "Downloader — Windows",
    text: "No PC, use o BRS Downloader oficial: filas, pastas preservadas, sincronização com a conta e downloads em massa com mais controle. Feito para quem baixa packs inteiros no Windows.",
    href: "#downloader",
    cta: "Ver o Downloader",
    accent: "yellow" as const,
  },
];

const downloaderHighlights = [
  "Fila e progresso em tempo real",
  "Importar pack por link do site",
  "Organização por pastas e metadados",
  "Sincronizado com a conta VIP",
];

const testimonials = [
  {
    name: "DJ Rafael Martins",
    role: "DJ Open Format",
    quote:
      "Com o Brazilian Remix Service ficou muito mais fácil preparar meus sets. Encontro edits, versões extended e remixes organizados sem perder horas pesquisando antes de cada evento.",
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

export default async function Home() {
  const previewPlaylists = await getLatestVipPreviewPlaylists(3).catch(() => []);
  const downloaderRelease = getDownloaderReleaseManifest();
  const downloaderUrl =
    downloaderRelease?.downloadUrl ??
    "https://www.brazilianremixservice.com.br/downloads/BRS-Downloader_1.0.9_estable_x64-setup.exe";
  const downloaderVersion = downloaderRelease?.version ?? "1.0.9_estable";

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={faqJsonLd(SITE_FAQS)} />
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
                alt="Curadoria Brazilian Remix Service"
                width={960}
                height={720}
                className="h-auto w-full rounded-xl object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Como baixar — só site + Downloader */}
      <section id="acesso" className="border-y border-white/5 site-section-green px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            badge="Acesso"
            title="Como você baixa o acervo"
            subtitle="Duas formas simples: no celular ou navegador, baixe direto pelo site. No Windows, use o BRS Downloader para packs e filas completas."
          />
          <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2">
            {accessMethods.map((method) => (
              <article key={method.title} className="site-panel flex flex-col p-6 md:p-8">
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${
                    method.accent === "green"
                      ? "bg-[#009739]/15 text-[#00B347]"
                      : "bg-[#FFDF00]/15 text-[#FFDF00]"
                  }`}
                >
                  <method.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white">{method.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{method.text}</p>
                {method.href.startsWith("#") ? (
                  <a
                    href={method.href}
                    className={`mt-6 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                      method.accent === "green"
                        ? "bg-[#009739] text-white hover:bg-[#00B347]"
                        : "border border-[#FFDF00]/50 text-[#FFDF00] hover:bg-[#FFDF00]/10"
                    }`}
                  >
                    {method.cta}
                  </a>
                ) : (
                  <Link
                    href={method.href}
                    className={`mt-6 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                      method.accent === "green"
                        ? "bg-[#009739] text-white hover:bg-[#00B347]"
                        : "border border-[#FFDF00]/50 text-[#FFDF00] hover:bg-[#FFDF00]/10"
                    }`}
                  >
                    {method.cta}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Top Downloader */}
      <section id="downloader" className="border-b border-white/5 site-section-blue px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            badge={DOWNLOADER_NAME}
            title="O app oficial para Windows"
            subtitle="Fila inteligente, importação por link, organização por pastas e sincronização com a plataforma VIP. Feito para DJs que baixam packs inteiros no PC."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {downloaderHighlights.map((item) => (
              <div key={item} className="site-panel px-4 py-3 text-center text-sm font-medium text-zinc-300">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <figure className="site-panel overflow-hidden p-2">
              <SiteImage
                src="/images/downloader/brs-downloader-inicio.png"
                alt="BRS Downloader — tela Início com fila, conexão e atalhos"
                width={1440}
                height={900}
                className="h-auto w-full rounded-xl object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <figcaption className="px-3 py-3 text-center text-xs uppercase tracking-[0.14em] text-zinc-500">
                Início · visão geral e importação por link
              </figcaption>
            </figure>
            <figure className="site-panel overflow-hidden p-2">
              <SiteImage
                src="/images/downloader/brs-downloader-downloads.png"
                alt="BRS Downloader — tela Downloads com filtros e organização"
                width={1440}
                height={900}
                className="h-auto w-full rounded-xl object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <figcaption className="px-3 py-3 text-center text-xs uppercase tracking-[0.14em] text-zinc-500">
                Downloads · fila, filtros e metadados
              </figcaption>
            </figure>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 text-center sm:flex-row">
            <a
              href={downloaderUrl}
              className="site-btn site-btn-primary"
            >
              <Download className="h-4 w-4" />
              Baixar {DOWNLOADER_NAME}
            </a>
            <Link href="/musicas/atualizacoes" className="site-btn site-btn-ghost">
              Abrir plataforma
            </Link>
          </div>
          <p className="mt-4 text-center text-xs text-zinc-500">
            Windows x64 · versão {downloaderVersion} · mesmo login da conta VIP
          </p>
        </div>
      </section>

      {/* Portal de atualizações */}
      <ToolPromoSection
        id="musicas"
        badge="Plataforma VIP"
        title="Portal de atualizações online"
        description="Acesse o acervo pelo navegador: navegue por mês e estilo, ouça previews e baixe faixas direto no site — principalmente no celular. No PC Windows, combine com o BRS Downloader para packs completos."
        image={PLACEHOLDER.musicasPortal}
        imageAlt="Portal de atualizações Brazilian Remix Service"
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
            subtitle="Explore centenas de pools, remix services e fontes de conteúdo reunidos no acervo Brazilian Remix Service. Encontre edits, remixes, extended versions e materiais de diferentes estilos, tudo organizado para facilitar sua busca e a preparação dos seus sets."
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
            badge="Acervo"
            title="Veja pastas e faixas do acervo"
            subtitle="Sempre as 3 pastas mais recentes — explore remixes, edits e extended versions. Para ouvir e baixar, assine o VIP."
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
        imageAlt="DJ Jéssika Luana — Produção Musical Brazilian Remix Service"
        href="/musicproducer"
        buttonLabel="Conhecer a produção musical"
        accent="green"
      />

      {/* Deemix Server */}
      {DEEMIX_ENABLED && (
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
      )}

      {/* Deemix */}
      {DEEMIX_ENABLED && (
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
      )}

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
            subtitle="Veja a experiência de quem já usa o Brazilian Remix Service no dia a dia. Relatos de DJs que economizam tempo na pesquisa, encontram versões certas com mais facilidade e mantêm o repertório sempre pronto para a pista."
          />
          <div className="mt-12">
            <TestimonialsCarousel testimonials={testimonials} />
          </div>
        </div>
      </section>

      {/* Planos — CTA para /plans */}
      <section className="border-y border-white/5 site-section-rainbow px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            badge="Acesso"
            title="Escolha seu plano"
            subtitle="Compare 1 mês, 3 meses e 1 ano e assine pelo WhatsApp com acesso completo ao acervo e às ferramentas."
          />
          <Link
            href="/plans"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#009739] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#009739]/30 transition-all hover:scale-105 hover:bg-[#00B347]"
          >
            Ver planos e preços
          </Link>
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
            subtitle="Tire suas dúvidas sobre o acervo, formas de acesso, atualizações, Deemix e como começar no Brazilian Remix Service."
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
