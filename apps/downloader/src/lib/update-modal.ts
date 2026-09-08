import type { LatestUpdateResponse, UpdateCheckResult } from "./updater";

type LatestInfo = NonNullable<LatestUpdateResponse["latest"]>;

type Listener = (latest: LatestInfo | null) => void;

const listeners = new Set<Listener>();
let current: LatestInfo | null = null;
/** Evita reabrir o popup na mesma sessão depois de “Agora não”. */
let dismissedVersion: string | null = null;

export function subscribeUpdateModal(listener: Listener) {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

export function presentUpdateModal(latest: LatestInfo | null) {
  current = latest;
  for (const listener of listeners) {
    listener(latest);
  }
}

/** Abre o modal se a checagem encontrou update; limpa se estiver em dia. */
export function presentUpdateModalFromCheck(result: UpdateCheckResult) {
  if (result.updateAvailable && result.latest) {
    if (dismissedVersion === result.latest.version) return;
    presentUpdateModal(result.latest);
    return;
  }
}

export function dismissUpdateModal() {
  if (current?.version) {
    dismissedVersion = current.version;
  }
  presentUpdateModal(null);
}
