import { clearMusicasCache } from "./musicas-fetch-cache";

export type AutoDriveSyncResult = {
  syncedAt?: string;
  folderCount?: number;
  /** Soft = aquece a raiz sem invalidar o cache do Drive (rápido). */
  soft?: boolean;
};

const LAST_SYNC_KEY = "brs-atualizacoes-last-sync";
/** Soft sync: não a cada pasta — só periodicamente na aba. */
const MIN_INTERVAL_MS = 5 * 60_000;

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
 * Soft sync ao entrar no acervo: aquece a raiz sem zerar o cache do Drive.
 * Sync forçado (botão) continua em `/api/musicas/sync` sem soft=1.
 */
export async function autoSyncDriveOnEnter(force = false): Promise<AutoDriveSyncResult | null> {
  const last = readLastAutoSync();
  if (!force && last) {
    const elapsed = Date.now() - new Date(last).getTime();
    if (Number.isFinite(elapsed) && elapsed < MIN_INTERVAL_MS) return null;
  }
  try {
    const soft = !force;
    const res = await fetch(soft ? "/api/musicas/sync?soft=1" : "/api/musicas/sync", {
      method: "POST",
      cache: "no-store",
    });
    const data = (await res.json()) as {
      ok?: boolean;
      syncedAt?: string;
      folderCount?: number;
      soft?: boolean;
      error?: string;
    };
    if (!res.ok || !data.ok) return null;
    // Soft não limpa o cache do client — a tabela/pesquisa já carregadas continuam rápidas.
    if (!soft) clearMusicasCache("/api/musicas/");
    if (data.syncedAt) writeLastAutoSync(data.syncedAt);
    return {
      syncedAt: data.syncedAt,
      folderCount: data.folderCount,
      soft,
    };
  } catch {
    return null;
  }
}
