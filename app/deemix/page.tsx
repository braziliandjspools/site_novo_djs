import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Check,
  Clock,
  FolderKanban,
  Globe,
  Headphones,
  HelpCircle,
  KeyRound,
  ListMusic,
  MessageCircleQuestion,
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
} from "lucide-react";

// Paleta inspirada no Brasil: verde, amarelo, azul + acentos vibrantes
const CARD_COLORS = {
  green: { bg: "bg-green-600/15", text: "text-green-400", border: "border-green-500/30", hoverBorder: "hover:border-green-500/50", hoverShadow: "hover:shadow-green-500/20" },
  yellow: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30", hoverBorder: "hover:border-yellow-500/50", hoverShadow: "hover:shadow-yellow-500/20" },
  blue: { bg: "bg-blue-600/15", text: "text-blue-400", border: "border-blue-500/30", hoverBorder: "hover:border-blue-500/50", hoverShadow: "hover:shadow-blue-500/20" },
  violet: { bg: "bg-violet-600/15", text: "text-violet-400", border: "border-violet-500/30", hoverBorder: "hover:border-violet-500/50", hoverShadow: "hover:shadow-violet-500/20" },
  cyan: { bg: "bg-cyan-600/15", text: "text-cyan-400", border: "border-cyan-500/30", hoverBorder: "hover:border-cyan-500/50", hoverShadow: "hover:shadow-cyan-500/20" },
  fuchsia: { bg: "bg-fuchsia-600/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30", hoverBorder: "hover:border-fuchsia-500/50", hoverShadow: "hover:shadow-fuchsia-500/20" },
} as const;
type CardColor = keyof typeof CARD_COLORS;
const COLOR_CYCLE: CardColor[] = ["green", "yellow", "blue", "violet", "cyan", "fuchsia"];

const advantages = [
  { title: "Velocidade Máxima", text: "Os downloads usam a conexão de 1 Gbit/s do nosso servidor, não a sua." },
  { title: "Sem Burocracia", text: "Não precisa de VPN, proxies ou configurações complexas. É só usar." },
  { title: "Economia de Banda", text: "Seu plano de internet não é consumido pelo download pesado dos arquivos de áudio." },
  { title: "Privacidade e Segurança", text: "Nosso servidor atua como um intermediário, protegendo seu IP." },
];

const features = [
  { icon: AudioLines, title: "Downloads em Qualidade Hi-Fi (FLAC)", text: "Baixe faixas em qualidade FLAC ou MP3 320kbps, ideal para profissionais de áudio." },
  { icon: ListMusic, title: "Álbuns, Singles e Discografias", text: "Baixe faixas individuais, álbuns completos, discografias e playlists do Deezer ou Spotify." },
  { icon: FolderKanban, title: "Gerenciamento Inteligente de Arquivos", text: "Tags ID3 completas, capa em alta resolução e organização automática em pastas." },
  { icon: Search, title: "Busca Integrada e Rápida", text: "Procure diretamente por artistas, álbuns ou músicas sem sair do programa." },
];

const highlights = [
  { icon: Zap, title: "Download Ultra Rápido", text: "Downloads em velocidade máxima direto dos servidores do Deezer, sem limitações de banda." },
  { icon: Shield, title: "100% Seguro", text: "Conexão criptografada e downloads seguros. Seus dados estão sempre protegidos." },
  { icon: Globe, title: "Acesso Global", text: "Acesse de qualquer lugar do mundo através do nosso servidor web dedicado." },
  { icon: Headphones, title: "Qualidade Premium", text: "Downloads em FLAC, 320kbps MP3 e outras qualidades. Áudio perfeito para audiófilos." },
  { icon: Star, title: "Interface Intuitiva", text: "Design moderno e fácil de usar. Encontre e baixe suas músicas em segundos." },
  { icon: Clock, title: "Disponível 24/7", text: "O servidor que faz o download para você está sempre online. Baixe quando quiser." },
];

