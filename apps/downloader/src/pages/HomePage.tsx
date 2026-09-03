import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  History,
  ListOrdered,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";
import { BrsLogo } from "../components/Branding/BrsLogo";
import { Button } from "../components/ui/Button";
import { useDownloadManager } from "../context/DownloadManagerContext";
import { openPlatform } from "../lib/open-site";
import { SITE_NAME } from "../lib/site";
import type { AppRoute } from "../components/layout/Sidebar";
import type { DownloadJob } from "../lib/api/jobs";

type HomePageProps = {
  userName: string;
  onNavigate: (route: AppRoute) => void;
};

function countByStatus(jobs: DownloadJob[], activeJobIds: number[]) {
  const downloading = jobs.filter(
    (job) => job.status === "DOWNLOADING" || job.status === "PAUSED" || activeJobIds.includes(job.id),
  ).length;
  const queue = jobs.filter(
    (job) => job.status === "PENDING" || job.status === "RECEIVED" || job.status === "FAILED",
  ).length;
  const completed = jobs.filter((job) => job.status === "COMPLETED").length;
  return { downloading, queue, completed, total: jobs.length };
}

const QUICK_LINKS: {
  route: AppRoute;
  label: string;
  description: string;
  icon: typeof Download;
}[] = [
  {
    route: "downloads",
    label: "Downloads",
    description: "Acompanhe o que está baixando agora.",
    icon: Download,
  },
  {
    route: "queue",
    label: "Fila",
    description: "Itens aguardando ou prontos para iniciar.",
    icon: ListOrdered,
  },
  {
    route: "completed",
    label: "Concluídos",
    description: "Arquivos finalizados e sincronizados.",
    icon: CheckCircle2,
  },
  {
    route: "history",
    label: "Histórico",
    description: "Revise falhas e reenvie quando precisar.",
    icon: History,
  },
  {
    route: "settings",
    label: "Configurações",
    description: "Conta, pasta de destino e preferências.",
    icon: Settings,
  },
];

export function HomePage({ userName, onNavigate }: HomePageProps) {
  const { jobs, connectionState, activeJobIds, pendingCount, syncNow, workerError } = useDownloadManager();
  const firstName = userName.split(" ")[0] ?? userName;
  const counts = countByStatus(jobs, activeJobIds);
  const isOffline = connectionState === "offline";
  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1a1a]">
        <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <BrsLogo className="mb-5 h-12 w-auto max-w-[280px] object-contain object-left sm:h-14" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1db954]">Bem-vindo de volta</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Olá, <span className="text-[#1db954]">{firstName}</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
              Adicione músicas pelo {SITE_NAME}, acompanhe a fila aqui e mantenha seu acervo sempre atualizado.
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            <Button onClick={() => void openPlatform()}>
              <ExternalLink className="h-4 w-4" />
              Abrir plataforma
            </Button>
            <Button variant="secondary" onClick={syncNow}>
              <RefreshCw className="h-4 w-4" />
              Sincronizar
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Em download" value={counts.downloading} hint={`${activeJobIds.length} ativo(s) agora`} />
        <StatCard label="Na fila" value={counts.queue || pendingCount} hint="Aguardando ou com falha" />
        <StatCard label="Concluídos" value={counts.completed} hint="Nesta sessão sincronizada" />
        <StatCard
          label="Conexão"
          value={isOffline ? "Offline" : "Online"}
          hint={isOffline ? "Fila salva localmente" : "Sincronizando com o site"}
          valueClassName={isOffline ? "text-amber-400" : "text-[#1db954]"}
        />
      </div>

      {(isOffline || workerError) && (
        <div
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
            isOffline
              ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
              : "border-red-500/20 bg-red-500/10 text-red-300"
          }`}
        >
          {isOffline ? <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <Wifi className="mt-0.5 h-4 w-4 flex-shrink-0" />}
          <p>{isOffline ? "Sem internet no momento. A fila será sincronizada quando a conexão voltar." : workerError}</p>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1db954]">Menu</p>
            <h2 className="text-lg font-bold text-white">Acesso rápido</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ route, label, description, icon: Icon }) => {
            const badge =
              route === "downloads"
                ? counts.downloading
                : route === "queue"
                  ? counts.queue
                  : route === "completed"
                    ? counts.completed
                    : 0;

            return (
              <button
                key={route}
                type="button"
                onClick={() => onNavigate(route)}
                className="group flex min-h-[128px] flex-col rounded-2xl border border-white/[0.06] bg-[#1f1f1f] p-4 text-left transition-colors hover:border-[#1db954]/40 hover:bg-[#222]"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1db954]/10 text-[#1db954]">
                    <Icon className="h-5 w-5" />
                  </div>
                  {badge > 0 && (
                    <span className="rounded-md bg-[#1db954] px-2 py-0.5 text-[10px] font-bold text-black">
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-white">{label}</h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-500">{description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1db954] opacity-0 transition-opacity group-hover:opacity-100">
                  Abrir
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1a1a]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Atividade recente</p>
            <h2 className="text-base font-bold text-white">Últimos itens na fila</h2>
          </div>
          {jobs.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate("queue")}
              className="text-xs font-semibold text-[#1db954] hover:underline"
            >
              Ver fila completa
            </button>
          )}
        </div>
        {recentJobs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-zinc-500">Nenhum item ainda. Abra a plataforma e adicione músicas à fila.</p>
            <Button className="mt-4" onClick={() => void openPlatform()}>
              <ExternalLink className="h-4 w-4" />
              Abrir plataforma
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {recentJobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{job.fileName}</p>
                  <p className="truncate text-xs text-zinc-500">{job.relativePath ?? job.provider}</p>
                </div>
                <span className="flex-shrink-0 rounded-md bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                  {job.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  valueClassName = "text-white",
}: {
  label: string;
  value: string | number;
  hint: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#1f1f1f] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${valueClassName}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
