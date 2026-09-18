/**
 * Só pastas finais (com faixas e sem subpastas) podem ir ao Downloader.
 * Meses / acervos intermediários ficam só para navegação.
 */
export function canSendFolderToDownloader(item: {
  folderCount?: number | null;
  trackCount?: number | null;
}): boolean {
  const folders = item.folderCount ?? 0;
  const tracks = item.trackCount ?? 0;
  return tracks > 0 && folders === 0;
}
