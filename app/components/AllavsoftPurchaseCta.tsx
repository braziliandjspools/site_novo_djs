"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Infinity, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { friendlyCheckoutError, resolveCheckoutPlanId } from "../lib/checkout-ui";

type AllavsoftPlanCard = {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  description?: string;
};

type PreferenceResponse = {
  checkoutUrl?: string;
  orderId?: string;
  loginUrl?: string;
  error?: string;
  code?: string;
};

type AllavsoftPurchaseCtaProps = {
  plans: AllavsoftPlanCard[];
  alreadyOwned?: boolean;
};

function AllavsoftCheckoutInner({ plans, alreadyOwned = false }: AllavsoftPurchaseCtaProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = plans[0] ?? null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const autoStarted = useRef(false);

  async function startCheckout(planId: string) {
    if (alreadyOwned) {
      setError("Você já tem a licença vitalícia do Allavsoft nesta conta.");
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);

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
          `/musicas/entrar?return=${encodeURIComponent("/allavsoft")}&checkout=${encodeURIComponent(planId)}`;
        router.push(loginUrl);
        inFlight.current = false;
        setLoading(false);
        return;
      }

      if (res.status === 409 || data.code === "allavsoft_already_active") {
        setError(data.error ?? "Você já tem a licença vitalícia do Allavsoft nesta conta.");
        inFlight.current = false;
        setLoading(false);
        return;
      }

      if (!res.ok || !data.checkoutUrl) {
        setError(friendlyCheckoutError(res.status, data.error));
        inFlight.current = false;
        setLoading(false);
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
      inFlight.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout || autoStarted.current || alreadyOwned || !plan) return;
    const resolvedId = resolveCheckoutPlanId(checkout, plans);
    if (!resolvedId) return;
    autoStarted.current = true;
    const timer = window.setTimeout(() => {
      void startCheckout(resolvedId);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-start once after login redirect
  }, [plans, searchParams, alreadyOwned, plan]);

  if (!plan) return null;

  <section
      id="allavsoft-plano"
      className="w-full min-w-0 overflow-hidden rounded-2xl border border-[#FFDF00]/25 bg-gradient-to-br from-[#FFDF00]/10 via-[#002776]/20 to-black/40"
    >
      <div className="border-b border-white/10 px-4 py-5 sm:px-8 sm:py-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFDF00]">Mercado Pago</p>
        <h2 className="mt-2 break-words font-display text-2xl text-white sm:text-3xl">Licença vitalícia</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Pagamento único de {plan.price}. Após a confirmação, o webhook libera o acesso na sua conta. O serial será
          gerenciado na área do cliente.
        </p>
      </div>

      <div className="grid min-w-0 gap-6 p-4 sm:grid-cols-[1.1fr_0.9fr] sm:p-8">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-white">{plan.name}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{plan.period}</p>
          <ul className="mt-5 space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1ed760]" />
                <span className="min-w-0 break-words">{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-500 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
              <Infinity className="h-3.5 w-3.5 flex-shrink-0 text-[#FFDF00]" />
              Sem renovação
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
              <KeyRound className="h-3.5 w-3.5 flex-shrink-0 text-[#FFDF00]" />
              Serial no portal
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-[#FFDF00]" />
              Liberação via webhook
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center rounded-xl border border-white/10 bg-black/40 p-4 text-center sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Valor único</p>
          <p className="mt-2 break-words font-display text-4xl text-[#FFDF00] sm:text-5xl">{plan.price}</p>
          <p className="mt-1 text-sm text-zinc-400">pagamento único · vitalícia</p>

          {alreadyOwned ? (
            <p className="mt-6 rounded-xl border border-[#1ed760]/35 bg-[#1ed760]/10 px-4 py-3 text-sm font-semibold text-[#1ed760]">
              Licença já ativa nesta conta. Consulte o portal do cliente.
            </p>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => void startCheckout(plan.id)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FFDF00] px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-[#002776] shadow-lg shadow-[#FFDF00]/20 transition hover:scale-[1.02] hover:bg-[#FFE566] disabled:cursor-wait disabled:opacity-70 sm:px-6"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Abrindo Mercado Pago…" : "Pagar com Mercado Pago"}
            </button>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-sm text-red-300">
              {error}
            </p>
          )}

          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            É necessário estar logado. PIX e cartão pelo Checkout Pro do Mercado Pago. A liberação ocorre após o
            webhook de pagamento aprovado.
          </p>
        </div>
      </div>
    </section>
  );
}

export function AllavsoftPurchaseCta(props: AllavsoftPurchaseCtaProps) {
  return (
    <Suspense fallback={<div className="min-h-[280px] rounded-2xl border border-white/10 bg-white/[0.03]" />}>
      <AllavsoftCheckoutInner {...props} />
    </Suspense>
  );
}
