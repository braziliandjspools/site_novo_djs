const STORAGE_PREFIX = "bp-downloader-queue-order:";

function storageKey(deviceId: string) {
  return `${STORAGE_PREFIX}${deviceId}`;
}

export function loadQueueOrder(deviceId: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(deviceId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
  } catch {
    return [];
  }
}

export function persistQueueOrder(deviceId: string, order: number[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(deviceId), JSON.stringify(order));
  } catch {
    /* quota ou modo privado */
  }
}

/** Reordena `order` movendo `jobId` para o índice `toIndex` (0 = topo). */
export function moveJobInOrder(order: number[], jobId: number, toIndex: number): number[] {
  const without = order.filter((id) => id !== jobId);
  const clamped = Math.max(0, Math.min(toIndex, without.length));
  without.splice(clamped, 0, jobId);
  return without;
}

export function moveJobRelative(order: number[], jobId: number, delta: number): number[] {
  const index = order.indexOf(jobId);
  if (index < 0) return order;
  return moveJobInOrder(order, jobId, index + delta);
}
