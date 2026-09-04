import Link from "next/link";
import type { ReactNode } from "react";
import { Music2, Sparkles } from "lucide-react";
import { PortalBadge, PortalCard, PortalPageHeader } from "../PortalShell";
import { formatDateBr, type PortalData } from "../portal-types";
import type { PortalView } from "../PortalShell";

type ServicesViewProps = {
  data: PortalData;
  onNavigate: (view: PortalView) => void;
};

export function ServicesView({ data, onNavigate }: ServicesViewProps) {
  const { user } = data;

  const rows = [
    data.pools && {
      name: "Pools VIP — Acervo de Músicas",
      badge: <PortalBadge>Ativo</PortalBadge>,
      due: formatDateBr(user.nextDueAt),
      view: "service-pools" as PortalView,
    },
    data.deemix && {
      name: "Deemix — Download de Músicas",
      badge: <PortalBadge>Ativo</PortalBadge>,
      due: formatDateBr(user.nextDueAt),
      view: "service-deemix" as PortalView,
    },
    data.allavsoft && {
      name: "Allavsoft — Download Universal",
      badge: <PortalBadge variant="amber">Em breve</PortalBadge>,
      due: formatDateBr(data.allavsoft.availableFrom),
      view: "service-allavsoft" as PortalView,
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
    },
  ].filter(Boolean) as Array<{
    name: string;
    badge: ReactNode;
    due: string;
    view: PortalView;
  }>;

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Meus Serviços" subtitle="Gerencie suas licenças e produtos contratados." />

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
              <button
                type="button"
                onClick={() => onNavigate(row.view)}
                className="mt-3 rounded-lg bg-[#00ff9d] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-black hover:bg-[#00e68a]"
              >
                Gerenciar
              </button>
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
                    <button
                      type="button"
                      onClick={() => onNavigate(row.view)}
                      className="rounded-lg bg-[#00ff9d] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black hover:bg-[#00e68a]"
                    >
                      Gerenciar
                    </button>
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
