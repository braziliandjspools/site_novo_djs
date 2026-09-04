import { CheckCircle2 } from "lucide-react";
import { checkoutUrl } from "../lib/site";
import { SITE_PLANS } from "../lib/plans";
import { SectionHeading } from "./SectionHeading";

type PlansSectionProps = {
  id?: string;
  className?: string;
};

export function PlansSection({ id = "planos", className = "" }: PlansSectionProps) {
  return (
    <section id={id} className={`border-y border-white/5 site-section-rainbow px-4 py-12 sm:px-6 md:py-20 ${className}`}>
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          badge="Acesso"
          title="Escolha seu acesso"
          subtitle="Escolha o plano que melhor combina com a sua rotina e tenha acesso ao acervo Brazilian Remix Service, ferramentas inclusas e atualizações frequentes. Compare as opções e encontre a melhor forma de manter seu repertório sempre completo e organizado."
        />
        <div className="mx-auto mt-10 grid max-w-md gap-4 sm:mt-12 sm:max-w-none sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          {SITE_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 text-center transition-all md:p-8 md:text-left ${
                plan.highlight
                  ? "border-[#FFDF00]/60 bg-gradient-to-b from-[#009739]/20 to-transparent shadow-2xl shadow-[#009739]/20"
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
                  plan.highlight
                    ? "bg-[#009739] text-white hover:bg-[#00B347]"
                    : "border border-[#009739]/60 text-[#00B347] hover:bg-[#009739]/10"
                }`}
              >
                Comprar
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
