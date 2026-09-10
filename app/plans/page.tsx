import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CheckCircle2,
  Clock3,
  Download,
  FolderOpen,
  Headphones,
  HelpCircle,
  Lock,
  MessageCircle,
  Monitor,
  Music2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { PlansSection } from "../components/PlansSection";
import { SectionHeading } from "../components/SectionHeading";
import { formatDueDate } from "../lib/due-queue";
import { userHasActiveVipAccess } from "../lib/mercadopago/webhook-policy";
import { SITE_DEEMIX_PLANS, SITE_DRIVE_PLANS } from "../lib/plans";
import { getAuthenticatedPortalUser } from "../lib/portal";
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

const includedDetails = [
  { title: "+315 GB de acervo", text: "Volume atual do Drive VIP, em constante crescimento." },
  { title: "+40.012 faixas", text: "Edits, extended, clean/dirty e materiais para a pista." },
  { title: "~739 pastas", text: "Organização por mês, semana, estilo e coleções." },
  { title: "Login único", text: "Mesma conta no site, na plataforma /musicas e no Downloader." },
];

const paymentPoints = [
  "Checkout oficial do Mercado Pago (cartão, Pix e demais meios disponíveis)",
  "Pagamento único por período — renovação manual quando o acesso vencer",
  "Com VIP ativo, a compra de novo plano fica bloqueada até o vencimento",
  "Plano teste de 3 dias (R$ 1,00) só para quem ainda não tem VIP",
  "No Pix: após pagar, clique em “Voltar para Brazilian Dj Pools” no rodapé do Mercado Pago",
  "A {site} libera o acesso só após a confirmação oficial do pagamento — o redirect não libera plano",
].map((text) => text.replace("{site}", SITE_NAME));

const howItWorks = [
  {
    step: "01",
    title: "Escolha o plano",
    text: "Use o Teste 3 dias (R$ 1,00) para validar produção, ou escolha 1 mês, 3 meses ou 1 ano.",
  },
  {
    step: "02",
    title: "Pague no Mercado Pago",
    text: "No Pix, após pagar clique em “Voltar para Brazilian Dj Pools” no rodapé. Cartão pode redirecionar sozinho.",
  },
  {
    step: "03",
    title: "Acesso liberado",
    text: "O webhook confirma o pagamento. Plataforma, packs e Downloader liberam automaticamente.",
  },
];

const faqs = [
  {
    q: "Posso comprar outro plano com VIP ainda ativo?",
    a: "Não. Enquanto o VIP estiver válido, o checkout fica bloqueado. Renove só depois do vencimento — assim evitamos cobranças duplicadas (como o teste de R$ 1 em cima de um plano já ativo).",
  },
  {
    q: "Paguei no Pix e a tela do QR não muda. E agora?",
    a: "É normal. Role até o rodapé do Mercado Pago e clique em “Voltar para Brazilian Dj Pools”. O acesso libera pelo webhook; o botão só te devolve ao site.",
  },
  {
    q: "O plano Teste 3 dias é cobrança real?",
    a: "Sim. É R$ 1,00 em produção no Mercado Pago, com acesso VIP completo por 3 dias — ideal para testar checkout, webhook e liberação. Indisponível se você já tem VIP ativo.",
  },
  {
    q: "O redirect de sucesso já libera o VIP?",
    a: "Não. Só o webhook validado no servidor libera o acesso. A página /pagamento apenas consulta o status interno.",
  },
  {
    q: "Posso renovar depois?",
    a: "Sim. A renovação é manual: quando o período acabar, escolha de novo o plano em /plans.",
  },
  {
    q: "O Downloader usa o mesmo login?",
    a: "Sim. Conta VIP, plataforma /musicas e BRS Downloader Windows usam o mesmo e-mail e senha.",
  },
  {
    q: "Quais formas de pagamento aceitam?",
    a: "As disponíveis no Checkout Pro do Mercado Pago (cartão, Pix e outras opções da sua conta MP).",
  },
  {
    q: "E se o pagamento ficar pendente?",
    a: "Aguarde a confirmação. Pix e alguns meios podem demorar alguns minutos. O acesso entra assim que o status approved chegar no webhook.",
  },
];

