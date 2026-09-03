import {
  CheckCircle2,
  Download,
  Loader2,
  MonitorDown,
  Pause,
  Play,
  RotateCcw,
  X,
  XCircle,
} from "lucide-react";
import type { DownloadJob } from "../../lib/api/jobs";
import type { JobProgressMetrics } from "../../lib/download/types";
import { formatBytes, formatEta, formatSpeed } from "../../lib/download/progress-tracker";
import { Button } from "../ui/Button";

type JobRowProps = {
  job: DownloadJob;
  isActive: boolean;
  metrics?: JobProgressMetrics;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
};

function statusLabel(status: string) {
  switch (status) {
    case "PENDING":
    case "RECEIVED":
      return "Enviado para PC";
    case "DOWNLOADING":
      return "Baixando";
    case "PAUSED":
      return "Pausado";
    case "COMPLETED":
      return "Concluído";
    case "FAILED":
      return "Falhou";
    default:
      return status;
  }
}

function StatusIcon({ status, isActive }: { status: string; isActive: boolean }) {
  if (isActive || status === "DOWNLOADING") {
    return <Loader2 className="h-4 w-4 animate-spin text-[#1ed760]" />;
  }
  if (status === "COMPLETED") {
    return <CheckCircle2 className="h-4 w-4 text-[#1ed760]" />;
  }
  if (status === "FAILED") {
    return <XCircle className="h-4 w-4 text-red-400" />;
  }
  if (status === "PAUSED") {
    return <Pause className="h-4 w-4 text-amber-400" />;
  }
  if (status === "PENDING" || status === "RECEIVED") {
    return <MonitorDown className="h-4 w-4 text-zinc-500" />;
  }
  return <Download className="h-4 w-4 text-zinc-500" />;
}

export function JobRow({ job, isActive, metrics, onPause, onResume, onCancel, onRetry }: JobRowProps) {
  const waiting = job.status === "PENDING" || job.status === "RECEIVED";
  const downloading = job.status === "DOWNLOADING" || isActive;
  const paused = job.status === "PAUSED";
  const failed = job.status === "FAILED";
  const progress = Math.max(job.progress, downloading ? 3 : 0);

  return (
    <article className="rounded-lg border border-zinc-800 bg-[#181818]/80 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-black/50">
          <StatusIcon status={job.status} isActive={isActive} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">{job.fileName}</p>
            <span
              className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${
                job.status === "COMPLETED"
                  ? "bg-[#1ed760]/10 text-[#1ed760]"
                  : job.status === "FAILED"
                    ? "bg-red-500/10 text-red-400"
                    : job.status === "PAUSED"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {statusLabel(job.status)}
            </span>
          </div>

          {waiting && <p className="mt-1 text-xs text-zinc-500">Aguardando download</p>}
          {paused && <p className="mt-1 text-xs text-amber-400">Download pausado</p>}

          {job.relativePath && (
            <p className="mt-1 truncate text-xs text-zinc-600">{job.relativePath}</p>
          )}

          {(downloading || paused) && (
            <div className="mt-3 space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[#1ed760] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                <span className="font-semibold text-zinc-300">{progress}%</span>
                <span>
                  {formatBytes(job.downloadedBytes)}
                  {job.totalBytes ? ` / ${formatBytes(job.totalBytes)}` : ""}
                </span>
              </div>
              {downloading && metrics && (
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                  <span>{formatSpeed(metrics.speedBytesPerSec)}</span>
                  <span>{formatEta(metrics.etaSeconds)}</span>
                </div>
              )}
            </div>
          )}

          {job.status === "COMPLETED" && (
            <p className="mt-1 text-xs text-zinc-500">Download concluído</p>
          )}

          {failed && job.error && <p className="mt-2 text-xs text-red-400">{job.error}</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            {downloading && onPause && (
              <Button variant="secondary" className="!h-8 !px-3 !text-[11px]" onClick={onPause}>
                <Pause className="h-3.5 w-3.5" />
                Pausar
              </Button>
            )}
            {paused && onResume && (
              <Button variant="secondary" className="!h-8 !px-3 !text-[11px]" onClick={onResume}>
                <Play className="h-3.5 w-3.5" />
                Retomar
              </Button>
            )}
            {!failed && job.status !== "COMPLETED" && onCancel && (
              <Button variant="ghost" className="!h-8 !px-3 !text-[11px] text-zinc-400" onClick={onCancel}>
                <X className="h-3.5 w-3.5" />
                Cancelar
              </Button>
            )}
            {failed && onRetry && (
              <Button variant="secondary" className="!h-8 !px-3 !text-[11px]" onClick={onRetry}>
                <RotateCcw className="h-3.5 w-3.5" />
                Tentar novamente
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
