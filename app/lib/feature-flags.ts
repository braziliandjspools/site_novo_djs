/** Flags temporárias de produto no site. Deemix descontinuado — use Allavsoft. */
export const DEEMIX_ENABLED = false;

/**
 * Buscador de músicas no BRS Downloader.
 * Ligado por padrão. Desative com BRS_MUSIC_SEARCH_ENABLED=false.
 */
export const BRS_MUSIC_SEARCH_ENABLED = process.env.BRS_MUSIC_SEARCH_ENABLED !== "false";
