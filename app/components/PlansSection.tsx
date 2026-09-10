"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { friendlyCheckoutError, resolveCheckoutPlanId } from "../lib/checkout-ui";
import { SectionHeading } from "./SectionHeading";

type PlanCard = {
  id: string;
  name: string;
  price: string;
  period: string;
  equivalent: string | null;
  badge: string | null;
  features: string[];
  highlight: boolean;
  description?: string;
  isTestPlan?: boolean;
};

type PlansSectionProps = {
  id?: string;
  className?: string;
  plans: PlanCard[];
};

type PreferenceResponse = {
  checkoutUrl?: string;
  orderId?: string;
  loginUrl?: string;
  error?: string;
};

export function PlansSection({ id = "planos", className = "", plans }: PlansSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorPlanId, setErrorPlanId] = useState<string | null>(null);
  const checkoutInFlight = useRef(false);
  const autoStarted = useRef(false);

  async function startCheckout(planId: string) {
    if (checkoutInFlight.current) return;
    checkoutInFlight.current = true;
    setLoadingPlanId(planId);
    setError(null);
    setErrorPlanId(null);

    try {
      // Frontend envia somente planId — preço/aprovação ficam no servidor.
      const res = await fetch("/api/payments/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ planId }),
      });

      let data: PreferenceResponse = {};
      try {
        data = (await res.json()) as PreferenceResponse;
      } catch {
        data = {};
      }

      if (res.status === 401) {
        const loginUrl =
          data.loginUrl ??
          `/musicas/entrar?return=${encodeURIComponent("/plans")}&checkout=${encodeURIComponent(planId)}`;
        router.push(loginUrl);
        checkoutInFlight.current = false;
        setLoadingPlanId(null);
        return;
      }

      if (!res.ok || !data.checkoutUrl) {
        setError(friendlyCheckoutError(res.status, data.error));
        setErrorPlanId(planId);
        checkoutInFlight.current = false;
        setLoadingPlanId(null);
        return;
      }

      if (data.orderId) {
        try {
          sessionStorage.setItem("brs_mp_order_id", data.orderId);
        } catch {
          /* ignore */
        }
      }

      // Mantém "Preparando pagamento..." até o navegador sair da página.
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("Erro de conexão ao preparar o pagamento. Verifique a internet e tente novamente.");
      setErrorPlanId(planId);
      checkoutInFlight.current = false;
      setLoadingPlanId(null);
    }
  }

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout || autoStarted.current) return;
    const resolvedId = resolveCheckoutPlanId(checkout, plans);
    if (!resolvedId) return;
    autoStarted.current = true;
    // Adia o checkout pós-login para não disparar setState síncrono no effect.
    const timer = window.setTimeout(() => {
      void startCheckout(resolvedId);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-start once after login redirect
  }, [plans, searchParams]);

  const isBusy = loadingPlanId !== null;

  return (
    <section id={id} className={`border-y border-white/5 site-section-rainbow px-4 py-12 sm:px-6 md:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          badge="Assinatura"
          title="Escolha seu plano"
          subtitle="Pagamento único via Mercado Pago, com renovação manual. Há um plano de teste de 3 dias (R$ 1,00) para validar produção. O navegador envia só o planId — preço e duração vêm do servidor."
        />
        <div className="mx-auto mt-10 grid gap-4 sm:mt-12 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isThisLoading = loadingPlanId === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col site-panel p-6 text-center transition-all md:p-7 md:text-left ${
                  plan.isTestPlan
                    ? "border-[#6B9FFF]/35 bg-gradient-to-b from-[#002776]/25 to-transparent"
                    : plan.highlight
                      ? "border-[#FFDF00]/40 from-[#009739]/15 bg-gradient-to-b to-transparent shadow-2xl shadow-[#009739]/15"
                      : "hover:border-[#009739]/35"
                }`}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide ${
                      plan.isTestPlan
                        ? "bg-[#6B9FFF] text-[#002776]"
                        : "bg-[#FFDF00] text-[#002776]"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-display text-lg text-white">{plan.name}</h3>
                {plan.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{plan.description}</p>
                ) : null}
                <p className="mt-4 font-display text-4xl font-bold tracking-[-0.03em] text-white">{plan.price}</p>
                {plan.equivalent ? (
                  <p className="mt-1 text-sm font-medium text-[#1ed760]">{plan.equivalent}</p>
                ) : null}
                <p className="mt-1 text-xs tracking-[-0.01em] text-gray-500">{plan.period}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start justify-center gap-2 text-sm text-gray-300 md:justify-start"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#009739]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => void startCheckout(plan.id)}
                  disabled={isBusy}
                  aria-busy={isThisLoading}
                  className="mt-8 flex w-full min-h-12 cursor-pointer items-center justify-center gap-2 site-btn site-btn-primary rounded-xl px-4 text-sm sm:text-[0.95rem] disabled:cursor-wait disabled:opacity-80"
                >
                  {isThisLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                      Preparando pagamento...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                      {plan.isTestPlan ? "Testar com Mercado Pago" : "Pagar com Mercado Pago"}
                    </>
                  )}
                </button>
                {error && errorPlanId === plan.id ? (
                  <p className="mt-3 text-sm text-red-400" role="alert">
                    {error}
                  </p>
                ) : null}
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500 md:justify-start">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#009739]" />
                  {plan.isTestPlan
                    ? "Cobrança real de R$ 1,00 em produção · acesso por 3 dias."
                    : "Checkout seguro. Acesso só após confirmação oficial."}
                </p>
              </div>
            );
          })}
        </div>
        {error && !errorPlanId ? (
          <p className="mx-auto mt-4 max-w-xl text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
