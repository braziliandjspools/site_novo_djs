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
  accent: string;
}[] = [
  {
    route: "downloads",
    label: "Downloads",
    description: "Acompanhe o que está baixando agora.",
    icon: Download,
    accent: "from-emerald-600/20 to-emerald-950/40 border-emerald-500/30",
  },
  {
    route: "queue",
    label: "Fila",
    description: "Itens aguardando ou prontos para iniciar.",
    icon: ListOrdered,
    accent: "from-sky-600/20 to-sky-950/40 border-sky-500/30",
  },
  {
    route: "completed",
    label: "Concluídos",
    description: "Arquivos finalizados e sincronizados.",
    icon: CheckCircle2,
    accent: "from-violet-600/20 to-violet-950/40 border-violet-500/30",
  },
  {
    route: "history",
    label: "Histórico",
    description: "Revise falhas e reenvie quando precisar.",
    icon: History,
    accent: "from-amber-600/20 to-amber-950/40 border-amber-500/30",
  },
  {
    route: "settings",
    label: "Configurações",
    description: "Conta, pasta de destino e preferências.",
    icon: Settings,
    accent: "from-zinc-600/20 to-zinc-950/40 border-zinc-500/30",
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
      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-[#1a3264]/40 via-[#181818] to-[#121212]">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <BrsLogo className="mb-4 h-12 w-auto max-w-[280px] object-contain object-left sm:h-14" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1ed760]">Bem-vindo de volta</p>
            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              Olá, <span className="text-[#1ed760]">{firstName}</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
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
          valueClassName={isOffline ? "text-amber-400" : "text-[#1ed760]"}
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
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1ed760]">Menu</p>
            <h2 className="text-lg font-bold text-white">Acesso rápido</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ route, label, description, icon: Icon, accent }) => {
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
                className={`group flex min-h-[132px] flex-col rounded-xl border bg-gradient-to-br p-4 text-left transition-transform hover:scale-[1.01] ${accent}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/30">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {badge > 0 && (
                    <span className="rounded-full bg-[#1ed760] px-2.5 py-0.5 text-[10px] font-black text-black">
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white">{label}</h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-400">{description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1ed760] opacity-0 transition-opacity group-hover:opacity-100">
                  Abrir
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-[#181818]/60">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Atividade recente</p>
            <h2 className="text-base font-bold text-white">Últimos itens na fila</h2>
          </div>
          {jobs.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate("queue")}
              className="text-xs font-semibold text-[#1ed760] hover:underline"
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
          <ul className="divide-y divide-zinc-800">
            {recentJobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{job.fileName}</p>
                  <p className="truncate text-xs text-zinc-500">{job.relativePath ?? job.provider}</p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-300">
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
    <div className="rounded-xl border border-zinc-800 bg-[#181818]/80 px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${valueClassName}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
