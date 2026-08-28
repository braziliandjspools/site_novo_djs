import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clipboard,
  Download,
  FileVideo,
  Film,
  Globe,
  Info,
  KeyRound,
  MessageCircleQuestion,
  MonitorPlay,
  Music2,
  ShoppingCart,
  Star,
  Zap,
  Shield,
} from "lucide-react";

// Paleta inspirada no Brasil: verde, amarelo, azul + acentos vibrantes
const CARD_COLORS = {
  green: { bg: "bg-green-600/15", text: "text-green-400", border: "border-green-500/30" },
  yellow: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
  blue: { bg: "bg-blue-600/15", text: "text-blue-400", border: "border-blue-500/30" },
  violet: { bg: "bg-violet-600/15", text: "text-violet-400", border: "border-violet-500/30" },
  cyan: { bg: "bg-cyan-600/15", text: "text-cyan-400", border: "border-cyan-500/30" },
  fuchsia: { bg: "bg-fuchsia-600/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30" },
} as const;
type CardColor = keyof typeof CARD_COLORS;
const COLOR_CYCLE: CardColor[] = ["green", "yellow", "blue", "violet", "cyan", "fuchsia"];

const features = [
  { title: "Download de Vídeos e Áudios", text: "Baixe vídeos em HD, Full HD, 4K e 8K, além de extrair áudio em MP3, WAV, FLAC e outros." },
  { title: "Compatibilidade com Mais de 1000 Sites", text: "YouTube, Facebook, Vimeo, TikTok, Instagram, Spotify, Deezer, Dailymotion e muitos outros." },
  { title: "Conversão de Formatos", text: "Converta vídeos e áudios para MP4, AVI, MOV, MKV, MP3, AAC, entre outros." },
  { title: "Download em Lote", text: "Cole uma lista de URLs e baixe vários arquivos de uma vez." },
  { title: "Gravador de Tela Integrado", text: "Capture qualquer conteúdo reproduzido no seu computador." },
  { title: "Captura de Legendas e Metadados", text: "Baixe com legendas embutidas e preserve metadados de faixa, artista e álbum." },
];

const colorClasses = {
  violet: { bg: "bg-violet-600/20", text: "text-violet-400" },
  cyan: { bg: "bg-cyan-600/20", text: "text-cyan-400" },
  fuchsia: { bg: "bg-fuchsia-600/20", text: "text-fuchsia-400" },
} as const;

const highlights = [
  { icon: Zap, title: "Download Rápido", text: "Otimizado para baixar vídeos e músicas na máxima velocidade da sua conexão.", color: "violet" },
  { icon: Shield, title: "100% Seguro", text: "Downloads seguros e instalação limpa, livre de adwares ou malwares.", color: "cyan" },
  { icon: Globe, title: "Suporte a +1000 Sites", text: "Baixe de YouTube, Vimeo, Facebook, Spotify e centenas de outros sites.", color: "fuchsia" },
  { icon: Film, title: "Conversão Total", text: "Converta para qualquer formato de vídeo ou áudio com compatibilidade total.", color: "violet" },
  { icon: Star, title: "Interface Intuitiva", text: "Design moderno e fácil de usar. Copie, cole e baixe em segundos.", color: "cyan" },
  { icon: MonitorPlay, title: "Gravador de Tela", text: "Capture qualquer atividade em sua tela, como lives e chamadas de vídeo.", color: "fuchsia" },
] as const;

const steps = [
  { icon: Clipboard, title: "Copie o link", text: "Copie a URL do vídeo, música ou playlist que deseja baixar." },
  { icon: FileVideo, title: "Cole no Allavsoft", text: "Cole o link no programa e escolha o formato de saída desejado." },
  { icon: Download, title: "Baixe e converta", text: "O Allavsoft baixa e converte automaticamente para o formato escolhido." },
];

const formats = [
  { icon: FileVideo, title: "Vídeo", text: "MP4, AVI, MOV, MKV, WMV, FLV e mais." },
  { icon: Music2, title: "Áudio", text: "MP3, WAV, FLAC, AAC, M4A e mais." },
  { icon: KeyRound, title: "Licença", text: "Chave vitalícia com atualizações de compatibilidade incluídas." },
];

