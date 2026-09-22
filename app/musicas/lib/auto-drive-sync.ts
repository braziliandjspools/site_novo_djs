import { clearMusicasCache } from "./musicas-fetch-cache";

export type AutoDriveSyncResult = {
  syncedAt?: string;
  folderCount?: number;
};

const LAST_SYNC_KEY = "brs-atualizacoes-last-sync";
/** Evita sincronizar de novo a cada navegação de pasta na mesma aba. */
const MIN_INTERVAL_MS = 60_000;

export function readLastAutoSync(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

function writeLastAutoSync(iso: string) {
  try {
    sessionStorage.setItem(LAST_SYNC_KEY, iso);
  } catch {
    /* ignore */
  }
}

/**
 * Sincroniza o cache do Drive ao entrar/recarregar a página.
 * Substitui o botão manual "Sincronizar".
 */
export async function autoSyncDriveOnEnter(force = false): Promise<AutoDriveSyncResult | null> {
  const last = readLastAutoSync();
  if (!force && last) {
    const elapsed = Date.now() - new Date(last).getTime();
    if (Number.isFinite(elapsed) && elapsed < MIN_INTERVAL_MS) return null;
  }
  try {
    const res = await fetch("/api/musicas/sync", { method: "POST", cache: "no-store" });
    const data = (await res.json()) as {
      ok?: boolean;
      syncedAt?: string;
      folderCount?: number;
      error?: string;
    };
    if (!res.ok || !data.ok) return null;
    clearMusicasCache("/api/musicas/");
    if (data.syncedAt) writeLastAutoSync(data.syncedAt);
    return {
      syncedAt: data.syncedAt,
      folderCount: data.folderCount,
    };
  } catch {
    return null;
  }
}
