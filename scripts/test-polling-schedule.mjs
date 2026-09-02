/**
 * Testes do agendador de polling adaptativo.
 * Uso: node scripts/test-polling-schedule.mjs
 */

const POLL_MS = {
  FAST: 2_500,
  ACTIVE: 7_000,
  FOREGROUND_IDLE: 3_000,
  BACKGROUND_IDLE: 25_000,
};

function computePollDelayMs(context) {
  if (context.hasPendingJobs || context.now < context.burstUntil) return POLL_MS.FAST;
  if (context.hasActiveDeviceJobs) return POLL_MS.ACTIVE;
  if (context.queueIsEmpty) {
    return context.isDocumentVisible ? POLL_MS.FOREGROUND_IDLE : POLL_MS.BACKGROUND_IDLE;
  }
  return POLL_MS.ACTIVE;
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: esperado ${expected}, recebido ${actual}`);
}

const now = Date.now();

assertEqual(
  computePollDelayMs({
    now,
    burstUntil: now + 60_000,
    hasPendingJobs: false,
    hasActiveDeviceJobs: false,
    isDocumentVisible: true,
    queueIsEmpty: true,
  }),
  POLL_MS.FAST,
  "burst ativo",
);

assertEqual(
  computePollDelayMs({
    now,
    burstUntil: 0,
    hasPendingJobs: true,
    hasActiveDeviceJobs: false,
    isDocumentVisible: true,
    queueIsEmpty: false,
  }),
  POLL_MS.FAST,
  "job pending",
);

assertEqual(
  computePollDelayMs({
    now,
    burstUntil: 0,
    hasPendingJobs: false,
    hasActiveDeviceJobs: true,
    isDocumentVisible: true,
    queueIsEmpty: false,
  }),
  POLL_MS.ACTIVE,
  "job ativo no dispositivo",
);

assertEqual(
  computePollDelayMs({
    now,
    burstUntil: 0,
    hasPendingJobs: false,
    hasActiveDeviceJobs: false,
    isDocumentVisible: true,
    queueIsEmpty: true,
  }),
  POLL_MS.FOREGROUND_IDLE,
  "fila vazia em primeiro plano",
);

assertEqual(
  computePollDelayMs({
    now,
    burstUntil: 0,
    hasPendingJobs: false,
    hasActiveDeviceJobs: false,
    isDocumentVisible: false,
    queueIsEmpty: true,
  }),
  POLL_MS.BACKGROUND_IDLE,
  "fila vazia em segundo plano",
);

console.log("✓ polling-schedule OK");
