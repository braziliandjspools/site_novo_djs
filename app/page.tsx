import type { Metadata } from "next";
import dynamic from "next/dynamic";
import {
  ChevronDown,
  Download,
  Infinity,
  KeyRound,
  Layers,
  ListMusic,
  Monitor,
  Music2,
  RefreshCw,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Hero } from "./components/Hero";
import { IconBox } from "./components/IconBox";
import { SectionHeading } from "./components/SectionHeading";
import { SiteImage } from "./components/SiteImage";
import { SpotifyDjSection } from "./components/SpotifyDjSection";
import { ToolPromoSection } from "./components/ToolPromoSection";
import { getMostDownloadedTracks } from "./lib/top-downloads";
import { getDownloaderReleaseManifest } from "./lib/downloader-updates";
import { DOWNLOADER_NAME } from "./lib/branding";
import { SITE_FAQS } from "./lib/site-faqs";
import { buildPageMetadata, faqJsonLd } from "./lib/seo";
import { PLACEHOLDER } from "./lib/theme";
import { JsonLd } from "./components/JsonLd";

const AllavsoftPlatformsMarquee = dynamic(
  () =>
    import("./components/AllavsoftPlatformsMarquee").then((m) => m.AllavsoftPlatformsMarquee),
  { ssr: true },
);
const DriveCatalog = dynamic(
  () => import("./components/DriveCatalog").then((m) => m.DriveCatalog),
  { ssr: true },
);
const PoolLogosMarquee = dynamic(
  () => import("./components/PoolLogosMarquee").then((m) => m.PoolLogosMarquee),
  { ssr: true },
);
const PoolsMarquee = dynamic(
  () => import("./components/PoolsMarquee").then((m) => m.PoolsMarquee),
  { ssr: true },
);
const TestimonialsCarousel = dynamic(
  () => import("./components/TestimonialsCarousel").then((m) => m.TestimonialsCarousel),
  { ssr: true },
);
const TopDownloadsTable = dynamic(
  () => import("./components/TopDownloadsTable").then((m) => m.TopDownloadsTable),
  { ssr: true },
);

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
  const topDownloads = await getMostDownloadedTracks(12).catch(() => []);
  const downloaderRelease = getDownloaderReleaseManifest();
  const downloaderUrl =
    downloaderRelease?.downloadUrl ??
    "https://www.brazilianremixservice.com.br/downloads/BRS-Downloader_1.0.10_estable_x64-setup.exe";
  const downloaderVersion = downloaderRelease?.version ?? "1.0.10_estable";

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

      {/* Curadoria — 2 colunas (texto + imagem) + marquee de pools */}
      <section id="curadoria" className="border-y border-white/5 site-section-blue py-12 md:py-20">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-16">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#009739]/40 bg-[#009739]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#00B347]">
              Curadoria
            </span>
          </div>
          <div className="mb-5 flex justify-center gap-1">
            <span className="h-1 w-8 rounded-full bg-[#009739]" />
            <span className="h-1 w-8 rounded-full bg-[#FFDF00]" />
            <span className="h-1 w-8 rounded-full bg-[#002776]" />
          </div>
          <h2 className="font-display mx-auto max-w-4xl text-center text-3xl font-semibold text-white sm:text-4xl xl:text-5xl">
            Seleção pensada para a pista brasileira
          </h2>

          {/* Imagem alinha só com o texto — título fica fora */}
          <div className="mt-6 grid items-stretch gap-6 lg:mt-8 lg:grid-cols-2 lg:gap-8 xl:gap-10">
            <div className="space-y-4 text-justify text-sm leading-relaxed text-gray-400 sm:text-[15px] sm:leading-7 lg:text-base lg:leading-8">
              <p>
                Um repertório criado para DJs que precisam estar preparados para diferentes públicos, estilos e
                momentos da pista. Nossa seleção reúne músicas, remixes, edits, versões extended, intros e faixas
                escolhidas com foco no que realmente funciona em eventos no Brasil.
              </p>
              <p>
                A curadoria acompanha o comportamento das pistas, os lançamentos em alta, os clássicos que continuam
                funcionando e as versões que ajudam o DJ a construir sets mais completos. Do funk ao sertanejo, do pop
                ao eletrônico, passando por house, dance, flashbacks, open format e grandes sucessos nacionais e
                internacionais, o objetivo é oferecer variedade sem transformar sua preparação em uma busca
                interminável.
              </p>
              <p>
                Também priorizamos conteúdos que facilitem a mixagem e o trabalho durante a apresentação. Versões
                estendidas, edits, intros e remixes podem ajudar na transição entre estilos, na construção de energia
                e na adaptação do repertório para diferentes tipos de evento.
              </p>
              <p>
                Tudo é organizado para que você encontre o que precisa com mais rapidez, descubra novas opções para o
                seu set e mantenha uma biblioteca atual, versátil e pronta para uso.
              </p>
              <p>
                A proposta é simples: reduzir o tempo gasto procurando música e aumentar o tempo disponível para
                preparar apresentações melhores.
              </p>
            </div>

            <div className="relative aspect-[4/5] min-h-[20rem] overflow-hidden rounded-2xl bg-[#0a0a0a] sm:min-h-[24rem] lg:aspect-auto lg:min-h-full">
              <SiteImage
                src={PLACEHOLDER.curadoria}
                alt="DJ BRS — Brazilian Remix Service"
                fill
                quality={75}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 560px"
                className="object-cover object-[center_18%]"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 w-full md:mt-16">
          <PoolsMarquee />
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
                quality={70}
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
                quality={70}
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
      <section id="acervo" className="py-12 br-pattern md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeading
            badge="Catálogo"
            title="Pools & remix services disponíveis"
            subtitle="Explore centenas de pools, remix services e fontes de conteúdo reunidos no acervo Brazilian Remix Service. Encontre edits, remixes, extended versions e materiais de diferentes estilos, tudo organizado para facilitar sua busca e a preparação dos seus sets."
          />
        </div>

        <div className="mt-10 w-full md:mt-12">
          <PoolLogosMarquee />
        </div>

        <div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6 md:mt-12">
          <DriveCatalog />
        </div>
      </section>

      {/* Mais baixadas — uma tabela com player */}
      <section className="border-y border-white/5 site-section-yellow px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            badge="Acervo"
            title="Veja pastas e faixas do acervo"
            subtitle="As mais baixadas em tempo real — toque na capa para ouvir sem login e conhecer o acervo."
          />
          <div className="mt-10 md:mt-12">
            <TopDownloadsTable tracks={topDownloads} />
          </div>
        </div>
      </section>

      <SpotifyDjSection />

      {/* Produção Musical */}
      <ToolPromoSection
        id="music-producer"
        badge="Music Producer"
        title="Sua música produzida do zero"
        description={
          <>
            <p>
              Você traz a <strong className="font-semibold text-gray-200">ideia, a história e a mensagem</strong>.
              Nós transformamos tudo em uma música criada especialmente para você — com identidade sonora, emoção e
              acabamento profissional.
            </p>
            <p>
              Da composição da letra à escolha do estilo, voz, instrumental, arranjo, mixagem e masterização, cada
              detalhe é desenvolvido sob medida. Nada de template genérico: a faixa nasce do seu briefing e fica
              pronta para tocar em festa, campanha, set ou redes sociais.
            </p>
            <p>
              Produzimos{" "}
              <strong className="font-semibold text-gray-200">
                músicas para aniversários, casamentos, empresas, escolas, eventos, jingles comerciais e políticos,
                música eletrônica, vinhetas, intros e projetos especiais
              </strong>
              . Também criamos drops, opens de DJ, trilhas para vídeo e homenagens que a família guarda pra sempre.
            </p>
            <p>
              Você não precisa entender de produção musical. Basta contar o que imagina, enviar referências (playlists,
              artistas, mood) e explicar o que deseja transmitir. Nossa equipe conduz o processo do conceito ao arquivo
              final — WAV/MP3 entregues, revisões alinhadas e acompanhamento próximo.
            </p>
            <p>
              Quer um diferencial? Podemos trabalhar{" "}
              <strong className="font-semibold text-gray-200">
                letra exclusiva, voz feminina ou masculina, clima emocional ou dancefloor
              </strong>
              , e ainda orientar distribuição digital quando o projeto pede presença no Spotify e outras plataformas.
            </p>
            <p>
              <strong className="font-semibold text-gray-200">
                Sua ideia. Sua história. Sua música — produzida do zero, com a assinatura BRS.
              </strong>
            </p>
          </>
        }
        descriptionClassName="w-full max-w-5xl text-justify"
        contentMaxWidth="max-w-5xl"
        imageMaxWidth="w-full max-w-5xl"
        image={PLACEHOLDER.musicProducerHero}
        imageAlt="DJ Jéssika Luana — Produção Musical Brazilian Remix Service"
        href="/musicproducer"
        buttonLabel="Conhecer a produção musical"
        accent="green"
      />

      {/* Allavsoft */}
      <ToolPromoSection
        id="allavsoft"
        badge="Allavsoft"
        title="Licença vitalícia do Allavsoft"
        description={
          <>
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
              É uma opção interessante para DJs, produtores, criadores de conteúdo e usuários que baixam músicas e
              vídeos com frequência. O processo é simples: adquire a licença, acessa o portal do cliente, consulta o
              serial e ativa o programa — sem cobrança recorrente.
            </p>
            <p className="text-sm text-zinc-500 md:text-base">
              Use sempre de acordo com os termos de cada plataforma e apenas para conteúdos que você tenha autorização
              ou direito de baixar.
            </p>
          </>
        }
        descriptionClassName="w-full max-w-5xl text-justify"
        contentMaxWidth="max-w-5xl"
        imageMaxWidth="w-full max-w-5xl"
        extras={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <IconBox
              icon={Wallet}
              title="R$ 50,00"
              description="Pagamento único. Sem mensalidade e sem surpresa no cartão."
              color="yellow"
            />
            <IconBox
              icon={Infinity}
              title="Licença vitalícia"
              description="Um pagamento e o Allavsoft fica disponível para você continuar usando."
              color="green"
            />
            <IconBox
              icon={KeyRound}
              title="Serial no portal"
              description="Após a compra, o serial de ativação fica no portal do cliente."
              color="blue"
            />
            <IconBox
              icon={Download}
              title="Várias plataformas"
              description="Deezer, Spotify, YouTube e +1000 sites compatíveis em um só app."
              color="yellow"
            />
          </div>
        }
        image={PLACEHOLDER.allavsoft}
        imageAlt="Allavsoft"
        belowImage={
          <div className="space-y-3">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Compatível com Deezer, Spotify, YouTube, Vimeo e +1000 sites
            </p>
            <AllavsoftPlatformsMarquee />
          </div>
        }
        href="/allavsoft"
        buttonLabel="Comprar Allavsoft"
        accent="green"
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

      {/* FAQ */}
      <section id="faq" className="border-t border-white/5 site-section-blue px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            badge="FAQ"
            title="Perguntas frequentes"
            subtitle="Tire suas dúvidas sobre o acervo, formas de acesso, atualizações, Allavsoft e como começar no Brazilian Remix Service."
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
