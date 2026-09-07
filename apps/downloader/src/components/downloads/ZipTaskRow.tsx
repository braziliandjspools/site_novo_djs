import { Archive, CheckCircle2, FolderOpen, Loader2, RotateCcw, X, XCircle } from "lucide-react";
import type { ZipTask } from "../../lib/download/zip-coordinator";
import { Button } from "../ui/Button";
import { useLocale, type MessageKey } from "../../i18n/LocaleContext";

type ZipTaskRowProps = {
  task: ZipTask;
  onCancel?: () => void;
  onDismiss?: () => void;
  onRetry?: () => void;
  onOpenZip?: () => void;
  onOpenFolder?: () => void;
};

/** Retorna a chave de tradução do status, ou null quando o status é desconhecido. */
function statusLabelKey(task: ZipTask): MessageKey | null {
  switch (task.status) {
    case "queued":
      return "jobsFilterQueued";
    case "compressing":
      return "zipStatusRunning";
    case "completed":
      return "jobsStatusCompleted";
    case "failed":
      return "jobsStatusFailed";
    case "cancelled":
      return "zipStatusCancelled";
    default:
      return null;
  }
}

export function ZipTaskRow({
  task,
  onCancel,
  onDismiss,
  onRetry,
  onOpenZip,
  onOpenFolder,
}: ZipTaskRowProps) {
  const { t } = useLocale();
  const active = task.status === "compressing" || task.status === "queued";
  const progress = Math.min(100, Math.max(0, task.progress || 0));
  const statusKey = statusLabelKey(task);

  return (
    <article className="rounded-2xl border border-white/[0.06] bg-[#1f1f1f] px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1db954]/10">
          {active ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#1db954]" />
          ) : task.status === "completed" ? (
            <CheckCircle2 className="h-4 w-4 text-[#1db954]" />
          ) : task.status === "failed" ? (
            <XCircle className="h-4 w-4 text-red-400" />
          ) : (
            <Archive className="h-4 w-4 text-zinc-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-white">{task.name}.zip</p>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                task.status === "completed"
                  ? "bg-[#1db954]/15 text-[#1db954]"
                  : task.status === "failed"
                    ? "bg-red-500/15 text-red-400"
                    : active
                      ? "bg-[#1db954]/10 text-[#1db954]"
                      : "bg-white/5 text-zinc-400"
              }`}
            >
              {statusKey ? t(statusKey) : task.status}
            </span>
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            {active ? task.message || t("zipCompressingFiles") : task.message}
          </p>

          {active && (
            <div className="mt-3 space-y-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#1db954] transition-[width] duration-300 ease-out"
                  style={{ width: `${Math.max(progress, 1)}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                <span className="font-semibold text-zinc-200">
                  {progress > 0 ? `${progress}%` : t("zipCompressingFiles")}
                </span>
                {task.total > 0 && (
                  <span>{t("zipFilesProgress", { done: task.done, total: task.total })}</span>
                )}
              </div>
            </div>
          )}

          {task.status === "failed" && task.error && (
            <p className="mt-2 text-xs text-red-400">{task.error}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {active && onCancel && (
              <Button variant="ghost" className="!h-8 !px-3 !text-[11px] text-zinc-400" onClick={onCancel}>
                <X className="h-3.5 w-3.5" />
                {t("jobsActionCancel")}
              </Button>
            )}
            {task.status === "completed" && onOpenZip && (
              <Button variant="secondary" className="!h-8 !px-3 !text-[11px]" onClick={onOpenZip}>
                <Archive className="h-3.5 w-3.5" />
                {t("zipOpenZip")}
              </Button>
            )}
            {task.status === "completed" && onOpenFolder && (
              <Button variant="ghost" className="!h-8 !px-3 !text-[11px] text-zinc-400" onClick={onOpenFolder}>
                <FolderOpen className="h-3.5 w-3.5" />
                {t("jobsActionOpenFolder")}
              </Button>
            )}
            {task.status === "failed" && onRetry && (
              <Button variant="secondary" className="!h-8 !px-3 !text-[11px]" onClick={onRetry}>
                <RotateCcw className="h-3.5 w-3.5" />
                {t("jobsActionRetry")}
              </Button>
            )}
            {(task.status === "failed" || task.status === "cancelled" || task.status === "completed") &&
              onDismiss && (
                <Button
                  variant="ghost"
                  className="!h-8 !px-3 !text-[11px] text-zinc-400"
                  onClick={onDismiss}
                >
                  <X className="h-3.5 w-3.5" />
                  {t("zipHide")}
                </Button>
              )}
          </div>
        </div>
      </div>
    </article>
  );
}
