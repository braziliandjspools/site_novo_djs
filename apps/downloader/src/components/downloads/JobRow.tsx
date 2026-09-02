import { CheckCircle2, Download, Loader2, MonitorDown, XCircle } from "lucide-react";
import type { DownloadJob } from "../../lib/api/jobs";

type JobRowProps = {
  job: DownloadJob;
  isActive: boolean;
};

function formatBytes(value: string | null | undefined) {
  if (!value) return "—";
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status: string) {
  switch (status) {
    case "PENDING":
    case "RECEIVED":
      return "Na fila";
    case "DOWNLOADING":
      return "Baixando";
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
  if (status === "PENDING" || status === "RECEIVED") {
    return <MonitorDown className="h-4 w-4 text-zinc-500" />;
  }
  return <Download className="h-4 w-4 text-zinc-500" />;
}

export function JobRow({ job, isActive }: JobRowProps) {
  const waiting = job.status === "PENDING" || job.status === "RECEIVED";
  const downloading = job.status === "DOWNLOADING" || isActive;

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
                    : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {statusLabel(job.status)}
            </span>
          </div>

          {waiting && <p className="mt-1 text-xs text-zinc-500">Aguardando download</p>}
          {downloading && !waiting && (
            <p className="mt-1 text-xs text-[#1ed760]">Baixando arquivo…</p>
          )}
          {job.status === "COMPLETED" && (
            <p className="mt-1 text-xs text-zinc-500">Download concluído</p>
          )}

          {job.relativePath && (
            <p className="mt-1 truncate text-xs text-zinc-600">{job.relativePath}</p>
          )}

          {downloading && (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[#1ed760] transition-all duration-300"
                  style={{ width: `${Math.max(job.progress, isActive ? 3 : 0)}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                <span>{job.progress}%</span>
                <span>
                  {formatBytes(job.downloadedBytes)}
                  {job.totalBytes ? ` / ${formatBytes(job.totalBytes)}` : ""}
                </span>
              </div>
            </div>
          )}

          {job.status === "FAILED" && job.error && (
            <p className="mt-2 text-xs text-red-400">{job.error}</p>
          )}
        </div>
      </div>
    </article>
  );
}