export default async function PlansPage() {
  const toCards = (plans: typeof SITE_DRIVE_PLANS) =>
    plans
      .filter((plan) => plan.id)
      .map((plan) => ({
        id: plan.id!,
        name: plan.name,
        price: plan.price,
        period: plan.period,
        equivalent: plan.equivalent,
        badge: plan.badge,
        features: plan.features,
        highlight: plan.highlight,
        description: plan.description,
        isTestPlan: plan.isTestPlan,
        serviceProduct: plan.serviceProduct,
      }));

  const drivePlans = toCards(SITE_DRIVE_PLANS);
  const deemixPlans = toCards(SITE_DEEMIX_PLANS);

  const user = await getAuthenticatedPortalUser();
  const activeVip =
    user &&
    userHasActiveVipAccess({
      servicePoolsVip: user.services.poolsVip,
      nextDueAt: user.nextDueAt,
      servicePoolsVipDueAt: user.serviceBilling.poolsVip.dueAt,
    })
      ? {
          expiresLabel: formatDueDate(
            user.serviceBilling.poolsVip.dueAt ?? user.nextDueAt,
          ),
        }
      : null;
  const activeDeemix =
    user &&
    user.services.deemix &&
    user.serviceBilling.deemix.dueAt &&
    user.serviceBilling.deemix.dueAt.getTime() > Date.now()
      ? { expiresLabel: formatDueDate(user.serviceBilling.deemix.dueAt) }
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden border-b border-white/5 px-4 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
        <div className="pointer-events-none absolute inset-0 site-glow-green opacity-80" />
        <div className="pointer-events-none absolute inset-0 site-glow-blue opacity-50" />
        <div className="relative mx-auto max-w-3xl text-center">
          <SectionHeading
            badge="Planos"
            title="BRS Drive VIP + Deemix"
            subtitle="Assine pools VIP ou Deemix (ARL 320) via Mercado Pago. Pagamento único, renovação manual e liberação automática no portal."
          />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold tracking-[-0.01em] text-zinc-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#009739]" />
              Mercado Pago
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <Clock3 className="h-3.5 w-3.5 text-[#6B9FFF]" />
              Drive · Deemix
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#FFDF00]" />
              10% nos pacotes longos
            </span>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="min-h-[320px]" />}>
        <PlansSection
          id="planos"
          className="!border-t-0"
          plans={drivePlans}
          badge="Drive VIP"
          title="Planos BRS Drive"
          subtitle="Acervo VIP, plataforma /musicas e Downloader. Inclui plano teste de 3 dias para validar produção."
          activeVip={activeVip}
          showPixNotice
        />
      </Suspense>

      <Suspense fallback={<div className="min-h-[280px]" />}>
        <PlansSection
          id="deemix-planos"
          plans={deemixPlans}
          badge="Deemix"
          title="Planos Deemix"
          subtitle="ARL 320 kbps no portal. Mensal R$ 30, ou 90/180 dias com 10% de desconto."
          activeDeemix={activeDeemix}
          showPixNotice={false}
          loginReturnPath="/deemix"
        />
      </Suspense>

      <section className="border-b border-white/5 px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            badge="Números"
            title="O que você acessa com o VIP"
            subtitle="Volume atual do acervo — em constante atualização."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {includedDetails.map((item) => (
              <div key={item.title} className="site-panel p-5 text-center md:text-left">
                <p className="font-display text-xl font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              subtitle="O Mercado Pago processa a cobrança. A Brazilian Remix Service libera o acesso à plataforma e ao Downloader assim que o pagamento é confirmado."
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
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <ShieldCheck className="h-8 w-8 flex-shrink-0 text-[#009739]" />
                  <div>
                    <p className="text-sm font-semibold text-white">Pagamento via Mercado Pago</p>
                    <p className="text-xs text-zinc-500">Teste R$ 1 · 1m R$ 38 · 3m R$ 102,60 · 1 ano R$ 384</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#6B9FFF]/25 bg-[#002776]/20 px-4 py-3">
                  <Wallet className="h-8 w-8 flex-shrink-0 text-[#6B9FFF]" />
                  <div>
                    <p className="text-sm font-semibold text-white">Plano teste production</p>
                    <p className="text-xs text-zinc-400">3 dias de VIP por R$ 1,00 — mesmo fluxo dos planos oficiais.</p>
                  </div>
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

      <section className="border-b border-white/5 px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            badge="FAQ"
            title="Perguntas frequentes"
            subtitle="Respostas rápidas sobre planos, teste e liberação de acesso."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <div key={item.q} className="site-panel p-5 md:p-6">
                <div className="mb-3 flex items-start gap-2">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#009739]" />
                  <h3 className="font-display text-base font-semibold text-white">{item.q}</h3>
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 text-center sm:px-6 md:py-16">
        <div className="mx-auto max-w-2xl">
          <SectionHeading
            title="Ainda tem dúvidas?"
            subtitle="Fale conosco pelo WhatsApp sobre planos, teste de 3 dias, liberação de acesso, Downloader e renovação."
          />
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#planos" className="site-btn site-btn-primary">
              <Monitor size={18} /> Ver planos
            </a>
            <a
              href={whatsappUrl("Olá! Vim pela página de planos e quero saber mais sobre o BRS Drive VIP.")}
              target="_blank"
              rel="noopener noreferrer"
              className="site-btn site-btn-ghost"
            >
              <MessageCircle size={18} /> Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
