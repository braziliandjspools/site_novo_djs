"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Info, Loader2, ShieldCheck } from "lucide-react";
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
  serviceProduct?: "poolsVip" | "deemix" | "allavsoft";
};

type ActiveServiceInfo = {
  expiresLabel: string;
};

type PlansSectionProps = {
  id?: string;
  className?: string;
  plans: PlanCard[];
  badge?: string;
  title?: string;
  subtitle?: string;
  /** Bloqueia checkout de planos VIP. */
  activeVip?: ActiveServiceInfo | null;
  /** Bloqueia checkout de planos Deemix. */
  activeDeemix?: ActiveServiceInfo | null;
  /** Bloqueia checkout Allavsoft (licença vitalícia já ativa). */
  activeAllavsoft?: boolean;
  showPixNotice?: boolean;
  loginReturnPath?: string;
};

type PreferenceResponse = {
  checkoutUrl?: string;
  orderId?: string;
  loginUrl?: string;
  error?: string;
  code?: string;
  expiresLabel?: string;
};

function planProduct(plan: PlanCard): "poolsVip" | "deemix" | "allavsoft" {
  if (plan.serviceProduct === "deemix") return "deemix";
  if (plan.serviceProduct === "allavsoft") return "allavsoft";
  return "poolsVip";
}

