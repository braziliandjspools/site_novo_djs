import {
  CheckCircle2,
  ChevronDown,
  CloudCog,
  Folder,
  HardDrive,
  Headphones,
  MessageCircle,
  Music4,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import { DriveCatalog } from "./components/DriveCatalog";

// Paleta inspirada no Brasil: verde, amarelo, azul + acentos vibrantes
const CARD_COLORS = {
  green: { bg: "bg-green-600/15", text: "text-green-400", border: "border-green-500/30", hoverBorder: "hover:border-green-500/50" },
  yellow: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30", hoverBorder: "hover:border-yellow-500/50" },
  blue: { bg: "bg-blue-600/15", text: "text-blue-400", border: "border-blue-500/30", hoverBorder: "hover:border-blue-500/50" },
  violet: { bg: "bg-violet-600/15", text: "text-violet-400", border: "border-violet-500/30", hoverBorder: "hover:border-violet-500/50" },
  cyan: { bg: "bg-cyan-600/15", text: "text-cyan-400", border: "border-cyan-500/30", hoverBorder: "hover:border-cyan-500/50" },
  fuchsia: { bg: "bg-fuchsia-600/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30", hoverBorder: "hover:border-fuchsia-500/50" },
} as const;
type CardColor = keyof typeof CARD_COLORS;
const COLOR_CYCLE: CardColor[] = ["green", "yellow", "blue", "violet", "cyan", "fuchsia"];

const brands = ["ULTIMIX", "FUNKYMIX", "SELECTMIX", "MASTERMIX", "BACKSPINS", "DMC"];

const benefits = [
  "Extended versions, intro edits e clean edits",
  "Versões editadas em 320 kbps que animam a pista",
  "Remix nacionais e internacionais de todos os tempos",
  "Atualizações mensais automáticas",
  "Mais de 400 serviços incluídos (Ultimix, Funkymix, DMC...)",
];

const heroStats = [
  { value: "400+", label: "Pools & Remix Services" },
  { value: "24/7", label: "Downloads ilimitados" },
  { value: "100%", label: "Ativação segura" },
  { value: "Imediato", label: "Acesso após confirmação" },
];

const softwareSuite = [
  { title: "Rekordbox Pro", text: "Preparação completa de tracks, cue points, análise e export para CDJs Pioneer.", tags: ["Performance", "Export USB", "Cloud Library"] },
  { title: "Serato DJ Pro", text: "O padrão dos clubes e battles. Todos os expansion packs e efeitos liberados.", tags: ["Battle Ready", "DVS", "FX Packs"] },
  { title: "Virtual DJ Pro", text: "Stems em tempo real, mixagem de vídeo e compatibilidade com qualquer controladora.", tags: ["Stems AI", "Video Mix", "Infinity"] },
];

const accessMethods = [
  { icon: HardDrive, title: "FTP Access", text: "Acesso FTP exclusivo via FileZilla — configuração rápida e conexão estável para downloads em massa." },
  { icon: CloudCog, title: "Google Drive", text: "Sincronização em nuvem rápida e organizada por pool, gênero e data de atualização." },
  { icon: Folder, title: "RaiDrive", text: "Integração nativa para acessar todo o conteúdo como um disco rígido direto no seu computador." },
];

const faqs = [
  { q: "Em quais formatos os arquivos estão disponíveis?", a: "A maioria em MP3 320kbps, com diversos serviços também em WAV para máxima qualidade." },
  { q: "Quantos downloads posso fazer por mês?", a: "Downloads ilimitados, 24 horas por dia, 7 dias por semana, durante todo o período do seu plano." },
  { q: "Qual método de acesso é o mais indicado?", a: "Google Drive é o mais simples para começar; FTP e RaiDrive são ideais para downloads em massa." },
  { q: "Existe fidelidade ou multa de cancelamento?", a: "Não. Os planos não têm fidelidade, você pode cancelar quando quiser." },
  { q: "Como funciona o suporte?", a: "Atendimento humano via WhatsApp para dúvidas sobre acesso, pagamento e uso da plataforma." },
];

const tracks = [
  { pack: "FUNKYMIX", title: "310babii & James Brown – Bad (Dirty)", bpm: 100, duration: "4:10" },
  { pack: "ULTIMIX", title: "Alex Warren – Ordinary (Kwikmix)", bpm: 125, duration: "2:29" },
  { pack: "BACKSPINS", title: "Black Eyed Peas Vs AC/DC – I Gotta Feeling To Shake All Night Long", bpm: 125, duration: "4:06" },
  { pack: "FUNKYMIX", title: "Lil Tecca – Dark Thoughts (Clean)", bpm: 102, duration: "3:49" },
  { pack: "HOUSE MIX", title: "Crystal Waters – 100% Pure Love (It's About Time Edit)", bpm: 112, duration: "3:47" },
  { pack: "AFROBEAT", title: "Beyoncé – Crazy In Love (Edit)", bpm: 0, duration: "2:42" },
];

const testimonials = [
  {
    name: "Thales de Paulas",
    role: "DJ & Produtor",
    quote:
      "Agora a coisa ficou séria! Muita música boa e o melhor, tá tudo num lugar só. Todos os DJs do Brasil precisam se ligar nesse material.",
  },
  {
    name: "Leo Gueddez",
    role: "DJ e Produtor Musical",
    quote:
      "Incrível. Vou precisar de um HD maior haha... Gostei muito da pasta de Flash. Vou indicar pra uma galera com certeza.",
  },
  {
    name: "Linna Vee",
    role: "DJ",
    quote: "Melhor acervo que já assinei. Organização impecável e atualizações constantes.",
  },
];

const bonuses = [
  { number: "01", title: "Vídeos Extend Remix", description: "Pastas exclusivas de vídeos em versões remix e extend para DJs e VJs." },
  { number: "02", title: "Brasil Extend Remix", description: "Os melhores remix e extends do Brasil, prontos para o seu set." },
  { number: "03", title: "Instrumentais e Acapellas", description: "Sucessos de todos os tempos para você criar suas próprias misturas." },
  { number: "04", title: "Mashups", description: "O melhor service de mashups, misturando vários clássicos em uma faixa só." },
  { number: "05", title: "Curso de Re-Grid", description: "Aprenda a colocar músicas fora do grid para tocar no ritmo certo." },
  { number: "06", title: "Set Mix", description: "Pastas com sets já mixados para apoiar em momentos específicos." },
];

const plans = [
  {
    name: "1 Mês de Acesso",
    price: "R$ 47",
    period: "Pagamento único",
    features: ["Acesso ao Drive por 1 mês", "Acesso aos bônus", "Atualizações do período"],
    highlight: false,
  },
  {
    name: "3 Meses de Acesso",
    price: "R$ 127",
    period: "3x de R$ 44,80",
    features: ["Acesso ao Drive por 3 meses", "Acesso aos bônus", "10% de desconto"],
    highlight: true,
  },
  {
    name: "1 Ano de Acesso",
    price: "R$ 357",
    period: "12x de R$ 35,63",
    features: ["Acesso ao Drive por 1 ano", "Acesso aos bônus", "35% de desconto"],
    highlight: false,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#150C29] via-[#0B0813] to-[#08070D]">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-20 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/30 blur-[150px]" />
        <div className="relative mx-auto max-w-4xl animate-fade-in-up">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300 ring-1 ring-inset ring-white/10">
            <Sparkles size={14} /> 🇧🇷 100% Brasileiro · Acesso imediato ao acervo
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-wide sm:text-6xl">
            Os edits, remix services e versões que{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              DJs profissionais
            </span>{" "}
            usam para manter a pista fluindo
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-gray-400">
            Tudo pronto para entrar no seu set ainda hoje. Economize horas de pesquisa e tenha acesso às versões
            certas para mixagens mais rápidas, limpas e versáteis.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#planos"
              className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-4 text-sm font-bold uppercase tracking-wide shadow-lg shadow-violet-900/40 transition-all duration-300 ease-out hover:scale-105 hover:from-violet-500 hover:to-cyan-400 sm:w-auto"
            >
              Entrar para o acervo 🔥
            </a>
            <a
              href="#acervo"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-gray-200 transition-all duration-300 ease-out hover:border-violet-500/50 hover:bg-white/10 sm:w-auto"
            >
              Explorar o acervo
            </a>
          </div>
          <p className="mt-6 text-xs uppercase tracking-wider text-gray-500">
            Atualizações frequentes &middot; Organização por estilos &middot; Acesso imediato
          </p>
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 py-4">
                <p className="font-display text-2xl tracking-wide text-white">{stat.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mx-auto mt-14 max-w-4xl px-2 sm:px-0">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-violet-900/30 sm:p-3">
            <img
              src="/images/repertorio-2026.png"
              alt="Repertório Brazilian Packs 2026"
              className="h-auto w-full rounded-xl object-contain"
            />
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="border-y border-white/5 bg-white/[0.02] px-6 py-14">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Para DJs de eventos, bares, casamentos, clubs e pistas open format
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            Um bom set começa muito antes da primeira mix. Economize horas de pesquisa e encontre rapidamente as
            versões certas para cada tipo de pista.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl space-y-4 text-left text-gray-400 [text-align:justify]">
          <h3 className="font-display text-xl font-bold text-white">Repertório atualizado para DJs profissionais</h3>
          <p>
            Se você toca em eventos, bares, casamentos, baladas, clubs ou pistas open format, sabe que o sucesso da
            pista depende de um repertório certo, atualizado e organizado.
          </p>
          <p>
            Na Brazilian Packs, reunimos as músicas que realmente estão funcionando nas pistas, com versões editadas,
            remixes exclusivos, hits nacionais e internacionais, funk, sertanejo, eletrônico, pop, pagode, arrocha e
            muito mais — tudo pronto para tocar.
          </p>
          <p>
            Chega de perder horas procurando músicas em vários lugares. Tenha acesso a um acervo atualizado
            constantemente, organizado por estilos e ocasiões, para montar seus sets em poucos minutos e focar no que
            realmente importa: fazer a pista lotar.
          </p>
          <p>Mais música, menos tempo pesquisando. Mais qualidade para os seus eventos.</p>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-center">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-violet-900/30 sm:p-3">
            <img
              src="https://i.ibb.co/CKt9XVVb/e511fe0f-54f0-48d3-9f16-2d3165d5b9db.png"
              alt="Organização do acervo Brazilian Packs"
              className="h-auto w-full rounded-xl object-contain"
            />
          </div>
          <ul className="space-y-4">
            {benefits.map((item, index) => {
              const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
              return (
                <li
                  key={item}
                  className={`flex items-start gap-3 rounded-xl border ${c.border} bg-white/5 p-4 transition-all duration-300 ${c.hoverBorder} hover:bg-white/[0.07]`}
                >
                  <CheckCircle2 className={`mt-0.5 h-5 w-5 flex-shrink-0 ${c.text}`} />
                  <span className="text-sm text-gray-200">{item}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Marcas */}
      <section className="border-y border-white/5 bg-white/[0.02] px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-2xl tracking-wide sm:text-3xl">Veja o que você vai receber</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {brands.map((brand, index) => {
              const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
              return (
                <div
                  key={brand}
                  className={`flex items-center justify-center rounded-xl border ${c.border} bg-white/5 py-6 text-sm font-bold tracking-wide ${c.text} transition-all duration-300 hover:-translate-y-1 hover:text-white`}
                >
                  {brand}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Software Pro Suite */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300">
              <Wrench size={14} /> Software Pro Suite
            </span>
            <h2 className="mt-4 font-display text-2xl tracking-wide sm:text-3xl">Potencialize sua performance</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-400">
              As três ferramentas mais usadas do mundo, prontas para tocar. Sem gambiarra, sem travamento no meio do set.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {softwareSuite.map((item, index) => {
              const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
              return (
                <div key={item.title} className={`rounded-2xl border ${c.border} bg-white/5 p-6 transition-all duration-300 ${c.hoverBorder} hover:-translate-y-1`}>
                  <h3 className="font-display text-xl tracking-wide text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{item.text}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className={`rounded-full ${c.bg} px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${c.text}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Métodos de Acesso */}
      <section className="border-y border-white/5 bg-white/[0.02] px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-2xl tracking-wide sm:text-3xl">Métodos de acesso</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-400">
            Escolha como quer baixar. Todos os métodos liberados na mesma assinatura.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {accessMethods.map((method, index) => {
              const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
              return (
                <div key={method.title} className={`rounded-2xl border ${c.border} bg-white/5 p-6 text-left transition-all duration-300 hover:-translate-y-1`}>
                  <span className={`font-display text-3xl ${c.text} opacity-50`}>{`0${index + 1}`}</span>
                  <div className="mt-3 flex items-center gap-2">
                    <method.icon className={`h-5 w-5 ${c.text}`} />
                    <h3 className="font-semibold text-white">{method.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">{method.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Acervo */}
      <section id="acervo" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-2xl tracking-wide sm:text-3xl">Catálogo de pools & remix services</h2>
            <p className="mt-3 text-gray-400">
              Um acervo gigante de edits, extended, acapellas e clássicos remasterizados — e muito mais chegando todos os dias.
            </p>
          </div>
          <div className="mt-10">
            <DriveCatalog />
          </div>
        </div>
      </section>

      {/* Faixas */}
      <section className="border-y border-white/5 bg-white/[0.02] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
            Ouça algumas faixas do nosso superpack
          </h2>
          <div className="mt-10 space-y-3">
            {tracks.map((track, index) => (
              <div
                key={track.title}
                className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/5 p-4 transition-all duration-300 hover:border-cyan-400/40"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 text-xs font-bold">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{track.title}</p>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {track.pack} {track.bpm ? `· ${track.bpm} BPM` : ""}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs text-gray-500">{track.duration}</span>
                <Headphones className="h-4 w-4 flex-shrink-0 text-gray-600" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
            Veja o que os DJs que já adquiriram o Brazilian Packs dizem
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, index) => {
              const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
              return (
                <div key={t.name} className={`rounded-xl border ${c.border} bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1`}>
                  <div className={`mb-3 flex gap-1 ${c.text}`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-300">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-4 text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bônus */}
      <section className="border-y border-white/5 bg-white/[0.02] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
            Tudo que é bom pode melhorar: conheça nossos bônus exclusivos
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {bonuses.map((bonus, index) => {
              const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
              return (
                <div
                  key={bonus.number}
                  className={`rounded-xl border ${c.border} bg-white/5 p-6 transition-all duration-300 ${c.hoverBorder} hover:-translate-y-1`}
                >
                  <span className={`font-display text-3xl font-bold ${c.text}`}>{bonus.number}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-white">{bonus.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{bonus.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Confira nossas opções de planos</h2>
          <p className="mt-3 text-gray-400">Facilite sua vida como DJ. Ganhe tempo. Eleve seu set.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 text-left transition-all duration-300 ${
                  plan.highlight
                    ? "scale-[1.03] border-violet-500 bg-gradient-to-b from-violet-600/20 to-transparent shadow-2xl shadow-violet-900/30"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-1 text-xs font-bold uppercase tracking-wide">
                    Mais comprado
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-4 font-display text-4xl font-bold text-white">{plan.price}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{plan.period}</p>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="mt-8 w-full rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 py-3 text-sm font-bold uppercase tracking-wide transition-all duration-300 ease-out hover:scale-105">
                  Comprar
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="border-y border-white/5 bg-white/[0.02] px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-2xl tracking-wide sm:text-3xl">Ainda tem dúvidas?</h2>
          <p className="mt-3 text-gray-400">
            Fale agora no WhatsApp com a nossa equipe e vamos tirar todas as suas dúvidas sobre o acesso ao drive.
          </p>
          <a
            href="https://wa.me/message/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:bg-green-600"
          >
            <MessageCircle size={18} /> Quero tirar dúvidas agora!
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-2xl tracking-wide sm:text-3xl">Perguntas frequentes</h2>
          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-white/10 bg-white/5 p-4 open:border-violet-500/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-violet-400 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-gray-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-white/[0.02] px-6 py-12 text-sm text-gray-400">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-display text-lg tracking-wide text-white">
              <Music4 size={18} className="text-violet-400" /> BRAZILIAN PACKS
            </div>
            <p className="mt-3 text-xs text-gray-500">
              O ecossistema completo para DJs profissionais, produtores e criadores de conteúdo de áudio. 🇧🇷 Feito com
              orgulho no Brasil.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm tracking-wide text-white">Plataforma</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><a href="#planos" className="transition-colors duration-300 hover:text-white">Planos</a></li>
              <li><a href="/deemix" className="transition-colors duration-300 hover:text-white">Deemix</a></li>
              <li><a href="/allavsoft" className="transition-colors duration-300 hover:text-white">Allavsoft</a></li>
              <li><a href="#acervo" className="transition-colors duration-300 hover:text-white">Catálogo</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm tracking-wide text-white">Suporte</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><a href="https://wa.me/message/" target="_blank" rel="noopener noreferrer" className="transition-colors duration-300 hover:text-white">WhatsApp</a></li>
              <li><a href="#faq" className="transition-colors duration-300 hover:text-white">Central de ajuda</a></li>
              <li><a href="/termos" className="transition-colors duration-300 hover:text-white">Termos de Serviço</a></li>
              <li><a href="/privacidade" className="transition-colors duration-300 hover:text-white">Política de Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center gap-3 border-t border-white/5 pt-6 text-center text-xs text-gray-500 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Brazilian Packs. Todos os direitos reservados.</p>
          <p className="uppercase tracking-wider">SSL Seguro &middot; Pix & Cartão &middot; Compra Protegida</p>
        </div>
      </footer>
    </div>
  );
}
