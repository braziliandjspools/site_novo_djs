"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2, RefreshCw, RotateCcw, Trash2, Wallet } from "lucide-react";
import { PortalCard } from "../PortalShell";
import { formatDateBr } from "../portal-types";
import { useSiteToast } from "../../components/SiteToast";

type PaymentRow = {
  id: string;
  providerLabel: string;
  planId: string;
  planLabel: string;
  amountLabel: string;
  statusUi: "pago" | "pendente" | "cancelado" | "reembolsado";
  statusLabel: string;
  paymentId: string | null;
  createdAt: string;
  approvedAt: string | null;
  canDismiss?: boolean;
  canRetry?: boolean;
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
  const { showToast } = useSiteToast();
  const [data, setData] = useState<PaymentsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
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

  async function dismissPending(payment: PaymentRow) {
    if (!payment.canDismiss) return;
    setActingId(payment.id);
    try {
      const res = await fetch(`/api/portal/payments/${payment.id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(json.error ?? "Não foi possível remover o pendente.", "error");
        return;
      }
      showToast("Pendente removido do histórico.", "success");
      await refresh();
    } catch {
      showToast("Erro ao remover pendente.", "error");
    } finally {
      setActingId(null);
    }
  }

  async function retryPayment(payment: PaymentRow) {
    if (!payment.canRetry || !payment.planId) return;
    setActingId(payment.id);
    try {
      // Remove o pendente antigo e abre novo checkout do mesmo plano.
      await fetch(`/api/portal/payments/${payment.id}`, { method: "DELETE" });
      const res = await fetch("/api/payments/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ planId: payment.planId }),
      });
      const json = (await res.json()) as {
        checkoutUrl?: string;
        error?: string;
        loginUrl?: string;
      };
      if (res.status === 401 && json.loginUrl) {
        window.location.assign(json.loginUrl);
        return;
      }
      if (!res.ok || !json.checkoutUrl) {
        showToast(json.error ?? "Não foi possível reabrir o pagamento.", "error");
        await refresh();
        return;
      }
      window.location.assign(json.checkoutUrl);
    } catch {
      showToast("Erro ao tentar pagar novamente.", "error");
      setActingId(null);
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
          Histórico de pagamentos online e ajustes manuais do admin: data, valor e status. Pedidos
          pendentes podem ser removidos ou reabertos para pagamento.
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
                  {payment.statusUi === "pendente" && (payment.canDismiss || payment.canRetry) ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {payment.canRetry ? (
                        <button
                          type="button"
                          disabled={actingId === payment.id}
                          onClick={() => void retryPayment(payment)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#00ff9d] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black hover:bg-[#00e68a] disabled:opacity-60"
                        >
                          {actingId === payment.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          Tentar pagar
                        </button>
                      ) : null}
                      {payment.canDismiss ? (
                        <button
                          type="button"
                          disabled={actingId === payment.id}
                          onClick={() => void dismissPending(payment)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-60"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remover pendente
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </PortalCard>
  );
}
