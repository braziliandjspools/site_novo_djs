import type { PreviewTrack } from "../../lib/google-drive";
import { ensureAudioExtension } from "../../lib/google-drive";

/** Limite de downloads proxy simultâneos nesta instância Node (protege a VPS). */
export const BROWSER_DOWNLOAD_PROXY_QUERY = "proxy=1";

export function trackDownloadPath(track: Pick<PreviewTrack, "id" | "fileName" | "title">, proxy = false) {
  const name = encodeURIComponent(ensureAudioExtension(track.fileName ?? track.title));
  const base = `/api/musicas/download/${track.id}?name=${name}`;
  return proxy ? `${base}&${BROWSER_DOWNLOAD_PROXY_QUERY}` : base;
}

/**
 * Dispara download pelo gerenciador do navegador (stream em disco).
 * Nunca usa fetch+blob — isso carregava o MP3 inteiro na RAM e saturava a VPS.
 */
export function startBrowserFileDownload(url: string, filename?: string) {
  const link = document.createElement("a");
  link.href = url;
  if (filename) link.download = filename;
  link.rel = "noopener";
  // Mesma aba: o 302 do Drive / attachment não navega a SPA embora
  // o download manager capture a resposta.
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Download de faixa: tenta offload (auth + redirect Drive) e, se pedido, proxy OAuth.
 */
export function startBrowserTrackDownload(
  track: Pick<PreviewTrack, "id" | "fileName" | "title">,
  options?: { proxy?: boolean },
) {
  const filename = ensureAudioExtension(track.fileName ?? track.title);
  startBrowserFileDownload(trackDownloadPath(track, Boolean(options?.proxy)), filename);
}
