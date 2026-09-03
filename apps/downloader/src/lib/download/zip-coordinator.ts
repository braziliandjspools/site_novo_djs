import {
  buildZipPlan,
  packStillHasActiveJobs,
  resolveArchivePath,
  resolvePackKey,
  type ZipPackFile,
  type ZipPackPlan,
} from "./zip-pack";

export type ZipTaskStatus = "queued" | "compressing" | "completed" | "failed" | "cancelled";

export type ZipTask = {
  id: string;
  packKey: string;
  name: string;
  status: ZipTaskStatus;
  progress: number;
  done: number;
  total: number;
  zipPath: string | null;
  error: string | null;
  message: string;
};

export type ZipProgressEvent = {
  taskId: string;
  done: number;
  total: number;
  percent: number;
  phase: string;
  currentFile?: string | null;
};

type PendingPack = {
  packKey: string;
  files: ZipPackFile[];
};

type CreateZipFn = (input: {
  taskId: string;
  zipName: string;
  files: { absolutePath: string; archivePath: string }[];
}) => Promise<{ zipPath: string; fileCount: number; cancelled: boolean }>;

type CancelZipFn = (taskId: string) => Promise<boolean>;

/**
 * Acumula arquivos concluídos por pack e dispara uma compactação por vez
 * quando não restam jobs ativos daquele pack.
 */
export class ZipCoordinator {
  private enabled = false;
  private pending = new Map<string, PendingPack>();
  private queue: ZipPackPlan[] = [];
  private tasks = new Map<string, ZipTask>();
  private lastPlans = new Map<string, ZipPackPlan>();
  private runningTaskId: string | null = null;
  private createZip: CreateZipFn;
  private cancelZip: CancelZipFn;
  private onChange: () => void;
  private drainPromise: Promise<void> | null = null;