export function PlansSection({
  id = "planos",
  className = "",
  plans,
  badge = "Assinatura",
  title = "Escolha seu plano",
  subtitle = "Pagamento único via Mercado Pago, com renovação manual. O navegador envia só o planId — preço e duração vêm do servidor.",
  activeVip = null,
  activeDeemix = null,
  activeAllavsoft = false,
  showPixNotice = true,
  loginReturnPath = "/plans",
}: PlansSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorPlanId, setErrorPlanId] = useState<string | null>(null);
  const checkoutInFlight = useRef(false);
  const autoStarted = useRef(false);

  function isPlanBlocked(plan: PlanCard) {
    const product = planProduct(plan);
    if (product === "deemix") return Boolean(activeDeemix);
    if (product === "allavsoft") return activeAllavsoft;
    return Boolean(activeVip);
  }

  function blockedLabel(plan: PlanCard) {
    const product = planProduct(plan);
    if (product === "deemix") {
      return `Deemix ativo até ${activeDeemix!.expiresLabel}`;
    }
    if (product === "allavsoft") {
      return "Licença Allavsoft já ativa";
    }
    return `VIP ativo até ${activeVip!.expiresLabel}`;
  }

  async function startCheckout(planId: string) {
    const plan = plans.find((item) => item.id === planId);
    if (plan && isPlanBlocked(plan)) {
      const product = planProduct(plan);
      setError(
        product === "deemix"
          ? `Você já tem Deemix ativo até ${activeDeemix!.expiresLabel}. Aguarde o vencimento para assinar um novo plano.`
          : product === "allavsoft"
            ? "Você já tem a licença vitalícia do Allavsoft nesta conta."
            : `Você já tem VIP ativo até ${activeVip!.expiresLabel}. Aguarde o vencimento para assinar um novo plano.`,
      );
      setErrorPlanId(null);
      return;
    }
    if (checkoutInFlight.current) return;
    checkoutInFlight.current = true;
    setLoadingPlanId(planId);
    setError(null);
    setErrorPlanId(null);

    try {
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
          `/musicas/entrar?return=${encodeURIComponent(loginReturnPath)}&checkout=${encodeURIComponent(planId)}`;
        router.push(loginUrl);
        checkoutInFlight.current = false;
        setLoadingPlanId(null);
        return;
      }

      if (
        res.status === 409 ||
        data.code === "vip_already_active" ||
        data.code === "deemix_already_active"
      ) {
        setError(
          data.error ??
            `Você já tem acesso ativo${data.expiresLabel ? ` até ${data.expiresLabel}` : ""}. Aguarde o vencimento para assinar um novo plano.`,
        );
        setErrorPlanId(null);
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
    const plan = plans.find((item) => item.id === resolvedId);
    if (plan && isPlanBlocked(plan)) return;
    autoStarted.current = true;
    const timer = window.setTimeout(() => {
      void startCheckout(resolvedId);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-start once after login redirect
  }, [plans, searchParams, activeVip, activeDeemix, activeAllavsoft]);

  const isBusy = loadingPlanId !== null;
  const gridClass =
    plans.length <= 3
      ? "mx-auto mt-10 grid gap-4 sm:mt-12 md:grid-cols-3"
      : "mx-auto mt-10 grid gap-4 sm:mt-12 md:grid-cols-2 xl:grid-cols-4";

  return (
    <section id={id} className={`border-y border-white/5 site-section-rainbow px-4 py-12 sm:px-6 md:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading badge={badge} title={title} subtitle={subtitle} />

        {activeVip && plans.some((plan) => planProduct(plan) === "poolsVip") ? (
          <div
            className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#1ed760]/35 bg-[#1ed760]/10 px-4 py-4 text-center sm:px-6"
            role="status"
          >
            <p className="text-sm font-semibold text-[#1ed760]">
              Seu VIP já está ativo até {activeVip.expiresLabel}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
              Não é possível comprar outro plano VIP enquanto o acesso atual estiver válido.{" "}
              <Link href="/portal" className="font-semibold text-white underline-offset-2 hover:underline">
                Ir ao portal
              </Link>
            </p>
          </div>
        ) : null}

        {activeDeemix && plans.some((plan) => planProduct(plan) === "deemix") ? (
          <div
            className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#6B9FFF]/35 bg-[#002776]/25 px-4 py-4 text-center sm:px-6"
            role="status"
          >
            <p className="text-sm font-semibold text-[#6B9FFF]">
              Seu Deemix já está ativo até {activeDeemix.expiresLabel}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
              Não é possível comprar outro plano Deemix enquanto o acesso atual estiver válido.{" "}
              <Link href="/portal" className="font-semibold text-white underline-offset-2 hover:underline">
                Ir ao portal
              </Link>
            </p>
          </div>
        ) : null}

        {showPixNotice ? (
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-[#FFDF00]/25 bg-[#FFDF00]/8 px-4 py-4 sm:px-5">
            <div className="flex gap-3 text-left">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#FFDF00]" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-[#FFDF00]">Após pagar com Pix</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                  A tela do QR do Mercado Pago <strong className="font-semibold text-white">não atualiza sozinha</strong>.
                  Depois de pagar, role até o rodapé e clique em{" "}
                  <strong className="font-semibold text-white">“Voltar para Brazilian Dj Pools”</strong> para
                  retornar ao site.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className={gridClass}>
          {plans.map((plan) => {
            const isThisLoading = loadingPlanId === plan.id;
            const blocked = isPlanBlocked(plan);
            const isDeemix = planProduct(plan) === "deemix";
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col site-panel p-6 text-center transition-all md:p-7 md:text-left ${
                  blocked
                    ? "opacity-70"
                    : isDeemix
                      ? "border-[#6B9FFF]/35 bg-gradient-to-b from-[#002776]/25 to-transparent"
                      : plan.isTestPlan
                        ? "border-[#6B9FFF]/35 bg-gradient-to-b from-[#002776]/25 to-transparent"
                        : plan.highlight
                          ? "border-[#FFDF00]/40 from-[#009739]/15 bg-gradient-to-b to-transparent shadow-2xl shadow-[#009739]/15"
                          : "hover:border-[#009739]/35"
                }`}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide ${
                      isDeemix || plan.isTestPlan
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
                  disabled={isBusy || blocked}
                  aria-busy={isThisLoading}
                  className="mt-8 flex w-full min-h-12 cursor-pointer items-center justify-center gap-2 site-btn site-btn-primary rounded-xl px-4 text-sm sm:text-[0.95rem] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {blocked ? (
                    blockedLabel(plan)
                  ) : isThisLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                      Preparando pagamento...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                      {plan.isTestPlan
                        ? "Testar com Mercado Pago"
                        : isDeemix
                          ? "Assinar Deemix"
                          : "Pagar com Mercado Pago"}
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
                  {blocked
                    ? planProduct(plan) === "allavsoft"
                      ? "Licença vitalícia já liberada nesta conta."
                      : `Renovação disponível após ${
                          isDeemix ? activeDeemix!.expiresLabel : activeVip!.expiresLabel
                        }.`
                    : isDeemix
                      ? "ARL 320 kbps · liberação automática no portal."
                      : planProduct(plan) === "allavsoft"
                        ? "Licença vitalícia · serial no portal após o webhook."
                        : plan.isTestPlan
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
