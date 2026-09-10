"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
  User,
} from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import {
  extractTrustedReturnLookup,
  PAYMENT_STATUS_MAX_POLLS,
  PAYMENT_STATUS_POLL_INTERVAL_MS,
  type PublicOrderPhase,
} from "../lib/mercadopago/return-policy";

type SafeStatusResponse = {
  phase?: PublicOrderPhase;
  planLabel?: string | null;
  accessActive?: boolean;
  canPoll?: boolean;
  error?: string;
};

type PaymentReturnVariant = "sucesso" | "pendente" | "erro";

type PaymentReturnClientProps = {
  variant: PaymentReturnVariant;
};

function readStoredOrderId(): string | null {
  try {
    return sessionStorage.getItem("brs_mp_order_id");
  } catch {
    return null;
  }
}

function clearStoredOrderId() {
  try {
    sessionStorage.removeItem("brs_mp_order_id");
  } catch {
    /* ignore */
  }
}

function buildStatusQuery(lookup: { orderId: string | null; externalReference: string | null }) {
  const params = new URLSearchParams();
  if (lookup.orderId) params.set("orderId", lookup.orderId);
  if (lookup.externalReference) params.set("external_reference", lookup.externalReference);
  return params.toString();
}

function copyForPhase(
  variant: PaymentReturnVariant,
  phase: PublicOrderPhase | "loading",
  planLabel: string | null,
) {
  const planHint = planLabel ? ` (${planLabel})` : "";

  if (phase === "loading" || phase === "confirming") {
    return {
      icon: "loading" as const,
      title: "Confirmando pagamento",
      subtitle:
        "Estamos aguardando a confirmação oficial do Mercado Pago. Isso não libera o plano pela URL — só pelo webhook validado no servidor.",
    };
  }

  if (phase === "approved") {
    return {
      icon: "success" as const,
      title: "Pagamento confirmado",
      subtitle: `Seu acesso VIP${planHint} foi liberado. Você já pode usar a plataforma e o Downloader.`,
    };
  }

  if (phase === "pending") {
    return {
      icon: "pending" as const,
      title: "Pagamento pendente",
      subtitle:
        "O pagamento ainda está em análise. Assim que o Mercado Pago confirmar, o acesso será liberado automaticamente.",
    };
  }

  if (phase === "rejected" || phase === "cancelled") {
    return {
      icon: "error" as const,
      title: phase === "cancelled" ? "Pagamento cancelado" : "Pagamento recusado",
      subtitle:
        "Não foi possível concluir a compra. Você pode tentar novamente na página de planos — nenhum acesso foi liberado.",
    };
  }

  if (phase === "refunded") {
    return {
      icon: "error" as const,
      title: "Pagamento estornado",
      subtitle: "Este pedido foi reembolsado ou sofreu chargeback. O histórico foi mantido; o acesso VIP não permanece ativo.",
    };
  }

  // not_found — fallback por variante da rota de retorno
  if (variant === "sucesso") {
    return {
      icon: "pending" as const,
      title: "Confirmando pagamento",
      subtitle:
        "Recebemos o retorno do checkout. Se o pagamento foi aprovado, o acesso entra em breve após a confirmação no servidor.",
    };
  }
  if (variant === "pendente") {
    return {
      icon: "pending" as const,
      title: "Pagamento em processamento",
      subtitle:
        "Assim que o Mercado Pago confirmar, seu acesso será atualizado automaticamente. Isso pode levar alguns minutos.",
    };
  }
  return {
    icon: "error" as const,
    title: "Pagamento não concluído",
    subtitle:
      "O checkout foi cancelado ou o pagamento não foi aprovado. Você pode tentar novamente a qualquer momento.",
  };
}

