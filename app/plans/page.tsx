import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CheckCircle2,
  Download,
  FolderOpen,
  Headphones,
  Lock,
  MessageCircle,
  Monitor,
  Music2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { PlansSection } from "../components/PlansSection";
import { SectionHeading } from "../components/SectionHeading";
import { SITE_PLANS } from "../lib/plans";
import { SITE_NAME } from "../lib/branding";
import { whatsappUrl } from "../lib/site";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("plans");

const benefits = [
  {
    icon: Music2,
    title: "Acervo para DJs",
    text: "Pools, edits, remixes e versões prontas para a pista, com curadoria pensada para o repertório brasileiro.",
  },
  {
    icon: RefreshCw,
    title: "Atualizações mensais",
    text: "Novos packs e conteúdos entram todos os meses para você manter o set sempre atualizado.",
  },
  {
    icon: FolderOpen,
    title: "Packs organizados",
    text: "Pastas por mês, semana e estilo — encontre rápido o que precisa sem perder tempo na preparação.",
  },
  {
    icon: Headphones,
    title: "Plataforma VIP",
    text: "Ouça e baixe pelo site, navegue no acervo e acompanhe as atualizações em um só lugar.",
  },
  {
    icon: Download,
    title: "Downloader Windows",
    text: "Baixe pastas inteiras com o BRS Downloader oficial, sincronizado com a sua conta.",
  },
  {
    icon: Zap,
    title: "Acesso automático",
    text: "Assim que o Mercado Pago confirmar o pagamento, o plano é liberado na sua conta sem espera manual.",
  },
];

const paymentPoints = [
  "Checkout oficial do Mercado Pago, com criptografia e proteção da compra",
  "Cartão, Pix e demais meios disponíveis no checkout Mercado Pago",
  "Cobrança mensal da assinatura gerenciada com segurança",
  "Comprovante e histórico de pagamento na sua conta Mercado Pago",
  "A {site} libera o acesso só após a confirmação do pagamento — sem liberação falsa por redirect",
].map((text) => text.replace("{site}", SITE_NAME));

const howItWorks = [
  {
    step: "01",
    title: "Escolha o plano",
    text: "Selecione o BRS Drive Mensal (R$ 38,00) e clique em Assinar agora.",
  },
  {
    step: "02",
    title: "Pague no Mercado Pago",
    text: "Finalize o checkout seguro. Se ainda não tiver conta BRS, faça login ou cadastro antes.",
  },
  {
    step: "03",
    title: "Acesso liberado",
    text: "Com o pagamento aprovado, plataforma, packs e Downloader ficam disponíveis automaticamente.",
  },
];

export default function PlansPage() {
  const plans = SITE_PLANS.filter((plan) => plan.id).map((plan) => ({
    id: plan.id!,
    name: plan.name,
    price: plan.price,
    period: plan.period,
    badge: plan.badge,
    features: plan.features,
    highlight: plan.highlight,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden border-b border-white/5 px-4 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
        <div className="pointer-events-none absolute inset-0 site-glow-green opacity-80" />
        <div className="pointer-events-none absolute inset-0 site-glow-blue opacity-50" />
        <div className="relative mx-auto max-w-3xl text-center">
          <SectionHeading
            badge="Planos"
            title="BRS Drive Mensal"
            subtitle="Assinatura mensal com acesso completo ao acervo VIP, plataforma para DJs e Downloader para Windows. Pagamento processado com segurança pelo Mercado Pago."
          />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold tracking-[-0.01em] text-zinc-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#009739]" />
              Mercado Pago
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <Monitor className="h-3.5 w-3.5 text-[#FFDF00]" />
              Downloader
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#6B9FFF]" />
              Atualizações
            </span>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="min-h-[320px]" />}>
        <PlansSection className="!border-t-0" plans={plans} />
      </Suspense>

      <section className="border-b border-white/5 site-section-green px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            badge="Benefícios"
            title="Tudo que entra na assinatura"
            subtitle="Um plano pensado para a rotina do DJ: repertório atualizado, organização e ferramentas para baixar e tocar com praticidade."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item) => (
              <div key={item.title} className="site-panel p-5 md:p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#009739]/15 text-[#00B347]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <SectionHeading
              centered={false}
              badge="Pagamento"
              title="Checkout seguro pelo Mercado Pago"
              subtitle="O Mercado Pago processa a assinatura. A Brazilian Remix Service libera o acesso à plataforma e ao Downloader assim que o pagamento é confirmado."
            />
            <ul className="mt-8 space-y-3">
              {paymentPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#009739]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="site-panel relative overflow-hidden p-6 md:p-8">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#009739]/20 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#009739]/40 bg-[#009739]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#00B347]">
                <Lock className="h-3 w-3" />
                Ambiente protegido
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold text-white">
                Você paga no Mercado Pago.
                <br />
                O acesso fica na BRS.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Não processamos cartão no nosso site. O redirect de sucesso não libera o plano — a liberação
                depende exclusivamente da confirmação oficial do pagamento no Mercado Pago.
              </p>
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <ShieldCheck className="h-8 w-8 flex-shrink-0 text-[#009739]" />
                <div>
                  <p className="text-sm font-semibold text-white">Pagamento processado pelo Mercado Pago</p>
                  <p className="text-xs text-zinc-500">Assinatura mensal · R$ 38,00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 site-section-blue px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            badge="Como funciona"
            title="Do clique ao acesso em três passos"
            subtitle="Simples, transparente e automático depois da confirmação do pagamento."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {howItWorks.map((item) => (
              <div key={item.step} className="site-panel p-6 text-center md:text-left">
                <span className="font-display text-3xl font-bold text-[#FFDF00]/80">{item.step}</span>
                <h3 className="mt-3 font-display text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 text-center sm:px-6 md:py-16">
        <div className="mx-auto max-w-2xl">
          <SectionHeading
            title="Ainda tem dúvidas?"
            subtitle="Fale com a gente pelo WhatsApp sobre o BRS Drive Mensal, liberação de acesso, Downloader e renovação."
          />
          <a
            href={whatsappUrl("Olá! Vim pela página de planos e quero saber mais sobre o BRS Drive Mensal.")}
            target="_blank"
            rel="noopener noreferrer"
            className="site-btn site-btn-primary mt-8"
          >
            <MessageCircle size={18} /> Falar no WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
