"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2, RefreshCw, Wallet } from "lucide-react";
import { PortalCard } from "../PortalShell";
import { formatDateBr } from "../portal-types";

type PaymentRow = {
  id: string;
  providerLabel: string;
  planLabel: string;
  amountLabel: string;
  statusUi: "pago" | "pendente" | "cancelado" | "reembolsado";
  statusLabel: string;
  paymentId: string | null;
  createdAt: string;
  approvedAt: string | null;
};

type PaymentsPayload = {
  payments: PaymentRow[];
  totals: {
    paidCount: number;
    pendingCount: number;
    cancelledCount: number;
    refundedCount: number;
  };
  error?: string;
};

function statusClass(statusUi: PaymentRow["statusUi"]) {
  switch (statusUi) {
    case "pago":
      return "border-[#00ff9d]/30 bg-[#00ff9d]/10 text-[#00ff9d]";
    case "pendente":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "reembolsado":
      return "border-sky-500/30 bg-sky-500/10 text-sky-300";
    case "cancelado":
    default:
      return "border-red-500/30 bg-red-500/10 text-red-300";
  }
}

export function AccountPaymentsPanel() {
  const [data, setData] = useState<PaymentsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/portal/payments", { cache: "no-store" });
    const json = (await res.json()) as PaymentsPayload;
    if (!res.ok) {
      throw new Error(json.error ?? "Não foi possível carregar o financeiro.");
    }
    setData(json);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar financeiro.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <PortalCard
      title="Financeiro"
      action={
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Atualizar
        </button>
      }
    >
      <div className="mb-4 flex items-start gap-3">
        <Wallet className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00ff9d]" />
        <p className="text-sm text-zinc-400">
          Histórico de pagamentos da sua conta (Mercado Pago via webhook): data, valor e status.
        </p>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 py-6 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando pagamentos…
        </div>
      ) : error && !data ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : data ? (
        <>
          {error && (
            <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="mb-4 grid gap-2 sm:grid-cols-4">
            {[
              { label: "Pagos", value: data.totals.paidCount },
              { label: "Pendentes", value: data.totals.pendingCount },
              { label: "Cancelados", value: data.totals.cancelledCount },
              { label: "Reembolsados", value: data.totals.refundedCount },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-zinc-800 bg-[#0a0a0a] px-3 py-2.5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-black tabular-nums text-white">{item.value}</p>
              </div>
            ))}
          </div>

          {data.payments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 px-4 py-8 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-zinc-600" />
              <p className="mt-3 text-sm text-zinc-500">
                Nenhum pagamento registrado ainda nesta conta.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.payments.map((payment) => (
                <li
                  key={payment.id}
                  className="rounded-lg border border-zinc-800 bg-[#0a0a0a] px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{payment.planLabel}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {payment.providerLabel}
                        {payment.paymentId ? ` · ID ${payment.paymentId}` : null}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass(payment.statusUi)}`}
                    >
                      {payment.statusLabel}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p className="font-mono text-base font-bold tabular-nums text-[#FFDF00]">
                      {payment.amountLabel}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {payment.approvedAt
                        ? `Pago em ${formatDateBr(payment.approvedAt)}`
                        : `Criado em ${formatDateBr(payment.createdAt)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </PortalCard>
  );
}
