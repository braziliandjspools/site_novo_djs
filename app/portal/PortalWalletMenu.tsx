"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CircleDollarSign, Loader2, Plus, Wallet, X } from "lucide-react";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function PortalWalletMenu() {
  const [balance, setBalance] = useState(0);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animationFrame = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/portal/wallet", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { balance?: number };
      if (typeof payload.balance !== "number" || !Number.isFinite(payload.balance)) return;
      setBalance((previous) => {
        if (previous === payload.balance) return previous;
        const start = previous;
        const end = payload.balance!;
        const startedAt = performance.now();
        if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
        const animate = (now: number) => {
          const progress = Math.min(1, (now - startedAt) / 650);
          const eased = 1 - (1 - progress) ** 3;
          setDisplayBalance(start + (end - start) * eased);
          if (progress < 1) animationFrame.current = requestAnimationFrame(animate);
        };
        animationFrame.current = requestAnimationFrame(animate);
        return end;
      });
    } catch {
      // A próxima atualização automática tentará novamente.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    };
  }, [refresh]);

  async function submitTopup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/portal/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ amount }),
      });
      const payload = (await response.json()) as { checkoutUrl?: string; orderId?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) {
        setError(payload.error ?? "Não foi possível iniciar a recarga.");
        setBusy(false);
        return;
      }
      if (payload.orderId) {
        try { sessionStorage.setItem("brs_mp_order_id", payload.orderId); } catch { /* ignore */ }
      }
      window.location.assign(payload.checkoutUrl);
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Saldo disponível ${currency.format(displayBalance)}`}
          className="inline-flex h-9 max-w-[112px] items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-2.5 text-[11px] font-bold tabular-nums text-white transition hover:border-emerald-300/50 hover:bg-emerald-300/[0.14] sm:max-w-none sm:px-3"
        >
          <Wallet className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
          <span className="truncate">{currency.format(displayBalance)}</span>
        </button>
        <button
          type="button"
          aria-label="Adicionar saldo"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-200 transition hover:border-emerald-300/40 hover:bg-emerald-300/10 hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) setOpen(false);
        }}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="portal-wallet-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#17191a] p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/20">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
                <h2 id="portal-wallet-title" className="text-xl font-bold text-white">Adicionar saldo</h2>
                <p className="mt-1 text-sm text-zinc-400">Saldo atual: <span className="font-semibold text-white">{currency.format(balance)}</span></p>
              </div>
              <button type="button" aria-label="Fechar" disabled={busy} onClick={() => setOpen(false)} className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={(event) => void submitTopup(event)}>
              <label className="block text-xs font-semibold text-zinc-300" htmlFor="wallet-topup-amount">Valor da recarga</label>
              <div className="flex items-center rounded-xl border border-white/10 bg-black/30 px-3 focus-within:border-emerald-300/50">
                <span className="mr-2 text-sm text-zinc-500">R$</span>
                <input
                  id="wallet-topup-amount"
                  autoFocus
                  required
                  type="number"
                  min="0.01"
                  max="99999999.99"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0,00"
                  className="h-12 min-w-0 flex-1 bg-transparent text-lg font-semibold text-white outline-none placeholder:text-zinc-600"
                />
              </div>
              {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
              <p className="text-xs leading-relaxed text-zinc-500">O pagamento é processado pelo Mercado Pago. Após a confirmação, o saldo aparece automaticamente aqui.</p>
              <button disabled={busy} type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00ff9d] px-4 text-sm font-bold text-black transition hover:bg-[#00e68a] disabled:cursor-wait disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {busy ? "Preparando pagamento…" : "Continuar para o Mercado Pago"}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
