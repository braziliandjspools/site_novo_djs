"use client";

import { useState } from "react";
import { ArrowRightLeft, CreditCard, Loader2 } from "lucide-react";
import { PortalCard } from "../PortalShell";

export type PortalPlanChangeCard = {
  id: string;
  name: string;
  price: string;
  period: string;
  durationMonths: number;
  description: string;
  badge: string | null;
  highlight: boolean;
  catalogPrice?: string;
  creditLabel?: string | null;
  remainingDays?: number | null;
  amountDueLabel?: string | null;
  projectedDueLabel?: string | null;
};

type PortalPlanChangePanelProps = {
  plans: PortalPlanChangeCard[];
  hasVip: boolean;
  currentValueLabel?: string;
  currentDueLabel?: string;
};

/** Upgrade / downgrade entre mensal (1), trimestral (3) e semestral (6). */
export function PortalPlanChangePanel({
  plans,
  hasVip,
  currentValueLabel,
  currentDueLabel,
}: PortalPlanChangePanelProps) {
  const [selectedId, setSelectedId] = useState(plans.find((p) => p.highlight)?.id ?? plans[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (plans.length === 0) return null;

  const selected = plans.find((p) => p.id === selectedId) ?? plans[0];
  const hasCredit = Boolean(selected?.creditLabel);

  async function checkout() {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ planId: selectedId }),
      });
      const data = (await res.json()) as {
        checkoutUrl?: string;
        error?: string;
        loginUrl?: string;
        code?: string;
      };
      if (res.status === 401 && data.loginUrl) {
        window.location.assign(data.loginUrl);
        return;
      }
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error || "Não foi possível abrir o checkout.");
        setLoading(false);
        return;
      }
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("Erro de conexão ao preparar o pagamento.");
      setLoading(false);
    }
  }

  return (
    <PortalCard
      title={hasVip ? "Trocar plano (upgrade / downgrade)" : "Assinar Pools VIP"}
      action={
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          <ArrowRightLeft className="h-3 w-3" />
          1 · 3 · 6 meses
        </span>
      }
    >
      <p className="mb-4 text-sm text-zinc-400">
        {hasVip
          ? `Com VIP ativo, calculamos o crédito do período restante e cobramos só a diferença. Após o pagamento, o vencimento é atualizado automaticamente${
              currentDueLabel ? ` (hoje: ${currentDueLabel})` : ""
            }${currentValueLabel ? ` · plano atual ${currentValueLabel}` : ""}.`
          : "Escolha a duração do acesso VIP. Pagamento único."}
      </p>

      <ul className="grid gap-3 sm:grid-cols-3">
        {plans.map((plan) => {
          const isSelected = plan.id === selectedId;
          return (
            <li key={plan.id}>
              <button
                type="button"
                onClick={() => setSelectedId(plan.id)}
                className={`flex h-full w-full flex-col rounded-xl border px-3 py-3 text-left transition ${
                  isSelected
                    ? "border-[#00ff9d] bg-[#00ff9d]/10 ring-1 ring-[#00ff9d]/40"
                    : "border-zinc-800 bg-[#0a0a0a] hover:border-zinc-600"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {plan.badge ?? plan.period}
                </span>
                <span className="mt-1 text-sm font-semibold text-white">{plan.period}</span>
                <span className="mt-2 text-lg font-black tabular-nums text-[#FFDF00]">
                  {plan.amountDueLabel ?? plan.price}
                </span>
                {plan.catalogPrice && plan.amountDueLabel && plan.catalogPrice !== plan.amountDueLabel ? (
                  <span className="mt-0.5 text-[11px] text-zinc-500 line-through">{plan.catalogPrice}</span>
                ) : null}
                {plan.creditLabel ? (
                  <span className="mt-1 text-[11px] text-[#00ff9d]">
                    Crédito {plan.creditLabel}
                    {plan.remainingDays != null ? ` · ${plan.remainingDays}d` : ""}
                  </span>
                ) : null}
                {plan.projectedDueLabel ? (
                  <span className="mt-1 text-[11px] leading-snug text-zinc-500">
                    Novo venc.: {plan.projectedDueLabel}
                  </span>
                ) : (
                  <span className="mt-1 text-[11px] leading-snug text-zinc-500">{plan.name}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {hasVip && hasCredit && selected ? (
        <p className="mt-3 text-xs text-zinc-500">
          Selecionado: {selected.period} — tabela {selected.catalogPrice ?? selected.price}
          {selected.creditLabel ? `, crédito ${selected.creditLabel}` : ""}
          {selected.amountDueLabel ? `, a pagar ${selected.amountDueLabel}` : ""}
          {selected.projectedDueLabel ? `. Novo vencimento: ${selected.projectedDueLabel}` : "."}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={loading || !selectedId}
          onClick={() => void checkout()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-black hover:bg-[#00e68a] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
          {hasVip ? "Pagar troca de plano" : "Assinar agora"}
        </button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    </PortalCard>
  );
}
