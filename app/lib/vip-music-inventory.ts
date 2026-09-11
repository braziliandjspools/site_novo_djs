import { listDriveFolderChildren } from "./google-drive";
import { isDriveAudioFile } from "./folder-cover";
import { mapPool } from "./map-pool";
import {
  getVipMusicRootFolderId,
  isVipMusicCatalogConfigured,
} from "./vip-music-catalog";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const MAX_DEPTH = 14;
const WALK_CONCURRENCY = 6;
const INVENTORY_TTL_MS = 5 * 60_000;

export type VipMusicInventory = {
  configured: boolean;
  folderCount: number;
  trackCount: number;
  scannedFolders: number;
  syncedAt: string;
  /** true = resultado do cache em memória do processo */
  cached: boolean;
  error?: string;
};

type WalkResult = {
  folderCount: number;
  trackCount: number;
  scannedFolders: number;
};

let inventoryMemo: { value: VipMusicInventory; expiresAt: number } | null = null;
let inventoryInflight: Promise<VipMusicInventory> | null = null;

async function walkFolderInventory(
  folderId: string,
  depth: number,
  seen: Set<string>,
): Promise<WalkResult> {
  if (depth > MAX_DEPTH || seen.has(folderId)) {
    return { folderCount: 0, trackCount: 0, scannedFolders: 0 };
  }
  seen.add(folderId);

  let children;
  try {
    children = await listDriveFolderChildren(folderId);
  } catch {
    return { folderCount: 0, trackCount: 0, scannedFolders: 1 };
  }

  const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const tracks = children.filter((item) => isDriveAudioFile(item));

  let folderCount = subfolders.length;
  let trackCount = tracks.length;
  let scannedFolders = 1;

  if (subfolders.length > 0) {
    const nested = await mapPool(subfolders, WALK_CONCURRENCY, (folder) =>
      walkFolderInventory(folder.id, depth + 1, seen),
    );
    for (const part of nested) {
      folderCount += part.folderCount;
      trackCount += part.trackCount;
      scannedFolders += part.scannedFolders;
    }
  }

  return { folderCount, trackCount, scannedFolders };
}

async function computeVipMusicInventory(): Promise<VipMusicInventory> {
  if (!isVipMusicCatalogConfigured()) {
    return {
      configured: false,
      folderCount: 0,
      trackCount: 0,
      scannedFolders: 0,
      syncedAt: new Date().toISOString(),
      cached: false,
      error: "Pasta VIP do Drive não configurada.",
    };
  }

  const rootId = getVipMusicRootFolderId();
  try {
    const result = await walkFolderInventory(rootId, 0, new Set());
    return {
      configured: true,
      folderCount: result.folderCount,
      trackCount: result.trackCount,
      scannedFolders: result.scannedFolders,
      syncedAt: new Date().toISOString(),
      cached: false,
    };
  } catch (error) {
    return {
      configured: true,
      folderCount: 0,
      trackCount: 0,
      scannedFolders: 0,
      syncedAt: new Date().toISOString(),
      cached: false,
      error: error instanceof Error ? error.message : "Falha ao varrer o Drive.",
    };
  }
}

/** Inventário completo do acervo VIP (pastas + faixas) com cache curto no processo. */
export async function getVipMusicInventory(options?: {
  forceRefresh?: boolean;
}): Promise<VipMusicInventory> {
  const force = Boolean(options?.forceRefresh);
  if (!force && inventoryMemo && inventoryMemo.expiresAt > Date.now()) {
    return { ...inventoryMemo.value, cached: true };
  }

  if (!force && inventoryInflight) {
    const value = await inventoryInflight;
    return { ...value, cached: true };
  }

  inventoryInflight = computeVipMusicInventory()
    .then((value) => {
      inventoryMemo = {
        value,
        expiresAt: Date.now() + INVENTORY_TTL_MS,
      };
      return value;
    })
    .finally(() => {
      inventoryInflight = null;
    });

  return inventoryInflight;
}

export function clearVipMusicInventoryCache() {
  inventoryMemo = null;
}
