/** Intervalos de polling adaptativo (Neon-friendly). */
export const POLL_MS = {
  /** Consulta imediata ao conectar ou reconectar. */
  IMMEDIATE: 0,
  /** Jobs PENDING ou janela de burst após novo envio/conexão. */
  FAST: 2_500,
  /** Jobs RECEIVED/ativos neste dispositivo. */
  ACTIVE: 7_000,
  /** Fila vazia com app em primeiro plano. */
  FOREGROUND_IDLE: 3_000,
  /** Fila vazia com app em segundo plano. */
  BACKGROUND_IDLE: 25_000,
} as const;

export const HEARTBEAT_MS = 60_000;
export const CONNECT_BURST_MS = 120_000;
export const NEW_JOB_BURST_MS = 60_000;

export type PollContext = {
  now: number;
  burstUntil: number;
  hasPendingJobs: boolean;
  hasActiveDeviceJobs: boolean;
  isDocumentVisible: boolean;
  queueIsEmpty: boolean;
};

export function computePollDelayMs(context: PollContext): number {
  if (context.hasPendingJobs || context.now < context.burstUntil) {
    return POLL_MS.FAST;
  }
  if (context.hasActiveDeviceJobs) {
    return POLL_MS.ACTIVE;
  }
  if (context.queueIsEmpty) {
    return context.isDocumentVisible ? POLL_MS.FOREGROUND_IDLE : POLL_MS.BACKGROUND_IDLE;
  }
  return POLL_MS.ACTIVE;
}
