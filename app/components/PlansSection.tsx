"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Info, Loader2, ShieldCheck } from "lucide-react";
import { friendlyCheckoutError, resolveCheckoutPlanId } from "../lib/checkout-ui";
import { SectionHeading } from "./SectionHeading";
import { useSiteToast } from "./SiteToast";

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
  activeVip?: ActiveServiceInfo | null;
  activeDeemix?: ActiveServiceInfo | null;
  activeAllavsoft?: boolean;
  testPlanUsed?: boolean;
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
  subtitle = "Pagamento único por período, com renovação manual no portal. Preço e duração vêm sempre do servidor.",
  activeVip = null,
  activeDeemix = null,
  activeAllavsoft = false,
  testPlanUsed = false,
  showPixNotice = true,
  loginReturnPath = "/plans",
}: PlansSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useSiteToast();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorPlanId, setErrorPlanId] = useState<string | null>(null);
  const checkoutInFlight = useRef(false);
  const autoStarted = useRef(false);
  const vipToastShown = useRef(false);

  function isPlanBlocked(plan: PlanCard) {
    const product = planProduct(plan);
    if (product === "deemix") return Boolean(activeDeemix);
    if (product === "allavsoft") return activeAllavsoft;
    if (plan.isTestPlan && testPlanUsed) return true;
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
    if (plan.isTestPlan && testPlanUsed) {
      return "Teste já usado nesta conta";
    }
    return `VIP ativo até ${activeVip!.expiresLabel}`;
  }

  function notifyBlocked(plan: PlanCard) {
    const product = planProduct(plan);
    if (product === "deemix") {
      showToast(`Você já tem Deemix ativo até ${activeDeemix!.expiresLabel}.`, "info", 5500);
      return;
    }
    if (product === "allavsoft") {
      showToast("Você já tem a licença vitalícia do Allavsoft nesta conta.", "info", 5500);
      return;
    }
    if (plan.isTestPlan && testPlanUsed) {
      showToast(
        "O Plano Teste só pode ser usado uma vez. Escolha mensal, trimestral ou semestral.",
        "info",
        5500,
      );
      return;
    }
    if (plan.isTestPlan && activeVip) {
      showToast(
        `Você já tem VIP ativo até ${activeVip.expiresLabel}. O Plano Teste não está disponível.`,
        "info",
        5500,
      );
      return;
    }
    showToast(
      `Você já tem VIP ativo até ${activeVip!.expiresLabel}. Para trocar de plano, use /portal/conta.`,
      "info",
      5500,
    );
  }

  useEffect(() => {
    if (!activeVip || vipToastShown.current) return;
    if (!plans.some((plan) => planProduct(plan) === "poolsVip")) return;
    vipToastShown.current = true;
    showToast(
      `Você já tem VIP ativo até ${activeVip.expiresLabel}. O Plano Teste não está disponível.`,
      "info",
      6000,
    );
  }, [activeVip, plans, showToast]);

  async function startCheckout(planId: string) {
    const plan = plans.find((item) => item.id === planId);
    if (plan && isPlanBlocked(plan)) {
      notifyBlocked(plan);
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
        data.code === "deemix_already_active" ||
        data.code === "test_plan_already_used"
      ) {
        const message =
          data.error ??
          (data.code === "test_plan_already_used"
            ? "O Plano Teste só pode ser usado uma vez. Escolha mensal, trimestral ou semestral."
            : `Você já tem acesso ativo${data.expiresLabel ? ` até ${data.expiresLabel}` : ""}.`);
        showToast(message, "info", 6000);
        checkoutInFlight.current = false;
        setLoadingPlanId(null);
        return;
      }

      if (!res.ok || !data.checkoutUrl) {
        const message = friendlyCheckoutError(res.status, data.error);
        setError(message);
        setErrorPlanId(planId);
        showToast(message, "error");
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
      const message = "Erro de conexão ao preparar o pagamento. Verifique a internet e tente novamente.";
      setError(message);
      setErrorPlanId(planId);
      showToast(message, "error");
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
    if (plan && isPlanBlocked(plan)) {
      notifyBlocked(plan);
      return;
    }
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
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-zinc-400">
            VIP ativo até {activeVip.expiresLabel}.{" "}
            <Link href="/portal/conta" className="font-semibold text-[#1ed760] underline-offset-2 hover:underline">
              Trocar plano no portal
            </Link>
          </p>
        ) : null}

        {showPixNotice ? (
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-[#FFDF00]/25 bg-[#FFDF00]/8 px-4 py-4 sm:px-5">
            <div className="flex gap-3 text-left">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#FFDF00]" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-[#FFDF00]">Após pagar com Pix</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                  A tela do QR <strong className="font-semibold text-white">não atualiza sozinha</strong>. Depois de
                  pagar, role até o rodapé e clique em{" "}
                  <strong className="font-semibold text-white">“Voltar para Brazilian Dj Pools”</strong> para retornar
                  ao site.
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
            const nameSep = " — ";
            const nameSepAt = plan.name.indexOf(nameSep);
            const planBrand = nameSepAt >= 0 ? plan.name.slice(0, nameSepAt) : null;
            const planLabel = nameSepAt >= 0 ? plan.name.slice(nameSepAt + nameSep.length) : plan.name;
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
                <div className="min-w-0">
                  {planBrand ? (
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                      {planBrand}
                    </p>
                  ) : null}
                  <h3 className="mt-1 font-display text-base font-semibold tracking-tight text-white whitespace-nowrap md:text-lg">
                    {planLabel}
                  </h3>
                </div>
                {plan.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{plan.description}</p>
                ) : null}
                <p className="mt-5 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                  {plan.price}
                </p>
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
                  className="mt-8 flex w-full min-h-12 cursor-pointer items-center justify-center gap-2 site-btn site-btn-primary rounded-xl px-4 text-sm sm:text-[0.95rem] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isThisLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                      Preparando pagamento...
                    </>
                  ) : blocked ? (
                    blockedLabel(plan)
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                      {plan.isTestPlan
                        ? "Ativar plano teste"
                        : isDeemix
                          ? "Assinar Deemix"
                          : "Assinar agora"}
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
                      : plan.isTestPlan && testPlanUsed
                        ? "Só uma ativação por conta — escolha 1, 3 ou 6 meses."
                        : isDeemix
                          ? `Renovação disponível após ${activeDeemix!.expiresLabel}.`
                          : "Troque de plano em /portal/conta (1, 3 ou 6 meses)."
                    : isDeemix
                      ? "ARL 320 kbps · liberação automática no portal."
                      : planProduct(plan) === "allavsoft"
                        ? "Licença vitalícia · serial no portal após a confirmação."
                        : plan.isTestPlan
                          ? "Cobrança real de R$ 3,50 · 3 dias · uma vez por conta."
                          : "Checkout seguro. Acesso só após confirmação oficial."}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