const planColors = {
  fuchsia: { price: "text-fuchsia-400", check: "text-fuchsia-400", button: "bg-fuchsia-600 hover:bg-fuchsia-700" },
  cyan: { price: "text-cyan-400", check: "text-cyan-400", button: "bg-cyan-600 hover:bg-cyan-700" },
} as const;

const plans = [
  {
    name: "Deemix Padrão",
    price: "R$ 25,90/mês",
    color: "fuchsia",
    features: ["Qualidade 128kbps", "Downloads ilimitados", "Download de playlists do Spotify", "Suporte básico"],
  },
  {
    name: "Deemix Premium",
    price: "R$ 35,00/mês",
    color: "cyan",
    features: ["320 kbps e FLAC", "Downloads ilimitados", "Download de playlists do Spotify", "Suporte avançado"],
  },
] as const;

const steps = [
  { title: "Assine um plano", text: "Escolha entre o plano Padrão ou Premium e finalize o pagamento.", icon: Check },
  { title: "Receba sua ARL", text: "Enviamos sua chave ARL Premium já configurada, pronta para uso.", icon: KeyRound },
  { title: "Baixe e configure", text: "Instale o programa no seu PC e cole a ARL nas configurações.", icon: Monitor },
  { title: "Comece a baixar", text: "Busque músicas, álbuns ou playlists e baixe em alta velocidade.", icon: Music },
];

const requirements = [
  { icon: MonitorSmartphone, title: "Sistema Operacional", text: "Windows 10/11, macOS 11+ ou Linux (Ubuntu 20.04+)." },
  { icon: Wifi, title: "Conexão com a Internet", text: "Conexão estável para comunicação com o servidor dedicado." },
  { icon: ShieldCheck, title: "Espaço em Disco", text: "Mínimo de 2 GB livres para instalação e cache local." },
];

const faqs = [
  { q: "Preciso ter conta no Deezer?", a: "Não. Fornecemos uma ARL Premium já configurada para você usar." },
  { q: "Funciona em celular?", a: "O Deemix é feito para desktop (Windows, macOS ou Linux)." },
  { q: "Posso cancelar quando quiser?", a: "Sim, os planos são mensais e sem fidelidade." },
];

