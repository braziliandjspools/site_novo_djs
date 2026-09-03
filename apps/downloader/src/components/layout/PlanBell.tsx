import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ExternalLink } from "lucide-react";
import type { PlanBillingInfo } from "../../lib/plan-status";
import { planNotificationMessages } from "../../lib/plan-status";
import { openPlatform } from "../../lib/open-site";
import { BP_PORTAL_URL } from "../../lib/site";
import { Button } from "../ui/Button";

type PlanBellProps = {
  billing?: PlanBillingInfo | null;
  onOpenPortal?: () => void;
};

export function PlanBell({ billing, onOpenPortal }: PlanBellProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const messages = useMemo(() => planNotificationMessages(billing), [billing]);
  const hasAlert = messages.length > 0;
  const isExpired = billing?.expired;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
          hasAlert
            ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
        }`}
        aria-label={hasAlert ? "Avisos do plano" : "Notificações do plano"}
        title={hasAlert ? messages[0] : "Sem avisos de vencimento"}
      >
        <Bell className="h-4 w-4" />
        {hasAlert && (
          <span
            className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
              isExpired ? "bg-red-400" : "bg-amber-400"
            }`}
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-white/[0.08] bg-[#161616] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Avisos do plano
          </p>

          {messages.length === 0 ? (
            <p className="mt-3 rounded-xl bg-white/[0.03] px-3 py-3 text-sm text-zinc-400">
              Nenhum aviso. Seu plano está em dia
              {billing?.nextDueLabel ? ` (vence em ${billing.nextDueLabel})` : ""}.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {messages.map((message) => (
                <li
                  key={message}
                  className={`rounded-xl px-3 py-3 text-sm ${
                    isExpired
                      ? "border border-red-500/20 bg-red-500/10 text-red-300"
                      : "border border-amber-500/20 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  {message}
                </li>
              ))}
            </ul>
          )}

          <Button
            variant="secondary"
            className="mt-3 w-full !text-xs"
            onClick={() => {
              setOpen(false);
              if (onOpenPortal) onOpenPortal();
              else void openPlatform(BP_PORTAL_URL);
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir Portal
          </Button>
        </div>
      )}
    </div>
  );
}
