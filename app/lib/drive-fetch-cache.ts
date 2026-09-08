/** Tag Next.js para invalidar listagens do Google Drive on-demand. */
export const GOOGLE_DRIVE_CACHE_TAG = "google-drive-vip";

/**
 * Flag de processo (somente server) para bypass de cache durante sync.
 * Evita `node:async_hooks`, que quebra o bundle Turbopack no client
 * quando `google-drive` é importado por componentes.
 */
let forceRefreshDepth = 0;

/** Executa leituras do Drive sem cache (sync forçado). */
export async function withDriveForceRefresh<T>(fn: () => Promise<T>): Promise<T> {
  forceRefreshDepth += 1;
  try {
    return await fn();
  } finally {
    forceRefreshDepth -= 1;
  }
}

export function isDriveForceRefresh(): boolean {
  return forceRefreshDepth > 0;
}

/** Opções de `fetch` para a API / pasta pública do Drive. */
export function driveListFetchInit(revalidateSeconds = 120): RequestInit {
  if (isDriveForceRefresh()) {
    return { cache: "no-store" };
  }
  return {
    next: {
      revalidate: revalidateSeconds,
      tags: [GOOGLE_DRIVE_CACHE_TAG],
    },
  };
}
