"use client";

import { useMemo, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { PortalCard } from "./PortalShell";
import type { PortalRenewableService } from "./portal-types";

type PortalRenewalPayProps = {
  renewables: PortalRenewableService[];
};

function urgencyCopy(item: PortalRenewableService) {
  if (item.urgency === "overdue") {
    return item.daysUntilDue === -1 ? "Venceu ontem" : `Vencido há ${Math.abs(item.daysUntilDue)} dias`;
  }
  if (item.daysUntilDue === 0) return "Vence hoje";
  if (item.daysUntilDue === 1) return "Vence amanhã";
  return `Vence em ${item.daysUntilDue} dias`;
}

function dismissStorageKey(dueDayKey: string) {
  return `brs-portal-renewal-dismiss:${dueDayKey}`;
}

export function PortalRenewalPay({ renewables }: PortalRenewalPayProps) {
  const [dismissedDays, setDismissedDays] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const next = new Set<string>();
    for (const item of renewables) {
      try {
        if (sessionStorage.getItem(dismissStorageKey(item.dueDayKey)) === "1") {
          next.add(item.dueDayKey);
        }
      } catch {
        /* ignore */
      }
    }
    return next;
  });
  const [skipped, setSkipped] = useState<Set<PortalRenewableService["key"]>>(new Set());
  const [selected, setSelected] = useState<Set<PortalRenewableService["key"]>>(() => new Set(renewables.map((r) => r.key)));
  const [loadingKey, setLoadingKey] = useState<PortalRenewableService["key"] | "batch" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () => renewables.filter((item) => !dismissedDays.has(item.dueDayKey) && !skipped.has(item.key)),
    [renewables, dismissedDays, skipped],
  );

  const groups = useMemo(() => {
    const map = new Map<string, PortalRenewableService[]>();
    for (const item of visible) {
      const list = map.get(item.dueDayKey) ?? [];
      list.push(item);
      map.set(item.dueDayKey, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visible]);

  if (groups.length === 0) return null;

  async function startCheckout(service: PortalRenewableService["key"]) {
    setLoadingKey(service);
    setError(null);
    try {
      const res = await fetch("/api/payments/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ renewalService: service }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string; loginUrl?: string };
      if (res.status === 401 && data.loginUrl) {
        window.location.assign(data.loginUrl);
        return;
      }
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error || "Não foi possível abrir o Mercado Pago.");
        setLoadingKey(null);
        return;
      }
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("Erro de conexão ao preparar o pagamento.");
      setLoadingKey(null);
    }
  }

  function toggleSelected(key: PortalRenewableService["key"]) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function skipService(key: PortalRenewableService["key"]) {
    setSkipped((prev) => new Set(prev).add(key));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function cancelGroup(dueDayKey: string) {
    try {
      sessionStorage.setItem(dismissStorageKey(dueDayKey), "1");
    } catch {
      /* ignore */
    }
    setDismissedDays((prev) => new Set(prev).add(dueDayKey));
  }

  async function paySelected(items: PortalRenewableService[]) {
    const chosen = items.filter((item) => selected.has(item.key));
    if (chosen.length === 0) {
      setError("Selecione ao menos um serviço para pagar.");
      return;
    }
    // Um checkout por serviço (valores e produtos separados no MP).
    if (chosen.length === 1) {
      await startCheckout(chosen[0]!.key);
      return;
    }
    setLoadingKey("batch");
    setError(null);
    // Paga o primeiro selecionado; os demais continuam no painel após retorno.
    await startCheckout(chosen[0]!.key);
  }

  return (
    <div className="space-y-4">
      {groups.map(([dueDayKey, items]) => {
        const stacked = items.length > 1;
        const dueLabel = items[0]!.dueLabel;
        const totalSelected = items
          .filter((item) => selected.has(item.key))
          .reduce((sum, item) => sum + item.value, 0);
        const totalLabel = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(totalSelected);

        return (
          <PortalCard key={dueDayKey} title={stacked ? `Vencimentos em ${dueLabel}` : "Renovação"}>
            <p className="mb-4 text-sm text-zinc-400">
              {stacked
                ? "Mais de um serviço vence nesta data. Escolha o que pagar agora, deixe para depois ou cancele este aviso."
                : "Seu plano está na janela de renovação. Pague pelo Mercado Pago com o valor do seu serviço."}
            </p>

            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-[#0a0a0a] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {stacked && (
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-[#00ff9d]"
                        checked={selected.has(item.key)}
                        onChange={() => toggleSelected(item.key)}
                        aria-label={`Incluir ${item.label}`}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.valueLabel} · {urgencyCopy(item)} · {item.dueLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!stacked && (
                      <button
                        type="button"
                        disabled={loadingKey !== null}
                        onClick={() => void startCheckout(item.key)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#00ff9d] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-black hover:bg-[#00e68a] disabled:opacity-60"
                      >
                        {loadingKey === item.key ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CreditCard className="h-3.5 w-3.5" />
                        )}
                        Pagar
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={loadingKey !== null}
                      onClick={() => skipService(item.key)}
                      className="rounded-lg border border-zinc-700 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-60"
                    >
                      Deixar
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {stacked && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-400">
                  Selecionado: <span className="font-medium text-[#FFDF00]">{totalLabel}</span>
                </p>
                <button
                  type="button"
                  disabled={loadingKey !== null}
                  onClick={() => void paySelected(items)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-black hover:bg-[#00e68a] disabled:opacity-60"
                >
                  {loadingKey === "batch" || (loadingKey && selected.has(loadingKey)) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="h-3.5 w-3.5" />
                  )}
                  Pagar selecionados
                </button>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-4">
              <button
                type="button"
                disabled={loadingKey !== null}
                onClick={() => cancelGroup(dueDayKey)}
                className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
              >
                Cancelar aviso
              </button>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          </PortalCard>
        );
      })}
    </div>
  );
}

/** Botão compacto para linha de serviço. */
export function PortalRenewPayButton({
  service,
  renewables,
}: {
  service: PortalRenewableService["key"];
  renewables: PortalRenewableService[];
}) {
  const item = renewables.find((r) => r.key === service);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ renewalService: service }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string; loginUrl?: string };
      if (res.status === 401 && data.loginUrl) {
        window.location.assign(data.loginUrl);
        return;
      }
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error || "Falha no checkout");
        setLoading(false);
        return;
      }
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("Erro de conexão");
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => void pay()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#00ff9d] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black hover:bg-[#00e68a] disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
        Pagar
      </button>
      {error && <span className="max-w-[10rem] text-[10px] text-red-400">{error}</span>}
    </span>
  );
}
