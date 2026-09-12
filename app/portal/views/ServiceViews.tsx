import Link from "next/link";
import { CheckCircle2, Download, ExternalLink, MessageCircle, Sparkles, Video } from "lucide-react";
import { whatsappUrl } from "../../lib/site";
import { CopyField } from "../../components/CopyField";
import { PortalRenewPayButton } from "../PortalRenewalPay";
import { PortalBadge, PortalCard, PortalPageHeader } from "../PortalShell";
import { formatDateBr, type PortalData } from "../portal-types";
import { AllavsoftLicensesPanel } from "./AllavsoftLicensesPanel";
import { DownloaderStatsPanel } from "./DownloaderStatsPanel";

export function PoolsServiceView({ data }: { data: PortalData }) {
  if (!data.pools) return null;

  const { catalogUrl, downloader } = data.pools;
  const due =
    data.user.serviceBilling.poolsVip.dueAt ?? data.user.nextDueAt;

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Pools VIP" subtitle="Acervo de pools, remix services e curadoria." />

      <PortalCard title="Detalhes do serviço">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <PortalBadge>Ativo</PortalBadge>
          <span className="text-xs text-zinc-500">Serviços: {data.user.servicesLabel}</span>
          <span className="text-xs text-zinc-500">
            {data.user.serviceBilling.poolsVip.valueLabel} · venc. {formatDateBr(due)}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-zinc-400">
          Acesso completo ao acervo de pools, remix services e curadoria do Brazilian Remix Service — mais de 400 fontes
          organizadas para DJs.
        </p>
        {data.renewables?.some((item) => item.key === "poolsVip") && (
          <div className="mt-4">
            <PortalRenewPayButton service="poolsVip" renewables={data.renewables} />
          </div>
        )}
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {["Remix services", "Edits exclusivos", "Atualizações contínuas", "Site + Downloader Windows"].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-[#00ff9d]" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={catalogUrl}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#00e68a]"
          >
            Acessar acervo de músicas
            <ExternalLink className="h-4 w-4" />
          </Link>
          <a
            href={downloader.downloadUrl}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:border-[#00ff9d]/40 hover:text-[#00ff9d]"
          >
            <Download className="h-4 w-4" />
            Baixar {downloader.name}
          </a>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Windows x64 · versão {downloader.version} · mesmo login da conta VIP
        </p>
      </PortalCard>

      <DownloaderStatsPanel />
    </div>
  );
}

/** Deemix descontinuado — view mantida só por compat de rotas antigas. */
export function DeemixServiceView(_props: { data: PortalData }) {
  return null;
}

export function AllavsoftServiceView({ data }: { data: PortalData }) {
  if (!data.allavsoft) return null;
  const { user } = data;

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Allavsoft" subtitle="Deezer, Spotify, YouTube e +1000 sites — licença vitalícia." />

      <PortalCard title="Status do serviço">
        <PortalBadge variant="green">Licença vitalícia ativa</PortalBadge>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Seu acesso Allavsoft está liberado nesta conta. Gere e copie o serial abaixo para ativar o software.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            "Licença vitalícia (pagamento único)",
            "YouTube, Vimeo e +1000 sites",
            "Extração de áudio HQ",
            "Downloads em lote e conversão",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
              <Video className="h-4 w-4 text-amber-400" />
              {item}
            </li>
          ))}
        </ul>
      </PortalCard>

      <AllavsoftLicensesPanel />

      {user.services.poolsVip && (
        <PortalCard title="Pools VIP">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[#FFDF00]" />
            <p className="text-sm text-zinc-400">
              Você também tem Pools VIP nesta conta. Allavsoft e pools são serviços independentes.
            </p>
          </div>
        </PortalCard>
      )}
    </div>
  );
}

export function AccountView({ data }: { data: PortalData }) {
  const { user } = data;
  const subscription = user.subscription;

  const rows: [string, string][] = [
    ["Nome completo", user.name],
    ["E-mail", user.email],
    ["WhatsApp", user.whatsapp],
    ["Plano", subscription?.planLabel ?? user.planLabel],
    ["Serviços", user.servicesLabel],
    ["Status", subscription?.statusLabel ?? (user.active ? "Ativo" : "Inativo")],
    ["Pagamento", subscription?.providerLabel ?? "Manual / suporte"],
    ["Valor mensal", user.monthlyValueLabel],
    [
      subscription ? "Próxima renovação" : "Próximo vencimento",
      formatDateBr(subscription?.currentPeriodEnd ?? user.nextDueAt),
    ],
    ["Cliente desde", formatDateBr(user.createdAt)],
  ];

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Minha Conta" subtitle="Informações do seu cadastro e assinatura." />

      <PortalCard title="Dados pessoais">
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-zinc-800 bg-[#0a0a0a] px-4 py-3">
              <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </PortalCard>

      <PortalCard title="Segurança">
        <p className="text-sm text-zinc-400">
          Para alterar sua senha ou dados cadastrais, entre em contato com o suporte pelo WhatsApp.
        </p>
      </PortalCard>
    </div>
  );
}

export function SupportView() {
  return (
    <div className="space-y-6">
      <PortalPageHeader title="Suporte" subtitle="Precisa de ajuda? Estamos aqui para você." />

      <div className="grid gap-4 md:grid-cols-2">
        <PortalCard title="WhatsApp">
          <p className="text-sm text-zinc-400">
            Fale diretamente com nossa equipe para dúvidas sobre licenças e acesso.
          </p>
          <Link
            href={whatsappUrl("Olá! Preciso de suporte na área do cliente.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#00e68a]"
          >
            <MessageCircle className="h-4 w-4" />
            Abrir WhatsApp
          </Link>
        </PortalCard>

        <PortalCard title="FAQ">
          <p className="text-sm text-zinc-400">Consulte as perguntas frequentes sobre pools VIP e Allavsoft.</p>
          <Link
            href="/#faq"
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00ff9d] hover:underline"
          >
            Ver FAQ no site →
          </Link>
        </PortalCard>
      </div>
    </div>
  );
}
