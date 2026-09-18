/**
 * Limites de abuso de download.
 * Plano Teste: teto baixo (evitar esvaziar o acervo nos 3 dias).
 * VIP pago: só trava padrão de loop / varredura em massa.
 */

export type DownloadHitKind = "stream" | "proxy" | "job";

export type AbuseThresholds = {
  /** Faixas únicas na janela → alerta. */
  uniqueAlert: number;
  /** Faixas únicas na janela → ban. */
  uniqueBan: number;
  /** Janela para contagem de únicas (ms). */
  uniqueWindowMs: number;
  /** Mesmo fileId repetido na janela → alerta. */
  loopAlert: number;
  /** Mesmo fileId repetido na janela → ban. */
  loopBan: number;
  /** Janela do loop (ms). */
  loopWindowMs: number;
  /** Hits totais (não únicos) por hora → alerta. */
  burstAlert: number;
  /** Hits totais por hora → ban. */
  burstBan: number;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Plano Teste (brs-drive-3d): uso agressivo = intenção de só “provar” baixando tudo. */
export const TEST_PLAN_ABUSE_THRESHOLDS: AbuseThresholds = {
  uniqueAlert: 40,
  uniqueBan: 80,
  uniqueWindowMs: 3 * DAY,
  loopAlert: 3,
  loopBan: 6,
  loopWindowMs: DAY,
  burstAlert: 30,
  burstBan: 55,
};

/** VIP pago: alerta/ban só em varredura absurda ou loop do mesmo arquivo. */
export const PAID_PLAN_ABUSE_THRESHOLDS: AbuseThresholds = {
  uniqueAlert: 800,
  uniqueBan: 2500,
  uniqueWindowMs: DAY,
  loopAlert: 5,
  loopBan: 12,
  loopWindowMs: DAY,
  burstAlert: 400,
  burstBan: 900,
};

/** Não grava hit duplicado do mesmo arquivo/kind neste intervalo (Range do player). */
export const HIT_DEDUPE_MS = 5 * 60 * 1000;

export const ABUSE_CODES = {
  BANNED: "DOWNLOAD_ABUSE_BANNED",
  ALERT: "DOWNLOAD_ABUSE_ALERT",
} as const;

export function abuseMessageBanned(reason: string) {
  return `Downloads bloqueados por uso abusivo. ${reason} Fale com o suporte no WhatsApp se precisar de revisão.`;
}

export function abuseMessageAlert(reason: string) {
  return `Atenção: padrão de download suspeito detectado. ${reason} Continuar pode bloquear sua conta.`;
}

export type AbuseCounters = {
  uniqueInWindow: number;
  burstInHour: number;
  maxFileRepeats: number;
};

/** Avaliação pura (testável) a partir de contadores. */
export function evaluateAbuseCounters(
  counters: AbuseCounters,
  thresholds: AbuseThresholds,
  onTestPlan: boolean,
): { action: "ok" | "alert" | "ban"; reason: string } {
  const planLabel = onTestPlan ? "Plano Teste" : "VIP";

  if (counters.uniqueInWindow >= thresholds.uniqueBan) {
    return {
      action: "ban",
      reason: `${planLabel}: ${counters.uniqueInWindow} faixas distintas em pouco tempo (limite ${thresholds.uniqueBan}).`,
    };
  }
  if (counters.maxFileRepeats >= thresholds.loopBan) {
    return {
      action: "ban",
      reason: `${planLabel}: mesmo arquivo baixado/tocado ${counters.maxFileRepeats}× (loop).`,
    };
  }
  if (counters.burstInHour >= thresholds.burstBan) {
    return {
      action: "ban",
      reason: `${planLabel}: ${counters.burstInHour} acessos em 1h (limite ${thresholds.burstBan}).`,
    };
  }

  if (counters.uniqueInWindow >= thresholds.uniqueAlert) {
    return {
      action: "alert",
      reason: `${planLabel}: volume alto (${counters.uniqueInWindow} faixas distintas; alerta em ${thresholds.uniqueAlert}).`,
    };
  }
  if (counters.maxFileRepeats >= thresholds.loopAlert) {
    return {
      action: "alert",
      reason: `${planLabel}: possível loop (${counters.maxFileRepeats}× o mesmo arquivo).`,
    };
  }
  if (counters.burstInHour >= thresholds.burstAlert) {
    return {
      action: "alert",
      reason: `${planLabel}: muitos acessos em 1h (${counters.burstInHour}).`,
    };
  }

  return { action: "ok", reason: "" };
}

