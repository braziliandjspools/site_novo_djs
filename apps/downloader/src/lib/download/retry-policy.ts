export const RETRY_DELAYS_MS = [2_000, 5_000, 15_000] as const;

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function nextRetryDelay(attempt: number) {
  return RETRY_DELAYS_MS[attempt] ?? null;
}

export function shouldAutoRetry(attempt: number) {
  return attempt < RETRY_DELAYS_MS.length;
}
