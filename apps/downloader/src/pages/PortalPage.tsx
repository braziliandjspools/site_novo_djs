import { CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import { openPlatform } from "../lib/open-site";
import { BP_PORTAL_URL, SITE_NAME } from "../lib/site";

export function PortalPage() {
  const { user, refreshSession } = useAuth();
  const billing = user?.billing;
  const planLabel = user?.planLabel || user?.servicesLabel || "—";
  const services = user?.services;

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Panel
        title="Portal do assinante"
        description={`Gerencie plano, renovação e serviços no ${SITE_NAME}.`}
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-[#121212] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Conta</p>
              <p className="mt-1.5 text-sm font-bold text-white">{user?.name ?? "—"}</p>
              <p className="mt-1 truncate text-xs text-zinc-500">{user?.email?.trim() || "—"}</p>
              {user?.whatsapp ? (
                <p className="mt-1 text-xs text-zinc-500">WhatsApp: {user.whatsapp}</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#121212] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Plano</p>
              <p className="mt-1.5 text-sm font-bold text-[#1db954]">{planLabel}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {billing?.nextDueLabel
                  ? `Próximo vencimento: ${billing.nextDueLabel}`
                  : "Vencimento não informado"}
              </p>
              {user?.monthlyValueLabel ? (
                <p className="mt-1 text-xs text-zinc-500">Mensalidade: {user.monthlyValueLabel}</p>
              ) : null}
            </div>
          </div>

          {services && (
            <div className="rounded-xl border border-white/[0.06] bg-[#121212] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Serviços ativos
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
                <li className={services.poolsVip ? "text-[#1db954]" : "text-zinc-600"}>
                  {services.poolsVip ? "●" : "○"} Pools VIP
                </li>
                <li className={services.allavsoft ? "text-[#1db954]" : "text-zinc-600"}>
                  {services.allavsoft ? "●" : "○"} Allavsoft
                </li>
              </ul>
            </div>
          )}

          {billing?.expired ? (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Seu plano está vencido. Renove no Portal para voltar a usar o Downloader.
            </p>
          ) : billing?.expiringSoon ? (
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Seu plano vence em {billing.daysUntilDue} dia(s) ({billing.nextDueLabel}).
            </p>
          ) : (
            <p className="rounded-xl border border-[#1db954]/20 bg-[#1db954]/10 px-4 py-3 text-sm text-[#1db954]">
              Plano em dia. Use o Portal para alterar dados, renovar ou consultar serviços.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void openPlatform(BP_PORTAL_URL)}>
              <ExternalLink className="h-4 w-4" />
              Abrir Portal / renovar plano
            </Button>
          </div>

          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <CreditCard className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1db954]" />
              Atualize forma de pagamento e acompanhe o próximo vencimento.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1db954]" />
              Consulte pools e demais serviços inclusos na sua conta no Portal web.
            </li>
          </ul>
        </div>
      </Panel>
    </div>
  );
}
