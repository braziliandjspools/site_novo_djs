/** Feature flags do BRS Downloader. */

/**
 * Área "Pesquisar músicas".
 * Ligada por padrão em produção. Desative com VITE_BRS_MUSIC_SEARCH_ENABLED=false.
 */
export const isMusicSearchEnabled =
  import.meta.env.VITE_BRS_MUSIC_SEARCH_ENABLED !== "false" &&
  import.meta.env.VITE_BRS_MUSIC_SEARCH_ENABLED !== "0";
