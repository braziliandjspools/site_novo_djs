import type { Metadata } from "next";
import { Suspense } from "react";
import { MessageCircle } from "lucide-react";
import { PlansSection } from "../components/PlansSection";
import { SectionHeading } from "../components/SectionHeading";
import { SITE_PLANS } from "../lib/plans";
import { whatsappUrl } from "../lib/site";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("plans");

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
      <section className="border-b border-white/5 px-4 pb-8 pt-12 sm:px-6 md:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            badge="Planos"
            title="Acesso VIP ao acervo"
            subtitle="Assine o BRS Drive Mensal pela Hotmart e libere pools, atualizações, plataforma de músicas e o Downloader para Windows."
          />
        </div>
      </section>

      <Suspense fallback={<div className="min-h-[320px]" />}>
        <PlansSection className="!border-t-0" plans={plans} />
      </Suspense>

      <section className="px-4 py-12 text-center sm:px-6 md:py-16">
        <div className="mx-auto max-w-2xl">
          <SectionHeading
            title="Ainda tem dúvidas?"
            subtitle="Fale com a gente pelo WhatsApp sobre planos, formas de acesso e renovação."
          />
          <a
            href={whatsappUrl("Olá! Vim pela página de planos e quero saber mais.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#009739] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#009739]/30 transition-all hover:scale-105 hover:bg-[#00B347]"
          >
            <MessageCircle size={18} /> Falar no WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
