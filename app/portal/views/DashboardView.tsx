import Link from "next/link";
import { ArrowRight, Calendar, LayoutGrid, MessageCircle, Music2, Package, Sparkles } from "lucide-react";
import { whatsappUrl } from "../../lib/site";
import { PortalBadge, PortalCard, StatCard } from "../PortalShell";
import {
  countServices,
  formatDateBr,
  formatDateTimeBr,
  getGreeting,
  getGreetingHour,
  type PortalData,
} from "../portal-types";
import type { PortalView } from "../PortalShell";

type DashboardViewProps = {
  data: PortalData;
  now: Date;
  onNavigate: (view: PortalView) => void;
};

export function DashboardView({ data, now, onNavigate }: DashboardViewProps) {
  const { user } = data;
  const greeting = getGreeting(getGreetingHour(now));
  const services = countServices(data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-white">
          {greeting}, <span className="text-[#00ff9d]">{user.name.split(" ")[0]}</span>
        </h1>
        <p className="mt-1 text-sm capitalize text-zinc-500">{formatDateTimeBr(now)}</p>
        <div className="mt-3 h-0.5 w-20 rounded-full bg-gradient-to-r from-[#009739] to-[#FFDF00]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={LayoutGrid} label="Serviços ativos" value={String(services)} hint="Licenças no seu plano" />
        <StatCard
          icon={Calendar}
          label="Próximo vencimento"
          value={data.hasSubscriptionPlan ? formatDateBr(user.nextDueAt) : "—"}
          hint={data.hasSubscriptionPlan ? `Todo dia ${user.dueDay} de cada mês` : "Sem plano contratado"}
        />
        <StatCard icon={Package} label="Plano" value={data.hasSubscriptionPlan ? user.plan : "—"} hint={user.planLabel} />
        <StatCard
          icon={Calendar}
          label="Cliente desde"
          value={formatDateBr(user.createdAt)}
          hint={user.active ? "Conta ativa" : "Conta inativa"}
        />
      </div>

      {!data.hasSubscriptionPlan && (
        <PortalCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl tracking-wide text-white">Você ainda não tem um plano ativo</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                Escolha um plano de licença ou solicite uma produção musical. Seu cadastro já está pronto — basta
                contratar o serviço que preferir.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/#planos"
                className="inline-flex items-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-black hover:bg-[#00e68a]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ver planos
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

      <PortalCard title="Resumo dos serviços">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                <th className="pb-3 pr-4">Serviço</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Próx. vencimento</th>
                <th className="pb-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.pools && (
                <tr className="hover:bg-zinc-800/30">
                  <td className="py-3 pr-4 font-medium text-white">Pools VIP</td>
                  <td className="py-3 pr-4"><PortalBadge>Ativo</PortalBadge></td>
                  <td className="py-3 pr-4 text-zinc-400">{formatDateBr(user.nextDueAt)}</td>
                  <td className="py-3">
                    <button type="button" onClick={() => onNavigate("service-pools")} className="text-xs font-bold uppercase tracking-wider text-[#00ff9d] hover:underline">
                      Gerenciar
                    </button>
                  </td>
                </tr>
              )}
              {data.deemix && (
                <tr className="hover:bg-zinc-800/30">
                  <td className="py-3 pr-4 font-medium text-white">Deemix</td>
                  <td className="py-3 pr-4"><PortalBadge>Ativo</PortalBadge></td>
                  <td className="py-3 pr-4 text-zinc-400">{formatDateBr(user.nextDueAt)}</td>
                  <td className="py-3">
                    <button type="button" onClick={() => onNavigate("service-deemix")} className="text-xs font-bold uppercase tracking-wider text-[#00ff9d] hover:underline">
                      Gerenciar
                    </button>
                  </td>
                </tr>
              )}
              {data.allavsoft && (
                <tr className="hover:bg-zinc-800/30">
                  <td className="py-3 pr-4 font-medium text-white">Allavsoft</td>
                  <td className="py-3 pr-4"><PortalBadge variant="amber">Em breve</PortalBadge></td>
                  <td className="py-3 pr-4 text-zinc-400">{formatDateBr(data.allavsoft.availableFrom)}</td>
                  <td className="py-3">
                    <button type="button" onClick={() => onNavigate("service-allavsoft")} className="text-xs font-bold uppercase tracking-wider text-[#00ff9d] hover:underline">
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              )}
              <tr className="hover:bg-zinc-800/30">
                <td className="py-3 pr-4 font-medium text-white">Produção Musical</td>
                <td className="py-3 pr-4">
                  {data.musicProducerDeliveries.enabled ? (
                    <PortalBadge>Ativo</PortalBadge>
                  ) : (
                    <PortalBadge variant="amber">Sem faixas</PortalBadge>
                  )}
                </td>
                <td className="py-3 pr-4 text-zinc-400">Minhas produções</td>
                <td className="py-3">
                  <button
                    type="button"
                    onClick={() => onNavigate("service-music-producer")}
                    className="text-xs font-bold uppercase tracking-wider text-[#00ff9d] hover:underline"
                  >
                    Ver faixas
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PortalCard>

      <div className="grid gap-4 md:grid-cols-2">
        <PortalCard title="Ações rápidas">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onNavigate("services")}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-[#0a0a0a] px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:border-[#009739]/40 hover:text-white"
            >
              Ver todos os serviços
              <ArrowRight className="h-4 w-4 text-[#00ff9d]" />
            </button>
            <Link
              href={whatsappUrl("Olá! Preciso de suporte na área do cliente.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-[#0a0a0a] px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:border-[#009739]/40 hover:text-white"
            >
              Falar com suporte
              <MessageCircle className="h-4 w-4 text-[#00ff9d]" />
            </Link>
          </div>
        </PortalCard>

        <PortalCard title="Informações da conta">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <dt className="text-zinc-500">E-mail</dt>
              <dd className="font-medium text-white">{user.email}</dd>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <dt className="text-zinc-500">Plano</dt>
              <dd className="font-medium text-[#FFDF00]">{user.planLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">WhatsApp</dt>
              <dd className="font-medium text-white">{user.whatsapp}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => onNavigate("account")}
            className="mt-4 text-xs font-bold uppercase tracking-wider text-[#00ff9d] hover:underline"
          >
            Ver minha conta →
          </button>
        </PortalCard>
      </div>
    </div>
  );
}
