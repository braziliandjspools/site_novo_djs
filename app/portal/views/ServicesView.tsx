import Link from "next/link";
import type { ReactNode } from "react";
import { Music2, Sparkles } from "lucide-react";
import { PortalRenewalPay, PortalRenewPayButton } from "../PortalRenewalPay";
import { PortalBadge, PortalCard, PortalPageHeader } from "../PortalShell";
import { formatDateBr, type PortalData } from "../portal-types";
import type { PortalView } from "../PortalShell";

type ServicesViewProps = {
  data: PortalData;
  onNavigate: (view: PortalView) => void;
};

export function ServicesView({ data, onNavigate }: ServicesViewProps) {
  const { user, renewables = [] } = data;

  const rows = [
    data.pools && {
      name: "Pools VIP — Acervo de Músicas",
      badge: <PortalBadge>Ativo</PortalBadge>,
      due: `${user.serviceBilling.poolsVip.valueLabel} · ${formatDateBr(user.serviceBilling.poolsVip.dueAt ?? user.nextDueAt)}`,
      view: "service-pools" as PortalView,
      payKey: "poolsVip" as const,
    },
    data.allavsoft && {
      name: "Allavsoft — Deezer, Spotify, YouTube e +1000 sites",
      badge: <PortalBadge>Vitalícia</PortalBadge>,
      due: `${user.serviceBilling.allavsoft.valueLabel} · Sem vencimento`,
      view: "service-allavsoft" as PortalView,
      payKey: null,
    },
    {
      name: "Produção Musical — Minhas faixas",
      badge: data.musicProducerDeliveries.enabled ? (
        <PortalBadge>Disponível</PortalBadge>
      ) : (
        <PortalBadge variant="amber">Vazio</PortalBadge>
      ),
      due: "—",
      view: "service-music-producer" as PortalView,
      payKey: null,
    },
  ].filter(Boolean) as Array<{
    name: string;
    badge: ReactNode;
    due: string;
    view: PortalView;
    payKey: "poolsVip" | null;
  }>;

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Meus Serviços" subtitle="Gerencie suas licenças e produtos contratados." />

      {renewables.length > 0 && <PortalRenewalPay renewables={renewables} />}

      {data.hasSubscriptionPlan && (
        <p className="text-sm text-zinc-400">
          <span className="font-medium text-white">{user.servicesLabel}</span>
          {" · "}
          Valor mensal: <span className="font-medium text-[#FFDF00]">{user.monthlyValueLabel}</span>
        </p>
      )}

      {!data.hasSubscriptionPlan && (
        <PortalCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl tracking-wide text-white">Nenhuma licença ativa</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                Contrate VIP ou Allavsoft, ou peça uma produção musical pelo briefing assistido por IA.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/plans"
                className="inline-flex items-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-black hover:bg-[#00e68a]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Escolher plano
              </Link>
              <Link
                href="/musicproducer#conte-sua-ideia"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:border-[#1DB954]/40 hover:text-white"
              >
                <Music2 className="h-3.5 w-3.5" />
                Pedir produção
              </Link>
            </div>
          </div>
        </PortalCard>
      )}

      <PortalCard>
        <div className="space-y-3 md:hidden">
          {rows.map((row) => (
            <div key={row.name} className="rounded-xl border border-zinc-800 bg-[#0a0a0a] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-medium text-white">{row.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{row.name.split(" — ")[0]}</p>
                  <p className="mt-1 text-xs text-zinc-500">Venc.: {row.due}</p>
                </div>
                {row.badge}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {row.payKey && <PortalRenewPayButton service={row.payKey} renewables={renewables} />}
                <button
                  type="button"
                  onClick={() => onNavigate(row.view)}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-200 hover:border-[#00ff9d]/40"
                >
                  Gerenciar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                <th className="pb-3 pr-4">Produto / Serviço</th>
                <th className="pb-3 pr-4">Licença</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Próx. vencimento</th>
                <th className="pb-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.name} className="transition-colors hover:bg-zinc-800/30">
                  <td className="py-4 pr-4 font-medium text-white">{row.name}</td>
                  <td className="py-4 pr-4 text-zinc-400">{row.name.split(" — ")[0]}</td>
                  <td className="py-4 pr-4">{row.badge}</td>
                  <td className="py-4 pr-4 text-zinc-400">{row.due}</td>
                  <td className="py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {row.payKey && <PortalRenewPayButton service={row.payKey} renewables={renewables} />}
                      <button
                        type="button"
                        onClick={() => onNavigate(row.view)}
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-200 hover:border-[#00ff9d]/40"
                      >
                        Gerenciar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PortalCard>
    </div>
  );
}