export default function DeemixPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-6 py-16">
      <div className="flex items-center gap-4">
        <Link href="/" className="rounded-md border border-violet-600/30 bg-black/40 p-2 transition-colors duration-300 hover:bg-black/60">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight">DEEMIX</h1>
      </div>

      <section className="text-center">
        <h2 className="font-display text-4xl font-bold sm:text-5xl">Deemix Server 2026</h2>
        <p className="mx-auto mt-4 max-w-3xl text-gray-400">
          A sua central de música pessoal que combina a simplicidade de um programa no seu PC com o poder de um
          servidor dedicado na nuvem para baixar todo o catálogo do Deezer e suas playlists do Spotify.
        </p>
        <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-green-500/30 bg-white/5 p-2 shadow-2xl shadow-green-900/20 sm:p-3">
          <Image src="https://i.ibb.co/S4zXbpWM/deemix.png" alt="Interface do Deemix" width={1200} height={600} className="h-auto w-full rounded-xl object-contain" unoptimized />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h3 className="text-center font-display text-2xl font-bold uppercase">A vantagem do servidor dedicado</h3>
        <p className="mx-auto mt-2 max-w-3xl text-center text-gray-400">
          Você instala o programa, mas a mágica acontece na nossa infraestrutura.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 text-center md:flex-row md:gap-8">
          <div className="flex flex-col items-center">
            <User size={36} className="text-cyan-400" />
            <p className="mt-2 font-semibold">Você (Seu PC)</p>
            <p className="text-xs text-gray-500">Programa leve</p>
          </div>
          <ArrowRight size={28} className="hidden text-gray-600 md:block" />
          <div className="flex flex-col items-center">
            <Server size={36} className="text-violet-400" />
            <p className="mt-2 font-semibold">Nosso Servidor</p>
            <p className="text-xs text-gray-500">Processamento e download</p>
          </div>
          <ArrowRight size={28} className="hidden text-gray-600 md:block" />
          <div className="flex flex-col items-center">
            <Music size={36} className="text-fuchsia-400" />
            <p className="mt-2 font-semibold">Servidores Deezer</p>
            <p className="text-xs text-gray-500">Fonte das músicas</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {advantages.map((a, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={a.title} className={`flex items-start gap-3 rounded-lg border ${c.border} bg-black/30 p-4 transition-all duration-300 hover:-translate-y-0.5 ${c.hoverBorder}`}>
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
        <h3 className="text-center font-display text-2xl font-bold uppercase">Principais funcionalidades</h3>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((f, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={f.title} className={`rounded-xl border-l-4 ${c.border.replace("border-", "border-l-")} bg-white/5 p-4 transition-all duration-300 hover:bg-white/[0.08]`}>
                <div className="flex items-center gap-3">
                  <f.icon className={`h-6 w-6 ${c.text}`} />
                  <h4 className="font-semibold text-white">{f.title}</h4>
                </div>
                <p className="mt-2 text-sm text-gray-400">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-center font-display text-2xl font-bold uppercase">Funcionalidades exclusivas</h3>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((h, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={h.title} className={`rounded-xl border ${c.border} bg-white/5 p-6 text-center shadow-lg shadow-transparent transition-all duration-300 hover:-translate-y-1 ${c.hoverShadow}`}>
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${c.bg}`}>
                  <h.icon className={`h-7 w-7 ${c.text}`} />
                </div>
                <h4 className="font-display font-semibold uppercase">{h.title}</h4>
                <p className="mt-2 text-sm text-gray-400">{h.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-center font-display text-2xl font-bold uppercase">Como funciona</h3>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={step.title} className={`relative rounded-xl border ${c.border} bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1`}>
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
        <h3 className="text-center font-display text-2xl font-bold uppercase">Requisitos do sistema</h3>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {requirements.map((r, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={r.title} className={`rounded-xl border ${c.border} bg-white/5 p-6 text-center transition-all duration-300 hover:-translate-y-1`}>
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${c.bg}`}>
                  <r.icon className={`h-6 w-6 ${c.text}`} />
                </div>
                <h4 className="font-semibold text-white">{r.title}</h4>
                <p className="mt-2 text-sm text-gray-400">{r.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-600/30 bg-cyan-950/10 p-8 text-center">
        <h3 className="flex items-center justify-center gap-2 font-display text-xl font-bold text-cyan-300">
          <HelpCircle className="h-6 w-6" /> Entendendo a ARL e o Spotify
        </h3>
        <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-300">
          A ARL é sua chave de acesso ao catálogo do Deezer. Ao assinar, fornecemos uma ARL Premium já configurada.
          Para o Spotify, você pode conectar sua própria conta e o Deemix encontrará as músicas no catálogo do Deezer.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {plans.map((plan) => {
          const colors = planColors[plan.color];
          return (
            <div key={plan.name} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <h4 className="font-display text-xl font-bold">{plan.name}</h4>
              <p className={`mt-2 font-display text-3xl font-bold ${colors.price}`}>{plan.price}</p>
              <ul className="mt-6 space-y-3 text-left">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className={`h-4 w-4 flex-shrink-0 ${colors.check}`} /> {f}
                  </li>
                ))}
              </ul>
              <button className={`mt-6 w-full rounded-lg ${colors.button} py-3 text-sm font-bold uppercase tracking-wide text-white transition-all duration-300 hover:scale-105`}>
                Assinar
              </button>
            </div>
          );
        })}
      </section>

      <section>
        <h3 className="flex items-center justify-center gap-2 text-center font-display text-2xl font-bold uppercase">
          <MessageCircleQuestion className="h-6 w-6 text-violet-400" /> Perguntas frequentes
        </h3>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="font-semibold text-white">{faq.q}</p>
              <p className="mt-2 text-sm text-gray-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-center text-sm text-gray-400">
        <Monitor className="h-5 w-5 flex-shrink-0" />
        Recomendamos usar em um computador para a melhor experiência de configuração.
      </div>
    </div>
  );
}
