import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CheckCircle2,
  Download,
  FolderOpen,
  Headphones,
  HelpCircle,
  MessageCircle,
  Monitor,
  Music2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { PlansSection } from "../components/PlansSection";
import { SectionHeading } from "../components/SectionHeading";
import { formatDueDate } from "../lib/due-queue";
import { userHasActiveVipAccess } from "../lib/mercadopago/webhook-policy";
import { SITE_DRIVE_PLANS } from "../lib/plans";
import { getAuthenticatedPortalUser } from "../lib/portal";
import { hasUsedDriveTestPlan } from "../lib/portal-renewals";
import { SITE_NAME } from "../lib/branding";
import { whatsappUrl } from "../lib/site";
import { JsonLd } from "../components/JsonLd";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  plansProductJsonLd,
} from "../lib/seo";

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
    title: "Liberação automática",
    text: "Assim que o pagamento for confirmado, o plano é liberado na sua conta sem espera manual.",
  },
];

const includedDetails = [
  { title: "+315 GB de acervo", text: "Volume atual do Drive VIP, em constante crescimento." },
  { title: "+40.012 faixas", text: "Edits, extended, clean/dirty e materiais para a pista." },
  { title: "~739 pastas", text: "Organização por mês, semana, estilo e coleções." },
  { title: "Login único", text: "Mesma conta no site, na plataforma /musicas e no Downloader." },
];

const advantages = [
  "Pagamento único por período — renovação manual quando o acesso vencer",
  "Com VIP ativo, upgrade/downgrade entre mensal, trimestral e semestral no portal",
  "Crédito do período restante aplicado na troca de plano",
  "Plano Teste de 3 dias (R$ 3,50) só uma vez por conta",
  "Acesso a /musicas, packs organizados e BRS Downloader para Windows",
  `${SITE_NAME} libera o acesso após a confirmação oficial do pagamento`,
];

const howItWorks = [
  {
    step: "01",
    title: "Escolha o plano",
    text: "Use o Plano Teste (R$ 3,50 / 3 dias, uma vez) ou escolha mensal, trimestral ou semestral.",
  },
  {
    step: "02",
    title: "Pague com segurança",
    text: "No Pix, após pagar clique em “Voltar para Brazilian Dj Pools” no rodapé. Cartão pode redirecionar sozinho.",
  },
  {
    step: "03",
    title: "Acesso liberado",
    text: "Com a confirmação do pagamento, plataforma, packs e Downloader liberam automaticamente.",
  },
];

const faqs = [
  {
    q: "Posso trocar de plano com VIP ainda ativo?",
    a: "Sim. No portal (/portal/conta) você escolhe mensal, trimestral ou semestral. O crédito do período restante é aplicado e o novo vencimento é atualizado após o pagamento. O Plano Teste não pode ser reativado.",
  },
  {
    q: "Paguei no Pix e a tela do QR não muda. E agora?",
    a: "É normal. Role até o rodapé e clique em “Voltar para Brazilian Dj Pools”. O acesso libera após a confirmação do pagamento; o botão só te devolve ao site.",
  },
  {
    q: "O Plano Teste é cobrança real?",
    a: "Sim. É R$ 3,50 com acesso VIP completo por 3 dias — uma única vez por conta. Depois, escolha 1, 3 ou 6 meses.",
  },
  {
    q: "O redirect de sucesso já libera o VIP?",
    a: "Não. Só a confirmação oficial do pagamento no servidor libera o acesso. A página de retorno apenas consulta o status interno.",
  },
  {
    q: "Quais são os valores?",
    a: "Teste R$ 3,50 (3 dias), mensal R$ 35,50, trimestral R$ 100 e semestral R$ 200.",
  },
  {
    q: "O Allavsoft está incluso?",
    a: "Não. Allavsoft é produto separado (licença vitalícia R$ 50) para baixar de Deezer, Spotify, YouTube e outros sites.",
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
  const testPlanUsed = user ? await hasUsedDriveTestPlan(user.id) : false;

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={plansProductJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Planos VIP", path: "/plans" },
        ])}
      />

      <Suspense fallback={<div className="min-h-[320px]" />}>
        <PlansSection
          id="planos"
          className="!border-t-0 pt-14 md:pt-16"
          plans={drivePlans}
          badge="Drive VIP"
          title="Planos BRS Drive"
          subtitle="Acervo VIP, plataforma /musicas e Downloader. Inclui plano teste de 3 dias para validar produção."
          activeVip={activeVip}
          testPlanUsed={testPlanUsed}
          showPixNotice
        />
      </Suspense>

      <section className="border-b border-white/5 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#FFDF00]/25 bg-[#FFDF00]/5 px-5 py-6 text-center md:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FFDF00]">Allavsoft</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-white md:text-2xl">
            Deezer, Spotify, YouTube e +1000 sites
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Licença vitalícia por R$ 50,00 — baixe músicas e vídeos com o Allavsoft, produto separado do Drive VIP.
          </p>
          <a
            href="/allavsoft"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-[#FFDF00] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#002776] transition hover:bg-[#FFE566]"
          >
            Conhecer Allavsoft
          </a>
        </div>
      </section>

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
            badge="Vantagens"
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
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {advantages.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#009739]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            <Sparkles className="h-3.5 w-3.5 text-[#FFDF00]" />
            Teste R$ 3,50 · 1m R$ 35,50 · 3m R$ 100 · 6m R$ 200
          </p>
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
