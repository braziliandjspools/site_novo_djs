import type { VipMusicCatalogItem, VipMusicCatalogResponse } from "../lib/vip-music-catalog";
import type { PreviewTrack } from "../lib/google-drive";

export type MusicasBreadcrumb = {
  id: string;
  name: string;
  depth: number;
};

export type MusicasCatalogState = VipMusicCatalogResponse;

export type { VipMusicCatalogItem, PreviewTrack };
