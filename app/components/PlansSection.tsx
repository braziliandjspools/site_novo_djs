"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

type HotmartPlanCard = {
  id: string;
  name: string;
  price: string;
  period: string;
  badge: string | null;
  features: string[];
  highlight: boolean;
};

type PlansSectionProps = {
  id?: string;
  className?: string;
  plans: HotmartPlanCard[];
};

export function PlansSection({ id = "planos", className = "", plans }: PlansSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout) return;
    if (!plans.some((plan) => plan.id === checkout)) return;
    void startCheckout(checkout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-start once after login redirect
  }, [plans, searchParams]);

  async function startCheckout(planId: string) {
    setLoadingPlanId(planId);
    setError(null);
    try {
      const res = await fetch(`/api/checkout/hotmart/${planId}?format=json`, {
        cache: "no-store",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        checkoutUrl?: string;
        loginUrl?: string;
        error?: string;
      };

      if (res.status === 401 && data.loginUrl) {
        router.push(data.loginUrl);
        return;
      }

      if (!res.ok || !data.checkoutUrl) {
        setError(
          data.error ??
            (res.status === 503
              ? "Checkout Hotmart ainda não configurado. Peça ao administrador para definir HOTMART_DRIVE_MONTHLY_CHECKOUT_URL na Vercel."
              : "Não foi possível abrir o checkout. Tente novamente."),
        );
        return;
      }

      // URL externa Hotmart (checkout oficial)
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Erro de conexão ao abrir o checkout. Tente novamente.");
    } finally {
      setLoadingPlanId(null);
    }
  }

  return (
    <section id={id} className={`border-y border-white/5 site-section-rainbow px-4 py-12 sm:px-6 md:py-20 ${className}`}>
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          badge="Assinatura"
          title="BRS Drive Mensal"
          subtitle="Assine com checkout seguro da Hotmart e libere a plataforma, packs organizados e o Downloader para Windows. O acesso é liberado automaticamente após a confirmação do pagamento."
        />
        <div className="mx-auto mt-10 grid max-w-md gap-4 sm:mt-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 text-center transition-all md:p-8 md:text-left ${
                plan.highlight
                  ? "border-[#FFDF00]/60 bg-gradient-to-b from-[#009739]/20 to-transparent shadow-2xl shadow-[#009739]/20"
                  : "border-white/10 bg-[#282828] hover:border-[#009739]/40"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FFDF00] px-4 py-1 text-xs font-bold uppercase tracking-wide text-[#002776]">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-display text-lg text-white">{plan.name}</h3>
              <p className="mt-4 font-display text-4xl font-bold text-white">{plan.price}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{plan.period}</p>
              <ul className="mt-6 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start justify-center gap-2 text-sm text-gray-300 md:justify-start">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#009739]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => void startCheckout(plan.id)}
                disabled={loadingPlanId === plan.id}
                className="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#009739] py-3 text-center text-sm font-bold uppercase tracking-wide text-white transition-all hover:scale-105 hover:bg-[#00B347] disabled:cursor-wait disabled:opacity-80"
              >
                {loadingPlanId === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Abrindo checkout…
                  </>
                ) : (
                  "Assinar agora"
                )}
              </button>
              {error && (
                <p className="mt-3 text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500 md:justify-start">
                <ShieldCheck className="h-3.5 w-3.5 text-[#009739]" />
                Pagamento processado com segurança pela Hotmart.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