  constructor(options: {
    createZip: CreateZipFn;
    cancelZip: CancelZipFn;
    onChange: () => void;
  }) {
    this.createZip = options.createZip;
    this.cancelZip = options.cancelZip;
    this.onChange = options.onChange;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  listTasks(): ZipTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => {
      const order = (s: ZipTaskStatus) =>
        s === "compressing" || s === "queued" ? 0 : s === "failed" ? 1 : 2;
      return order(a.status) - order(b.status) || a.name.localeCompare(b.name, "pt-BR");
    });
  }

  applyProgress(event: ZipProgressEvent) {
    const task = this.tasks.get(event.taskId);
    if (!task || (task.status !== "compressing" && task.status !== "queued")) return;
    task.status = "compressing";
    task.done = event.done;
    task.total = event.total;
    task.progress = event.percent;
    if (event.percent > 0) {
      task.message = `Compactando... ${event.percent}%`;
    } else if (event.total > 0) {
      task.message = `Compactando ${event.done} de ${event.total} arquivos...`;
    } else {
      task.message = "Compactando arquivos...";
    }
    this.onChange();
  }

  /**
   * Registra um arquivo baixado com sucesso. Se o pack estiver livre,
   * enfileira a compactação.
   */
  recordCompleted(input: {
    jobId: number;
    fileName: string;
    relativePath: string | null;
    absolutePath: string;
    activeJobs: Iterable<{ relativePath: string | null; fileName: string; status: string }>;
  }) {
    if (!this.enabled) return;
    if (!input.absolutePath?.trim()) return;

    const packKey = resolvePackKey(input.relativePath, input.fileName);
    const archivePath = resolveArchivePath(input.relativePath, input.absolutePath, input.fileName);
    const entry: ZipPackFile = {
      jobId: input.jobId,
      absolutePath: input.absolutePath,
      archivePath,
    };

    const bucket = this.pending.get(packKey) ?? { packKey, files: [] };
    const existingIdx = bucket.files.findIndex((f) => f.jobId === input.jobId);
    if (existingIdx >= 0) bucket.files[existingIdx] = entry;
    else bucket.files.push(entry);
    this.pending.set(packKey, bucket);

    this.maybeEnqueuePack(packKey, input.activeJobs);
  }

  /** Reavalia packs pendentes (ex.: após falha/dismiss/cancel de outros jobs). */
  reevaluate(activeJobs: Iterable<{ relativePath: string | null; fileName: string; status: string }>) {
    if (!this.enabled) return;
    for (const packKey of Array.from(this.pending.keys())) {
      this.maybeEnqueuePack(packKey, activeJobs);
    }
  }

  private maybeEnqueuePack(
    packKey: string,
    activeJobs: Iterable<{ relativePath: string | null; fileName: string; status: string }>,
  ) {
    if (packStillHasActiveJobs(packKey, activeJobs)) return;
    const bucket = this.pending.get(packKey);
    if (!bucket) return;
    const plan = buildZipPlan(packKey, bucket.files);
    this.pending.delete(packKey);
    if (!plan) return;
    if (this.queue.some((q) => q.packKey === packKey) || this.runningTaskId === packKey) return;
    if (this.tasks.get(packKey)?.status === "compressing") return;

    this.queue.push(plan);
    this.tasks.set(packKey, {
      id: packKey,
      packKey,
      name: plan.zipName,
      status: "queued",
      progress: 0,
      done: 0,
      total: plan.files.length,
      zipPath: null,
      error: null,
      message: "Aguardando compactação...",
    });
    this.onChange();
    void this.drain();
  }

  async cancelTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    if (task.status === "queued") {
      this.queue = this.queue.filter((q) => q.packKey !== taskId);
      task.status = "cancelled";
      task.message = "Compactação cancelada";
      this.onChange();
      return;
    }
    if (task.status === "compressing") {
      await this.cancelZip(taskId);
    }
  }

  dismissTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    if (task.status === "compressing" || task.status === "queued") return;
    this.tasks.delete(taskId);
    this.lastPlans.delete(taskId);
    this.onChange();
  }

  retryTask(taskId: string) {
    const task = this.tasks.get(taskId);
    const plan = this.lastPlans.get(taskId);
    if (!task || task.status !== "failed" || !plan) return;
    if (this.queue.some((q) => q.packKey === taskId) || this.runningTaskId === taskId) return;
    this.queue.push(plan);
    task.status = "queued";
    task.progress = 0;
    task.done = 0;
    task.error = null;
    task.zipPath = null;
    task.message = "Aguardando compactação...";
    this.onChange();
    void this.drain();
  }

  private async drain() {
    if (this.drainPromise) return this.drainPromise;
    this.drainPromise = (async () => {
      while (this.queue.length > 0) {
        const plan = this.queue.shift()!;
        await this.runPlan(plan);
      }
    })().finally(() => {
      this.drainPromise = null;
      if (this.queue.length > 0) void this.drain();
    });
    return this.drainPromise;
  }

  private async runPlan(plan: ZipPackPlan) {
    const taskId = plan.packKey;
    this.runningTaskId = taskId;
    this.lastPlans.set(taskId, plan);
    const task = this.tasks.get(taskId) ?? {
      id: taskId,
      packKey: plan.packKey,
      name: plan.zipName,
      status: "queued" as const,
      progress: 0,
      done: 0,
      total: plan.files.length,
      zipPath: null,
      error: null,
      message: "Compactando arquivos...",
    };
    task.status = "compressing";
    task.message = "Compactando arquivos...";
    task.total = plan.files.length;
    task.error = null;
    this.tasks.set(taskId, task);
    this.onChange();

    try {
      const result = await this.createZip({
        taskId,
        zipName: plan.zipName,
        files: plan.files.map((f) => ({
          absolutePath: f.absolutePath,
          archivePath: f.archivePath,
        })),
      });

      if (result.cancelled) {
        task.status = "cancelled";
        task.message = "Compactação cancelada";
        task.zipPath = null;
        task.error = null;
      } else {
        task.status = "completed";
        task.progress = 100;
        task.done = result.fileCount;
        task.total = result.fileCount;
        task.zipPath = result.zipPath;
        task.message = "Concluído";
        task.error = null;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível criar o arquivo ZIP. Seus arquivos baixados foram mantidos.";
      task.status = "failed";
      task.error = message;
      task.message = message;
      task.zipPath = null;
    } finally {
      this.runningTaskId = null;
      this.onChange();
    }
  }
}
