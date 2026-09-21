/**
 * Regras de envio ao BRS Downloader na árvore de Atualizações:
 *
 * - Acervo (1º nível sob /musicas/atualizacoes) → NÃO pode baixar inteiro
 * - Estilo / data / pasta interna → pode (import recursivo via pack/import)
 * - Faixa individual → tratada por outro fluxo (jobs unitários)
 */

export function isVipAcervoRootSlug(slug: string): boolean {
  const segments = slug
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  return segments.length === 1;
}

/**
 * @param parentSlugSegments segmentos da pasta PAI (sem o filho).
 *   `[]` = lista raiz de acervos → filhos são acervos → sem download.
 *   `['remix-services']` = estilos/datas dentro do acervo → download ok.
 */
export function canSendFolderToDownloader(
  item: {
    folderCount?: number | null;
    trackCount?: number | null;
  },
  parentSlugSegments: string[] = [],
): boolean {
  // Filho direto da raiz = acervo inteiro — proibido.
  if (parentSlugSegments.length === 0) return false;

  const folders = item.folderCount ?? 0;
  const tracks = item.trackCount ?? 0;
  // Pastas internas (estilo, data, etc.) com conteúdo — inclusive só subpastas.
  return tracks > 0 || folders > 0;
}

/** Bloqueio por slug completo (API / botões que já montam o path). */
export function canSendPackSlugToDownloader(slug: string, root: "vip" | "colecoes" = "vip"): boolean {
  if (root !== "vip") return true;
  return !isVipAcervoRootSlug(slug);
}