export function PaymentReturnClient({ variant }: PaymentReturnClientProps) {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<PublicOrderPhase | "loading">("loading");
  const [planLabel, setPlanLabel] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fromUrl = extractTrustedReturnLookup(searchParams);
    const storedOrderId = readStoredOrderId();
    const lookup = {
      orderId: fromUrl.orderId ?? storedOrderId,
      externalReference: fromUrl.externalReference,
    };

    const timer = window.setTimeout(() => {
      if (cancelled) return;

      if (!lookup.orderId && !lookup.externalReference) {
        // Sem referência confiável: não inventa aprovação a partir da URL.
        setPhase("not_found");
        return;
      }

      let attempts = 0;

      async function poll(): Promise<boolean> {
        attempts += 1;
        setPollCount(attempts);
        try {
          const qs = buildStatusQuery(lookup);
          const res = await fetch(`/api/payments/mercadopago/order-status?${qs}`, {
            cache: "no-store",
          });
          if (res.status === 401) {
            if (!cancelled) {
              setAuthRequired(true);
              setPhase("not_found");
            }
            return false;
          }
          const data = (await res.json()) as SafeStatusResponse;
          if (cancelled) return false;

          const nextPhase = data.phase ?? "not_found";
          setPhase(nextPhase);
          setPlanLabel(data.planLabel ?? null);

          if (nextPhase === "approved") {
            clearStoredOrderId();
            return false;
          }

          return (
            Boolean(data.canPoll) &&
            attempts < PAYMENT_STATUS_MAX_POLLS &&
            (nextPhase === "confirming" || nextPhase === "not_found")
          );
        } catch {
          if (!cancelled && attempts >= PAYMENT_STATUS_MAX_POLLS) {
            setPhase("not_found");
          }
          return attempts < PAYMENT_STATUS_MAX_POLLS;
        }
      }

      void (async () => {
        let cont = await poll();
        while (cont && !cancelled) {
          await new Promise((r) => setTimeout(r, PAYMENT_STATUS_POLL_INTERVAL_MS));
          cont = await poll();
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchParams]);

  const copy = copyForPhase(variant, phase, planLabel);
  const showingConfirming = phase === "loading" || phase === "confirming";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-lg text-center">
        <div
          className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${
            copy.icon === "success"
              ? "bg-[#009739]/20 text-[#00B347]"
              : copy.icon === "pending" || copy.icon === "loading"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-red-500/15 text-red-300"
          }`}
        >
          {copy.icon === "loading" || (showingConfirming && copy.icon === "pending") ? (
            <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
          ) : copy.icon === "success" ? (
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          ) : copy.icon === "pending" ? (
            <Clock3 className="h-7 w-7" aria-hidden />
          ) : (
            <AlertCircle className="h-7 w-7" aria-hidden />
          )}
        </div>

        <SectionHeading badge="Mercado Pago" title={copy.title} subtitle={copy.subtitle} />

        {showingConfirming ? (
          <p className="mt-4 text-xs text-zinc-500" aria-live="polite">
            Atualizando status {Math.min(pollCount, PAYMENT_STATUS_MAX_POLLS)}/{PAYMENT_STATUS_MAX_POLLS}…
          </p>
        ) : null}

        {authRequired ? (
          <p className="mt-4 text-sm text-amber-200/90" role="status">
            Faça login para acompanhar a confirmação do pedido na sua conta.
          </p>
        ) : null}

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/portal/conta"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#009739] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-all hover:scale-[1.02] hover:bg-[#00B347]"
          >
            <User className="h-4 w-4" />
            Voltar ao portal
          </Link>
          {(phase === "rejected" || phase === "cancelled" || variant === "erro") && phase !== "approved" ? (
            <Link
              href="/plans"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#009739]/60 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#00B347] transition-all hover:bg-[#009739]/10"
            >
              <RotateCcw className="h-4 w-4" />
              Tentar novamente
            </Link>
          ) : null}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-zinc-500">
          A liberação do plano depende exclusivamente da confirmação no servidor. Status na URL do
          Mercado Pago não é usado. No Pix, use “Voltar para Brazilian Dj Pools” no rodapé do checkout
          se a tela do QR ficar parada após o pagamento.
        </p>
      </div>
    </div>
  );
}
