/** Converte "HH:MM" em minutos desde 00:00. */
export function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Normaliza para "HH:MM". Fallback usado se inválido. */
export function normalizeTimeInput(value: string, fallback: string): string {
  const minutes = parseTimeToMinutes(value);
  if (minutes === null) {
    const fb = parseTimeToMinutes(fallback);
    const safe = fb ?? 0;
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * Janela inclusiva no início e exclusiva no fim.
 * Suporta intervalo que atravessa meia-noite (ex.: 23:00 → 06:00).
 * Se início === fim, trata como dia inteiro liberado.
 */
export function isWithinDownloadWindow(
  now: Date,
  start: string,
  end: string,
): boolean {
  const startM = parseTimeToMinutes(start);
  const endM = parseTimeToMinutes(end);
  if (startM === null || endM === null) return true;

  const nowM = now.getHours() * 60 + now.getMinutes();

  if (startM === endM) return true;

  if (startM < endM) {
    return nowM >= startM && nowM < endM;
  }

  // Atravessa meia-noite: 23:00 → 06:00
  return nowM >= startM || nowM < endM;
}

/** Ms até o próximo limite (início ou fim) da janela. */
export function msUntilNextScheduleBoundary(
  now: Date,
  start: string,
  end: string,
): number {
  const startM = parseTimeToMinutes(start);
  const endM = parseTimeToMinutes(end);
  if (startM === null || endM === null || startM === endM) {
    return 60_000;
  }

  const nowM = now.getHours() * 60 + now.getMinutes();
  const nowSec = now.getSeconds();
  const nowMs = now.getMilliseconds();
  const elapsedInMinute = nowSec * 1000 + nowMs;

  const candidates = [startM, endM];
  let best = Number.POSITIVE_INFINITY;

  for (const boundary of candidates) {
    let deltaMin = boundary - nowM;
    if (deltaMin < 0 || (deltaMin === 0 && elapsedInMinute > 0)) {
      deltaMin += 24 * 60;
    }
    if (deltaMin === 0) deltaMin = 24 * 60;
    const ms = deltaMin * 60_000 - elapsedInMinute;
    if (ms > 0 && ms < best) best = ms;
  }

  return Number.isFinite(best) ? Math.max(1_000, Math.min(best, 30 * 60_000)) : 60_000;
}
