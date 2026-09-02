import Link from "next/link";
import { CheckCircle2, Download, ExternalLink, MessageCircle, Music, Sparkles, Video } from "lucide-react";
import { whatsappUrl } from "../../lib/site";
import { CopyField } from "../../components/CopyField";
import { PortalBadge, PortalCard, PortalPageHeader } from "../PortalShell";
import { formatDateBr, type PortalData } from "../portal-types";

export function PoolsServiceView({ data }: { data: PortalData }) {
  if (!data.pools) return null;

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Pools VIP" subtitle="Acervo de pools, remix services e curadoria." />

      <PortalCard title="Detalhes do serviço">
        <div className="mb-4 flex items-center gap-2">
          <PortalBadge>Ativo</PortalBadge>
          <span className="text-xs text-zinc-500">Plano: {data.user.planLabel}</span>
        </div>
        <p className="text-sm leading-relaxed text-zinc-400">
          Acesso completo ao acervo de pools, remix services e curadoria do Brazilian Packs — mais de 400 fontes
          organizadas para DJs.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {["Remix services", "Edits exclusivos", "Atualizações contínuas", "Google Drive + FTP"].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-[#00ff9d]" />
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/musicas/atualizacoes"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#00e68a]"
        >
          Acessar acervo de músicas
          <ExternalLink className="h-4 w-4" />
        </Link>
      </PortalCard>
    </div>
  );
}

export function DeemixServiceView({ data }: { data: PortalData }) {
  if (!data.deemix) return null;
  const { deemix } = data;

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Deemix" subtitle="Download de músicas em alta qualidade." />

      <PortalCard title="Status do serviço">
        <PortalBadge>Ativo</PortalBadge>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {["Downloads ilimitados", "FLAC/MP3 320kbps", "ARL Premium", "Suporte técnico"].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-[#00ff9d]" />
              {item}
            </li>
          ))}
        </ul>
      </PortalCard>

      <PortalCard title="Credenciais de acesso">
        <p className="mb-4 text-sm text-zinc-500">Use as credenciais abaixo no Deemix:</p>
        <div className="space-y-4">
          <CopyField label="ARL Premium (320 kbps)" value={deemix.arl320} variant="purple" theme="dark" compact />
          <CopyField label="ARL (128 kbps)" value={deemix.arl128} variant="purple" theme="dark" compact />
        </div>
        {deemix.downloadUrl && (
          <a
            href={deemix.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:border-[#00ff9d]/40 hover:text-[#00ff9d]"
          >
            <Download className="h-4 w-4" />
            Baixar Deemix
          </a>
        )}
      </PortalCard>

      <PortalCard title="Configurações do Spotify (se necessário)">
        <p className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
          <Music className="h-4 w-4" />
          Preencha apenas se o Deemix solicitar integração com Spotify.
        </p>
        <div className="space-y-4">
          <CopyField label="Client ID" value={deemix.spotify.clientId} variant="blue" theme="dark" compact />
          <CopyField label="Client Secret" value={deemix.spotify.clientSecret} variant="blue" theme="dark" compact />
          <CopyField label="User" value={deemix.spotify.user} variant="blue" theme="dark" mono={false} compact />
        </div>
      </PortalCard>
    </div>
  );
}

export function AllavsoftServiceView({ data }: { data: PortalData }) {
  if (!data.allavsoft) return null;
  const { allavsoft, user } = data;

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Allavsoft" subtitle="Download universal de vídeos e áudios." />

      <PortalCard title="Status do serviço">
        <PortalBadge variant="amber">Disponível em {formatDateBr(allavsoft.availableFrom)}</PortalBadge>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          O Allavsoft estará disponível a partir de {allavsoft.launchLabel.toLowerCase()}. Ferramenta completa para
          download de vídeos e áudios de +1000 sites.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            "YouTube, Vimeo e mais",
            "Extração de áudio HQ",
            "Downloads em lote",
            "Conversão de formatos",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
              <Video className="h-4 w-4 text-amber-400" />
              {item}
            </li>
          ))}
        </ul>
      </PortalCard>

      {user.plan === "VIP" && (
        <PortalCard title="Benefício VIP">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[#FFDF00]" />
            <div>
              <p className="text-sm text-zinc-400">
                Como cliente VIP, você terá acesso prioritário com desconto ao Allavsoft no lançamento.
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-400">Lançamento: {allavsoft.launchLabel}</p>
            </div>
          </div>
        </PortalCard>
      )}
    </div>
  );
}

export function AccountView({ data }: { data: PortalData }) {
  const { user } = data;

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Minha Conta" subtitle="Informações do seu cadastro e assinatura." />

      <PortalCard title="Dados pessoais">
        <dl className="grid gap-4 sm:grid-cols-2">
          {[
            ["Nome completo", user.name],
            ["E-mail", user.email],
            ["WhatsApp", user.whatsapp],
            ["Plano", user.planLabel],
            ["Dia do vencimento", `Todo dia ${user.dueDay} de cada mês`],
            ["Próximo vencimento", formatDateBr(user.nextDueAt)],
            ["Cliente desde", formatDateBr(user.createdAt)],
            ["Status", user.active ? "Ativo" : "Inativo"],
          ].map(([label, value]) => (
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
          <p className="text-sm text-zinc-400">Consulte as perguntas frequentes sobre pools, Deemix e Allavsoft.</p>
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