const faqs = [
  { q: "Funciona em Mac e Windows?", a: "Sim, o Allavsoft está disponível para Windows e macOS." },
  { q: "Posso baixar playlists inteiras?", a: "Sim, basta colar o link da playlist e o Allavsoft baixa todos os itens." },
  { q: "A licença expira?", a: "Não, a licença é vitalícia e inclui atualizações de compatibilidade." },
];

export default function AllavsoftPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-6 py-16">
      <div className="flex items-center gap-4">
        <Link href="/" className="rounded-md border border-violet-600/30 bg-black/40 p-2 transition-colors duration-300 hover:bg-black/60">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight">ALLAVSOFT</h1>
      </div>

      <section className="text-center">
        <h2 className="font-display text-4xl font-bold sm:text-5xl">Allavsoft</h2>
        <p className="mx-auto mt-4 max-w-3xl text-gray-400">
          A sua central de download de mídia pessoal. Baixe e converta vídeos e músicas de mais de 1000 sites,
          incluindo YouTube, Spotify, e muito mais.
        </p>
        <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-blue-500/30 bg-white/5 p-2 shadow-2xl shadow-blue-900/20 sm:p-3">
          <Image src="https://i.ibb.co/JXJDdXx/allavsoft.png" alt="Interface do Allavsoft" width={1200} height={600} className="h-auto w-full rounded-xl object-contain" unoptimized />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h3 className="text-center font-display text-2xl font-bold">
          A Solução Completa para Baixar Vídeos e Áudios da Internet
        </h3>
        <p className="mx-auto mt-4 max-w-3xl text-center text-gray-400">
          O Allavsoft é uma poderosa ferramenta para quem busca praticidade e eficiência na hora de baixar conteúdos
          multimídia da internet, salvando vídeos, músicas, playlists e até legendas com apenas alguns cliques.
        </p>
        <h4 className="mt-8 text-center font-display text-xl font-bold text-violet-400">
          ✅ Principais Funcionalidades
        </h4>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((f, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={f.title} className={`rounded-lg border ${c.border} bg-black/30 p-4 transition-all duration-300 hover:-translate-y-0.5`}>
                <p className="text-sm text-gray-300">
                  <span className={`font-semibold ${c.text}`}>{f.title}:</span> {f.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-center font-display text-2xl font-bold uppercase">Recursos em destaque</h3>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((h) => {
            const colors = colorClasses[h.color];
            return (
              <div key={h.title} className="rounded-xl border border-white/10 bg-white/5 p-6 text-center transition-all duration-300 hover:border-violet-500/40">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${colors.bg}`}>
                  <h.icon className={`h-7 w-7 ${colors.text}`} />
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
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];
            return (
              <div key={step.title} className={`rounded-xl border ${c.border} bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1`}>
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
        <h3 className="text-center font-display text-2xl font-bold uppercase">Formatos e utilidades</h3>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {formats.map((f, index) => {
            const c = CARD_COLORS[COLOR_CYCLE[(index + 3) % COLOR_CYCLE.length]];
            return (
              <div key={f.title} className={`rounded-xl border ${c.border} bg-white/5 p-6 text-center transition-all duration-300 hover:-translate-y-1`}>
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${c.bg}`}>
                  <f.icon className={`h-6 w-6 ${c.text}`} />
                </div>
                <h4 className="font-semibold text-white">{f.title}</h4>
                <p className="mt-2 text-sm text-gray-400">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-600/30 bg-cyan-950/10 p-8 text-center">
        <h3 className="flex items-center justify-center gap-2 font-display text-xl font-bold text-cyan-300">
          <Info className="h-6 w-6" /> Sobre a Licença
        </h3>
        <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-300">
          Ao comprar, você adquire uma chave de licença para ativar e usar todas as funcionalidades premium do
          Allavsoft no seu computador, incluindo futuras atualizações de compatibilidade e suporte técnico.
        </p>
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

      <div className="flex justify-center">
        <a
          href="https://wa.me/5551935052274"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 px-8 py-4 text-sm font-bold uppercase tracking-wide text-slate-900 shadow-lg transition-all duration-300 ease-out hover:scale-105"
        >
          <ShoppingCart size={20} /> Comprar Licença Allavsoft
        </a>
      </div>
    </div>
  );
}
