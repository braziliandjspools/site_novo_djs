import {
  listDriveFolderChildren,
  parseTrackMeta,
  type PreviewPlaylist,
  type PreviewTrack,
} from "./google-drive";
import { GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID } from "./site";
import {
  childrenAreWeekFolders,
  displayFolderName,
  isNewFolderName,
  parseMonthFolderDate,
  parseUpdateDateFolder,
  slugifyFolderName,
  sortVipChildFolders,
} from "./vip-music-slugs";
import { isDriveAudioFile, pickCoverFromChildren } from "./folder-cover";
import { resolveFolderCoverUrl } from "./local-folder-covers";
import { mapPool } from "./map-pool";
import {
  isSendNowConfigured,
  isSendNowFolderStorageId,
  listSendNowFolder,
  sendNowFileStorageId,
  sendNowFldIdFromStorageId,
  sendNowFolderStorageId,
  sendNowRootStorageId,
  sendNowFolderLabel,
} from "./send-now";

function updateDayLinks(folders: { name: string }[]) {
  return folders.flatMap((folder) => {
    const parsed = parseUpdateDateFolder(folder.name);
    if (!parsed) return [];
    return [{ slug: slugifyFolderName(folder.name), label: parsed.label, name: folder.name }];
  });
}

/** Pools de cada dia, sem varrer os MP3. Uma pasta direta da data é uma pool. */
async function listPoolOptionsFromParents(folderIds: string[]): Promise<CatalogFilterOption[]> {
  const pools = new Map<string, string>();
  await mapPool(folderIds, 4, async (folderId) => {
    const children = await listDriveFolderChildren(folderId);
    for (const child of children) {
      if (child.mimeType !== FOLDER_MIME) continue;
      const slug = slugifyFolderName(child.name);
      if (!slug) continue;
      pools.set(slug, displayFolderName(child.name));
    }
  });
  return [...pools.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/** Pools de um mês ou de um dia, sem baixar as faixas. */
export async function listUpdatePoolOptions(folderId: string, folderName: string): Promise<CatalogFilterOption[]> {
  if (parseUpdateDateFolder(folderName)) {
    return listPoolOptionsFromParents([folderId]);
  }
  const children = await listDriveFolderChildren(folderId);
  const dates = children.filter(
    (child) => child.mimeType === FOLDER_MIME && parseUpdateDateFolder(child.name),
  );
  if (dates.length === 0) return [];
  return listPoolOptionsFromParents(dates.map((folder) => folder.id));
}
const FOLDER_MIME = "application/vnd.google-apps.folder";
const MAX_TRACK_WALK_DEPTH = 12;
/** Pastas irmãs no deep-walk — paraleliza sem saturar a Drive API. */
const TRACK_WALK_CONCURRENCY = 8;

export type VipMusicFolder = {
  id: string;
  name: string;
  /** Pasta marcada como `[new]` no Google Drive. */
  isNew?: boolean;
};

export type VipMusicCatalogItem = VipMusicFolder & {
  type: "folder";
  coverUrl?: string | null;
  /** Subpastas imediatas (quando calculado). */
  folderCount?: number;
  /** Faixas imediatas (quando calculado). */
  trackCount?: number;
  /** ISO do Drive (`modifiedTime`/`createdTime`) — destaque até 00:00 local. */
  modifiedAt?: string | null;
};

export type CatalogFilterOption = {
  slug: string;
  name: string;
};

export type VipMusicCatalogResponse = {
  configured: boolean;
  rootFolderId: string;
  rootFolderName: string;
  folderId: string;
  folderName: string;
  level: "folders" | "tracks";
  items: VipMusicCatalogItem[];
  tracks: PreviewTrack[];
  coverUrl?: string | null;
  /** Todos os pools da pasta, independente da página de faixas carregada. */
  filterPools?: CatalogFilterOption[];
  /** Todos os estilos da pasta, independente da página de faixas carregada. */
  /** Dias de atualização do mês (30.09.2026), para a sidebar. */
  updateDays?: { slug: string; label: string; name: string }[];
};

type DriveChild = {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
};

function parseDriveSizeBytes(size?: string | number | null): number | null {
  if (size == null || size === "") return null;
  const n = typeof size === "number" ? size : Number(size);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function getVipMusicRootFolderId() {
  return GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID.trim();
}

export function isVipMusicCatalogConfigured() {
  return Boolean(getVipMusicRootFolderId());
}

/**
 * Atualiza o cache da pasta raiz do acervo.
 * A tabela da pasta aberta carrega à parte, sem varrer o Drive inteiro.
 */
export async function refreshVipMusicCatalog(): Promise<{ folderCount: number; trackCount: number }> {
  const rootId = getVipMusicRootFolderId();
  if (!rootId) return { folderCount: 0, trackCount: 0 };

  try {
    const children = await listDriveFolderChildren(rootId);
    return {
      folderCount: children.filter((item) => item.mimeType === FOLDER_MIME).length,
      trackCount: children.filter((item) => isDriveAudioFile(item)).length,
    };
  } catch {
    return { folderCount: 0, trackCount: 0 };
  }
}

function toPreviewTrack(
  file: DriveChild,
  packName: string,
  context: { updateDate?: string | null; styleName?: string | null; poolName?: string | null; poolFolderId?: string | null } = {},
): PreviewTrack {
  return {
    id: file.id,
    pack: packName,
    fileName: file.name,
    ...parseTrackMeta(file.name),
    modifiedAt: file.createdTime ?? file.modifiedTime ?? null,
    sizeBytes: parseDriveSizeBytes(file.size),
    source: "drive",
    updateDate: context.updateDate ?? null,
    styleName: context.styleName ?? null,
    poolName: context.poolName ?? null,
    poolFolderId: context.poolFolderId ?? null,
  };
}

function driveChildStamp(file: { createdTime?: string; modifiedTime?: string }) {
  return file.createdTime ?? file.modifiedTime ?? "";
}

/** Datas mais novas primeiro; empate pelo upload real no Drive. */
function compareNewestDriveChild(a: DriveChild, b: DriveChild) {
  const dateA = parseUpdateDateFolder(a.name)?.key ?? "";
  const dateB = parseUpdateDateFolder(b.name)?.key ?? "";
  if (dateA !== dateB) {
    if (dateA && dateB) return dateB.localeCompare(dateA);
    return dateA ? -1 : 1;
  }
  const stampA = driveChildStamp(a);
  const stampB = driveChildStamp(b);
  if (stampA !== stampB) return stampB.localeCompare(stampA);
  return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
}

function sortTracksByUploadThenTitle(a: PreviewTrack, b: PreviewTrack) {
  const ad = a.updateDate ?? "";
  const bd = b.updateDate ?? "";
  if (ad !== bd) return bd.localeCompare(ad);
  const am = a.modifiedAt ?? "";
  const bm = b.modifiedAt ?? "";
  if (am !== bm) return bm.localeCompare(am);
  return a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" });
}

function isUpdatesWrapperFolder(name: string): boolean {
  return displayFolderName(name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase() === "atualizacoes";
}

export async function listVipMusicFolders(parentFolderId?: string): Promise<VipMusicFolder[]> {
  if (parentFolderId && isSendNowFolderStorageId(parentFolderId)) {
    if (!isSendNowConfigured()) return [];
    const listed = await listSendNowFolder(sendNowFldIdFromStorageId(parentFolderId));
    return listed.folders.map((folder) => ({
      id: sendNowFolderStorageId(String(folder.fld_id)),
      name: folder.name ?? "Pasta",
      isNew: false,
    }));
  }

  const rootId = getVipMusicRootFolderId();
  if (!rootId) return [];

  const targetId = parentFolderId && parentFolderId !== "root" ? parentFolderId : rootId;
  let children = await listDriveFolderChildren(targetId);
  let subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);

  // O ID configurado para o acervo pode apontar para a pasta raiz técnica
  // que contém uma única pasta "ATUALIZAÇÕES". Essa pasta não deve virar
  // um nível da URL: a navegação pública precisa começar em SETEMBRO 2026
  // e continuar em 29-SET-2026 -> POOL -> ESTILO.
  if (
    targetId === rootId &&
    subfolders.length === 1 &&
    isUpdatesWrapperFolder(subfolders[0].name)
  ) {
    children = await listDriveFolderChildren(subfolders[0].id);
    subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
  }

  const folders = sortVipChildFolders(
    subfolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      isNew: isNewFolderName(folder.name),
      modifiedAt: folder.modifiedTime ?? folder.createdTime ?? null,
    })),
  );
  // Send.now permanece implementado no backend, mas fica oculto do acervo
  // enquanto SEND_NOW_ENABLED não estiver explicitamente ativo.
  return folders;
}

/** Pastas da raiz/pai com contagens para navegação de biblioteca. */
export async function listVipMusicFoldersWithNav(
  parentFolderId?: string,
): Promise<VipMusicCatalogItem[]> {
  const folders = await listVipMusicFolders(parentFolderId);
  if (folders.length === 0) return [];
  const stats = await mapPool(folders, 8, (folder) => getFolderNavStats(folder.id, folder.name));
  return folders.map((folder, index) => ({
    ...folder,
    type: "folder" as const,
    coverUrl: resolveFolderCoverUrl({
      folderName: folder.name,
      driveCoverUrl: stats[index]?.coverUrl ?? null,
    }),
    folderCount: stats[index]?.folderCount ?? 0,
    trackCount: stats[index]?.trackCount ?? 0,
  }));
}

/**
 * Percorre a pasta e todas as subpastas até achar arquivos de áudio.
 */
async function collectTracksDeep(
  folderId: string,
  packName: string,
  depth = 0,
  seen = new Set<string>(),
  updateDate: string | null = null,
  styleName: string | null = null,
  poolName: string | null = null,
  isDateRoot = false,
  dateChildName: string | null = null,
  currentFolderName: string | null = null,
  poolFolderId: string | null = null,
): Promise<PreviewTrack[]> {
  if (depth > MAX_TRACK_WALK_DEPTH) return [];
  if (seen.has(folderId)) return [];
  seen.add(folderId);

  const children = await listDriveFolderChildren(folderId);
  const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const audioFiles = children.filter((item) => isDriveAudioFile(item));

  // Hierarquia da biblioteca de atualizações:
  // DATA -> POOL (penúltima pasta) -> ESTILO (última pasta) -> arquivos.
  // A função recebe a profundidade relativa à pasta de data para não
  // confundir o nome do pool com o nome do estilo.
  const resolvedPoolName =
    isDateRoot && depth === 1 && currentFolderName
      ? displayFolderName(currentFolderName)
      : !isDateRoot && depth === 1 && subfolders.length > 0 && currentFolderName
        ? displayFolderName(currentFolderName)
        : poolName;
  const resolvedStyleName =
    isDateRoot && depth >= 2 && currentFolderName
      ? styleName ?? displayFolderName(currentFolderName)
      : !isDateRoot && audioFiles.length > 0 && subfolders.length === 0 && currentFolderName
        ? displayFolderName(currentFolderName)
        : styleName;
  const resolvedPoolFolderId =
    isDateRoot && depth === 1 && currentFolderName
      ? folderId
      : !isDateRoot && depth === 1 && subfolders.length > 0 && currentFolderName
        ? folderId
        : poolFolderId;
  const tracks = audioFiles.map((file) => toPreviewTrack(file, packName, {
    updateDate,
    styleName: resolvedStyleName,
    poolName: resolvedPoolName,
    poolFolderId: resolvedPoolFolderId,
  }));

  if (subfolders.length > 0) {
    const nestedLists = await mapPool(subfolders, TRACK_WALK_CONCURRENCY, (folder) => {
      const parsed = parseUpdateDateFolder(folder.name);
      const nextPack = parsed ? packName : folder.name;
      const nextDate = parsed?.key ?? updateDate;
      const nextStyleName = parsed ? resolvedStyleName : displayFolderName(folder.name);
      const nextDateChildName = isDateRoot && !parsed ? displayFolderName(folder.name) : null;
      return collectTracksDeep(
        folder.id,
        nextPack,
        depth + 1,
        seen,
        nextDate,
        nextStyleName,
        resolvedPoolName,
        isDateRoot,
        nextDateChildName,
        folder.name,
        resolvedPoolFolderId,
      );
    });
    for (const nested of nestedLists) {
      tracks.push(...nested);
    }
  }

  return tracks;
}

async function getFolderNavStats(
  folderId: string,
  folderName?: string,
): Promise<{
  folderCount: number;
  trackCount: number;
  coverUrl: string | null;
}> {
  try {
    if (isSendNowFolderStorageId(folderId)) {
      // O card da raiz do SEND.NOW não deve bloquear o /tree caso a API
      // esteja indisponível; a listagem real acontece ao abrir o acervo.
      if (folderId === sendNowRootStorageId()) {
        return { folderCount: 0, trackCount: 0, coverUrl: null };
      }

      const listed = await listSendNowFolder(sendNowFldIdFromStorageId(folderId));
      return {
        folderCount: listed.folders.length,
        trackCount: listed.files.length,
        coverUrl: null,
      };
    }
    const children = await listDriveFolderChildren(folderId);
    const folders = children.filter((item) => item.mimeType === FOLDER_MIME);
    const tracks = children.filter((item) => isDriveAudioFile(item));
    const cover = pickCoverFromChildren(children, folderName);
    let trackCount = tracks.length;

    // Pasta só com subpastas: soma faixas do 1º nível interno (útil sem deep-walk caro).
    if (trackCount === 0 && folders.length > 0 && folders.length <= 24) {
      const nested = await mapPool(folders, 6, async (folder) => {
        try {
          const nestedChildren = await listDriveFolderChildren(folder.id);
          return nestedChildren.filter((item) => isDriveAudioFile(item)).length;
        } catch {
          return 0;
        }
      });
      trackCount = nested.reduce((sum, value) => sum + value, 0);
    }

    return {
      folderCount: folders.length,
      trackCount,
      coverUrl: cover?.coverUrl ?? null,
    };
  } catch {
    return { folderCount: 0, trackCount: 0, coverUrl: null };
  }
}

type TrackPageState = {
  skip: number;
  limit: number;
  skipped: number;
  collected: number;
  hasMore: boolean;
};

type CatalogTrackFilters = {
  poolSlug?: string | null;
  styleSlug?: string | null;
};

function matchesTrackFolderFilter(poolName: string | null, styleName: string | null, filters?: CatalogTrackFilters) {
  const poolSlug = filters?.poolSlug?.trim() ?? "";
  const styleSlug = filters?.styleSlug?.trim() ?? "";
  if (poolSlug && slugifyFolderName(poolName ?? "") !== poolSlug) return false;
  if (styleSlug && slugifyFolderName(styleName ?? "") !== styleSlug) return false;
  return true;
}

async function collectTracksPageDeep(
  folderId: string,
  packName: string,
  state: TrackPageState,
  depth = 0,
  seen = new Set<string>(),
  updateDate: string | null = null,
  styleName: string | null = null,
  poolName: string | null = null,
  isDateRoot = false,
  dateChildName: string | null = null,
  currentFolderName: string | null = null,
  poolFolderId: string | null = null,
  filters?: CatalogTrackFilters,
): Promise<PreviewTrack[]> {
  if (depth > MAX_TRACK_WALK_DEPTH || seen.has(folderId) || state.hasMore) {
    return [];
  }
  // Ao atingir o limite durante uma pasta folha, não há uma nova chamada
  // recursiva que possa marcar hasMore. Precisamos sinalizar explicitamente
  // que ainda pode existir conteúdo para que o LOAD MORE continue para a
  // próxima pasta/data.
  if (state.collected >= state.limit) {
    state.hasMore = true;
    return [];
  }
  seen.add(folderId);

  const children = await listDriveFolderChildren(folderId);
  const rawSubfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const orderedSubfolders = sortVipChildFolders(
    rawSubfolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      isNew: isNewFolderName(folder.name),
    })),
  );
  const subfolders = orderedSubfolders
    .map((folder) => rawSubfolders.find((item) => item.id === folder.id))
    .filter((folder): folder is DriveChild => Boolean(folder));

  // Sem filtro, a primeira página sai das pastas e faixas mais novas no Drive.
  subfolders.sort(compareNewestDriveChild);
  const audioFiles = children
    .filter((item) => isDriveAudioFile(item))
    .sort(compareNewestDriveChild);

  // DATA -> POOL -> ESTILO -> arquivos. Em uma pasta de data, o primeiro
  // nível abaixo dela é sempre o pool e o segundo é o estilo.
  const resolvedPoolName =
    isDateRoot && depth === 1 && currentFolderName
      ? displayFolderName(currentFolderName)
      : !isDateRoot && depth === 1 && subfolders.length > 0 && currentFolderName
        ? displayFolderName(currentFolderName)
        : poolName;
  const resolvedStyleName =
    isDateRoot && depth >= 2 && currentFolderName
      ? displayFolderName(currentFolderName)
      : !isDateRoot && audioFiles.length > 0 && subfolders.length === 0 && currentFolderName
        ? displayFolderName(currentFolderName)
        : styleName;
  const resolvedPoolFolderId =
    isDateRoot && depth === 1 && currentFolderName
      ? folderId
      : !isDateRoot && depth === 1 && subfolders.length > 0 && currentFolderName
        ? folderId
        : poolFolderId;
  const result: PreviewTrack[] = [];

  for (const file of audioFiles) {
    if (!matchesTrackFolderFilter(resolvedPoolName, resolvedStyleName, filters)) continue;
    if (state.skipped < state.skip) {
      state.skipped += 1;
      continue;
    }
    if (state.collected >= state.limit) {
      state.hasMore = true;
      return result;
    }
    result.push(toPreviewTrack(file, packName, {
      updateDate,
      styleName: resolvedStyleName,
      poolName: resolvedPoolName,
      poolFolderId: resolvedPoolFolderId,
    }));
    state.collected += 1;
  }

  if (state.collected >= state.limit) {
    state.hasMore = true;
    return result;
  }

  for (const folder of subfolders) {
    if (state.collected >= state.limit) {
      state.hasMore = true;
      break;
    }
    const parsed = parseUpdateDateFolder(folder.name);
    const nextPack = parsed ? packName : folder.name;
    const nextDate = parsed?.key ?? updateDate;
    const nextStyleName = parsed ? resolvedStyleName : (isDateRoot && depth === 0 ? null : displayFolderName(folder.name));
    const nextDateChildName = isDateRoot && !parsed ? displayFolderName(folder.name) : null;
    const nested = await collectTracksPageDeep(
      folder.id,
      nextPack,
      state,
      depth + 1,
      seen,
      nextDate,
      nextStyleName,
      resolvedPoolName,
      isDateRoot,
      nextDateChildName,
      folder.name,
      resolvedPoolFolderId,
      filters,
    );
    result.push(...nested);
  }

  return result;
}

async function getDriveCatalog(
  folderId: string,
  folderName: string,
  trackOffset = 0,
  trackLimit?: number,
  dayKey: string | null = null,
  filters?: CatalogTrackFilters,
): Promise<VipMusicCatalogResponse & { tracksHasMore?: boolean }> {
  const rootId = getVipMusicRootFolderId();
  const children = await listDriveFolderChildren(folderId);
  const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const audioFiles = children.filter((item) => isDriveAudioFile(item));
  const coverFile = pickCoverFromChildren(children, folderName);
  const coverUrl = resolveFolderCoverUrl({
    folderName,
    driveCoverUrl: coverFile?.coverUrl ?? null,
  });

  // Ao abrir uma pasta de data, reúne as faixas de todas as pastas de estilo
  // diretamente na tabela. Cada faixa preserva o nome da pasta de estilo.
  const folderDate = parseUpdateDateFolder(folderName);
  if (folderDate && trackLimit == null) {
    const tracks = (await collectTracksDeep(
      folderId,
      folderName,
      0,
      new Set<string>(),
      folderDate.key,
      null,
      null,
      true,
      null,
      null,
      null,
    )).sort(sortTracksByUploadThenTitle);

    return {
      configured: true,
      rootFolderId: rootId,
      rootFolderName: folderId === rootId ? folderName : "2026",
      folderId,
      folderName,
      level: "tracks",
      items: [],
      tracks,
      coverUrl,
    };
  }

  if (folderDate) {
    const requestedLimit = Math.max(1, Math.min(trackLimit ?? 400, 400));
    const state: TrackPageState = {
      skip: Math.max(0, trackOffset),
      limit: requestedLimit + 1,
      skipped: 0,
      collected: 0,
      hasMore: false,
    };
    const tracks = (await collectTracksPageDeep(
      folderId,
      folderName,
      state,
      0,
      new Set<string>(),
      folderDate.key,
      null,
      null,
      true,
    )).sort(sortTracksByUploadThenTitle);
    const pageTracks = tracks.slice(0, requestedLimit);

    return {
      configured: true,
      rootFolderId: rootId,
      rootFolderName: folderId === rootId ? folderName : "2026",
      folderId,
      folderName,
      level: "tracks",
      items: [],
      tracks: pageTracks,
      tracksHasMore: state.hasMore || tracks.length > requestedLimit,
      coverUrl,
    };
  }

  // ATUALIZAÇÕES: o mês é o nível navegável e, ao entrar nele,
  // a tabela já reúne todas as músicas das datas daquele mês.
  // As pastas de data NÃO viram uma segunda tela: seus nomes são preservados
  // em updateDate e as colunas Pool/Estilo são preenchidas pelo deep-walk.
  const monthFolder = parseMonthFolderDate(folderName);
  const allDateFolders = subfolders
    .filter((folder) => parseUpdateDateFolder(folder.name))
    .sort((a, b) => {
      const ad = parseUpdateDateFolder(a.name)?.key ?? "";
      const bd = parseUpdateDateFolder(b.name)?.key ?? "";
      return bd.localeCompare(ad);
    });
  const dateFoldersAtMonth = dayKey
    ? allDateFolders.filter((folder) => parseUpdateDateFolder(folder.name)?.key === dayKey)
    : allDateFolders;

  if (monthFolder && allDateFolders.length > 0) {
    // O Downloader pede o mês sem paginação. A tabela do site continua em lotes.
    // As pools de todos os dias são listadas depois, para a tabela não esperar cada dia.
    if (trackLimit == null) {
      const nested = await mapPool(dateFoldersAtMonth, TRACK_WALK_CONCURRENCY, async (dateFolder) => {
        const parsed = parseUpdateDateFolder(dateFolder.name);
        if (!parsed) return [] as PreviewTrack[];
        try {
          return await collectTracksDeep(
            dateFolder.id,
            dateFolder.name,
            0,
            new Set<string>(),
            parsed.key,
            null,
            null,
            true,
          );
        } catch {
          return [] as PreviewTrack[];
        }
      });
      const tracks = nested.flat().sort(sortTracksByUploadThenTitle);
      return {
        configured: true,
        rootFolderId: rootId,
        rootFolderName: folderId === rootId ? folderName : "2026",
        folderId,
        folderName,
        level: "tracks",
        items: [],
        tracks,
        tracksHasMore: false,
        updateDays: updateDayLinks(allDateFolders),
        coverUrl,
      };
    }

    // O mês é uma tabela contínua: as pastas 29-SET, 28-SET, 27-SET...
    // fornecem apenas a data de cada faixa. Nunca carregamos o mês inteiro
    // de uma vez; a API devolve lotes pequenos para o infinite scroll.
    const requestedLimit = Math.max(1, Math.min(trackLimit, 400));
    const state: TrackPageState = {
      skip: Math.max(0, trackOffset),
      limit: requestedLimit + 1,
      skipped: 0,
      collected: 0,
      hasMore: false,
    };
    const datedTracks: PreviewTrack[] = [];

    for (const dateFolder of dateFoldersAtMonth) {
      if (datedTracks.length >= state.limit) break;
      const parsed = parseUpdateDateFolder(dateFolder.name);
      if (!parsed) continue;
      try {
        const nested = await collectTracksPageDeep(
          dateFolder.id,
          dateFolder.name,
          state,
          0,
          new Set<string>(),
          parsed.key,
          null,
          null,
          true,
          null,
          null,
          null,
          filters,
        );
        datedTracks.push(...nested);
      } catch {
        // Uma data com falha não impede as demais datas do mês de carregar.
      }
    }

    // Não reordenar globalmente aqui: o deep-walk já percorre
    // data → pool → estilo → faixas. Isso mantém cada pool agrupado,
    // como no acervo do Drive, enquanto avança dos conteúdos mais novos
    // para os mais antigos.
    const tracks = datedTracks.slice(0, requestedLimit);

    return {
      configured: true,
      rootFolderId: rootId,
      rootFolderName: folderId === rootId ? folderName : "2026",
      folderId,
      folderName,
      level: "tracks",
      items: [],
      tracks,
      // Se a página veio cheia, ainda pode existir conteúdo na próxima página.
      // Mantemos o LOAD MORE visível mesmo quando o deep-walk terminou exatamente
      // no limite solicitado (por exemplo, ao atravessar várias pastas de datas).
      tracksHasMore: state.hasMore || datedTracks.length > requestedLimit,
      updateDays: updateDayLinks(allDateFolders),
      coverUrl,
    };
  }

  // Uma pasta de data, quando acessada diretamente por uma URL legada,
  // continua mostrando a tabela de músicas e suas colunas Pool/Estilo.
  const dateFolder = parseUpdateDateFolder(folderName);
  if (dateFolder) {
    const tracks = (await collectTracksDeep(
      folderId,
      folderName,
      0,
      new Set<string>(),
      dateFolder.key,
      null,
      null,
      true,
    )).sort(sortTracksByUploadThenTitle);

    return {
      configured: true,
      rootFolderId: rootId,
      rootFolderName: folderId === rootId ? folderName : "2026",
      folderId,
      folderName,
      level: "tracks",
      items: [],
      tracks,
      coverUrl,
    };
  }

  // Um Pool com subpastas mostra os Estilos. Só o nível final, que contém
  // diretamente os arquivos, vira uma lista de músicas.
  if (!folderDate && subfolders.length > 0 && folderId !== rootId) {
    const sortedChildren = sortVipChildFolders(
      subfolders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        isNew: isNewFolderName(folder.name),
      })),
    );
    const stats = await mapPool(sortedChildren, 8, (folder) => getFolderNavStats(folder.id));
    const items: VipMusicCatalogItem[] = sortedChildren.map((folder, index) => ({
      ...folder,
      type: "folder" as const,
      coverUrl: stats[index]?.coverUrl ?? null,
      folderCount: stats[index]?.folderCount ?? 0,
      trackCount: stats[index]?.trackCount ?? 0,
    }));

    return {
      configured: true,
      rootFolderId: rootId,
      rootFolderName: folderId === rootId ? folderName : "2026",
      folderId,
      folderName,
      level: "folders",
      items,
      tracks: [],
      coverUrl,
    };
  }

  // Há subpastas. Para qualquer nível navegável abaixo da raiz, se existirem
  // MP3 em níveis descendentes, este próprio nível vira uma tabela contínua.
  // Assim um pack como "DANCE HITS COLLECTION 90TH" não fica preso no
  // catálogo de categorias: suas faixas de todas as subpastas aparecem aqui.
  if (subfolders.length > 0) {
    if (folderId !== rootId) {
      const requestedLimit = Math.max(1, Math.min(trackLimit ?? 50, 100));
      const state: TrackPageState = {
        skip: Math.max(0, trackOffset),
        limit: requestedLimit + 1,
        skipped: 0,
        collected: 0,
        hasMore: false,
      };
      const tracks = (await collectTracksPageDeep(
        folderId,
        folderName,
        state,
        0,
        new Set<string>(),
        null,
        null,
        null,
        false,
        null,
        folderName,
        null,
        filters,
      )).sort(sortTracksByUploadThenTitle);
      if (tracks.length > 0) {
        const pageTracks = tracks.slice(0, requestedLimit);
        return {
          configured: true,
          rootFolderId: rootId,
          rootFolderName: "2026",
          folderId,
          folderName,
          level: "tracks",
          items: [],
          tracks: pageTracks,
          tracksHasMore: state.hasMore || tracks.length > requestedLimit,
          coverUrl,
        };
      }
    }

    const dateFolders = subfolders
      .filter((folder) => parseUpdateDateFolder(folder.name))
      .sort((a, b) => {
        const ad = parseUpdateDateFolder(a.name)?.key ?? "";
        const bd = parseUpdateDateFolder(b.name)?.key ?? "";
        return bd.localeCompare(ad);
      });
    const otherFolders = subfolders.filter((folder) => !parseUpdateDateFolder(folder.name));

    // Pastas `17-09-2026`: reúne as faixas de todas as subpastas de estilo
    // na tabela da data, sem obrigar a abrir uma página para cada estilo.
    let datedTracks: PreviewTrack[] = [];
    let tracksHasMore = false;
    if (dateFolders.length > 0 && trackLimit == null) {
      const nested = await mapPool(dateFolders, TRACK_WALK_CONCURRENCY, async (folder) => {
        const parsed = parseUpdateDateFolder(folder.name);
        if (!parsed) return [] as PreviewTrack[];
        try {
          return await collectTracksDeep(
            folder.id,
            folderName,
            0,
            new Set<string>(),
            parsed.key,
            null,
            null,
            true,
          );
        } catch {
          return [] as PreviewTrack[];
        }
      });
      datedTracks = nested.flat();
    } else if (dateFolders.length > 0) {
      const requestedLimit = Math.max(1, Math.min(trackLimit ?? 100, 100));
      const state: TrackPageState = {
        skip: Math.max(0, trackOffset),
        limit: requestedLimit + 1,
        skipped: 0,
        collected: 0,
        hasMore: false,
      };
      for (const folder of dateFolders) {
        const parsed = parseUpdateDateFolder(folder.name);
        if (!parsed || datedTracks.length >= state.limit) break;
        try {
          const nested = await collectTracksPageDeep(
            folder.id,
            folderName,
            state,
            0,
            new Set<string>(),
            parsed.key,
            null,
            null,
            true,
          );
          datedTracks.push(...nested);
        } catch {
          // Continua para a próxima data se uma pasta isolada falhar.
        }
      }
      tracksHasMore = state.hasMore || datedTracks.length > requestedLimit;
      datedTracks = datedTracks.slice(0, requestedLimit);
    }

    const directTracks = audioFiles
      .map((file) => toPreviewTrack(file, folderName))
      .sort(sortTracksByUploadThenTitle);

    const tracks = [...datedTracks, ...directTracks].sort(sortTracksByUploadThenTitle);

    // Só pastas de data (ou nenhuma outra pasta) → trata como nível de faixas.
    if (otherFolders.length === 0 && tracks.length > 0) {
      return {
        configured: true,
        rootFolderId: rootId,
        rootFolderName: folderId === rootId ? folderName : "2026",
        folderId,
        folderName,
        level: "tracks",
        items: [],
        tracks: trackLimit == null
          ? tracks
          : tracks.slice(0, Math.max(1, Math.min(trackLimit, 100))),
        ...(trackLimit == null ? {} : { tracksHasMore }),
        coverUrl,
      };
    }

    const sorted = sortVipChildFolders(
      otherFolders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        isNew: isNewFolderName(folder.name),
      })),
    );
    // Contagens + capa para todos os níveis (meses → semanas → estilos → subpastas).
    const stats = await mapPool(sorted, 8, (folder) => getFolderNavStats(folder.id));

    const items: VipMusicCatalogItem[] = sorted.map((folder, index) => ({
      ...folder,
      type: "folder" as const,
      coverUrl: stats[index]?.coverUrl ?? null,
      folderCount: stats[index]?.folderCount ?? 0,
      trackCount: stats[index]?.trackCount ?? 0,
    }));

    return {
      configured: true,
      rootFolderId: rootId,
      rootFolderName: folderId === rootId ? folderName : "2026",
      folderId,
      folderName,
      level: "folders",
      items,
      tracks,
      coverUrl,
    };
  }

  // Folha sem subpastas: usa a listagem já feita (não re-walk).
  const tracks = audioFiles
    .map((file) => toPreviewTrack(file, folderName))
    .sort(sortTracksByUploadThenTitle);

  return {
    configured: true,
    rootFolderId: rootId,
    rootFolderName: "2026",
    folderId,
    folderName,
    level: "tracks",
    items: [],
    tracks,
    coverUrl,
  };
}

async function getSendNowCatalog(
  folderStorageId: string,
  folderName: string,
  trackOffset = 0,
  trackLimit?: number,
): Promise<VipMusicCatalogResponse & { tracksHasMore?: boolean }> {
  const rootId = getVipMusicRootFolderId();
  const fldId = sendNowFldIdFromStorageId(folderStorageId);
  const listed = await listSendNowFolder(fldId);
  const items: VipMusicCatalogItem[] = listed.folders.map((folder) => ({
    id: sendNowFolderStorageId(String(folder.fld_id)),
    name: folder.name ?? "Pasta",
    type: "folder",
    isNew: false,
  }));
  const allTracks: PreviewTrack[] = listed.files.map((file) => {
    const fileName = file.name ?? "faixa.mp3";
    const meta = parseTrackMeta(fileName);
    const uploaded = file.uploaded?.trim();
    const modifiedAt = uploaded ? uploaded.replace(" ", "T") + "Z" : null;
    const size = file.size == null || file.size === "" ? null : Number(file.size);
    return {
      id: sendNowFileStorageId(file.file_code!),
      pack: folderName,
      fileName,
      ...meta,
      source: "sendnow",
      title: meta.title || fileName,
      modifiedAt,
      sizeBytes: Number.isFinite(size) && size && size > 0 ? size : null,
    };
  });
  const limit = trackLimit == null ? allTracks.length : Math.max(1, Math.min(trackLimit, 100));
  const offset = Math.max(0, trackOffset);
  const tracks = allTracks.slice(offset, offset + limit);
  const hasFolders = items.length > 0;
  const level = hasFolders ? "folders" : "tracks";

  return {
    configured: true,
    rootFolderId: rootId,
    rootFolderName: "2026",
    folderId: folderStorageId,
    folderName,
    level,
    items: hasFolders ? items : [],
    tracks,
    tracksHasMore: offset + tracks.length < allTracks.length,
    coverUrl: null,
  };
}

export async function getVipMusicCatalog(
  folderId?: string,
  folderName?: string,
  trackOffset = 0,
  trackLimit?: number,
  dayKey?: string | null,
  filters?: CatalogTrackFilters,
): Promise<VipMusicCatalogResponse & { tracksHasMore?: boolean }> {
  const rootId = getVipMusicRootFolderId();

  if (!rootId) {
    return {
      configured: false,
      rootFolderId: "",
      rootFolderName: "Acervo",
      folderId: "root",
      folderName: "Acervo VIP",
      level: "folders",
      items: [],
      tracks: [],
      coverUrl: null,
    };
  }

  const targetId = folderId && folderId !== "root" ? folderId : rootId;
  const resolvedName = folderName?.trim() || (targetId === rootId ? "2026" : "Pasta");

  if (isSendNowFolderStorageId(targetId)) {
    return getSendNowCatalog(targetId, resolvedName, trackOffset, trackLimit);
  }

  try {
    const day = dayKey?.trim() ?? "";
    const catalog = await getDriveCatalog(
      targetId,
      resolvedName,
      trackOffset,
      trackLimit,
      /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null,
      filters,
    );
    return catalog;
  } catch {
    return {
      configured: true,
      rootFolderId: rootId,
      rootFolderName: "2026",
      folderId: targetId,
      folderName: resolvedName,
      level: "folders",
      items: [],
      tracks: [],
      coverUrl: null,
    };
  }
}

export const VIP_MUSIC_TRACKS_PAGE_SIZE = 50;

/** Lista todas as faixas da pasta, incluindo subpastas aninhadas até os MP3. */
export async function getVipMusicTracks(folderId: string, folderName: string): Promise<PreviewTrack[]> {
  const tracks = await collectTracksDeep(folderId, folderName);
  return tracks.sort(sortTracksByUploadThenTitle);
}

export type VipMusicTrackPage = {
  tracks: PreviewTrack[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export async function getVipMusicTracksPaginated(
  folderId: string,
  folderName: string,
  page = 1,
  limit = VIP_MUSIC_TRACKS_PAGE_SIZE,
): Promise<VipMusicTrackPage> {
  const all = await getVipMusicTracks(folderId, folderName);
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : VIP_MUSIC_TRACKS_PAGE_SIZE;
  const start = (safePage - 1) * safeLimit;
  const pageTracks = all.slice(start, start + safeLimit);

  // Tags embutidas baixam ~1MB/faixa via a function da Vercel (Fast Origin Transfer).
  // Desligado por padrão — o display usa getTrackDisplayMetadata no nome do arquivo.
  // Ative com VIP_MUSIC_ENRICH_DRIVE_TAGS=1 se precisar de capa/artista das tags.
  const enrichTags = process.env.VIP_MUSIC_ENRICH_DRIVE_TAGS === "1";
  const tracks = enrichTags
    ? await (await import("./audio-file-tags")).enrichTracksWithDriveTags(pageTracks)
    : pageTracks;

  return {
    tracks,
    total: all.length,
    page: safePage,
    limit: safeLimit,
    hasMore: start + tracks.length < all.length,
  };
}

export const VIP_MUSIC_FEED_PAGE_SIZE = 6;
/** Faixas iniciais por pack no feed / blocos de atualizações (resto via “LOAD MORE”, em lotes de 100). */
export const VIP_MUSIC_FEED_TRACKS_PAGE_SIZE = 100;

export type VipMusicFeedPack = {
  id: string;
  name: string;
  slugSegments: string[];
  monthName: string;
  weekName: string | null;
  modifiedAt: string | null;
  coverUrl: string | null;
  tracks: PreviewTrack[];
  trackCount: number;
  totalSizeBytes: number;
};

export type VipMusicFeedResponse = {
  packs: VipMusicFeedPack[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type FeedCandidate = {
  id: string;
  name: string;
  slugSegments: string[];
  monthName: string;
  weekName: string | null;
  modifiedAt: number;
};

async function listVipMusicFeedCandidates(options?: {
  monthSlug?: string;
  weekSlug?: string;
}): Promise<FeedCandidate[]> {
  const months = await listVipMusicFolders();
  if (!months.length) return [];

  const monthSlug = options?.monthSlug?.trim() || null;
  const weekSlug = options?.weekSlug?.trim() || null;
  const scopedMonths = monthSlug
    ? months.filter((month) => slugifyFolderName(month.name) === monthSlug)
    : months;

  const candidates: FeedCandidate[] = [];

  for (const month of scopedMonths) {
    const monthName = displayFolderName(month.name);
    const monthSeg = slugifyFolderName(month.name);
    const children = await listDriveFolderChildren(month.id);
    const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
    const sorted = sortVipChildFolders(subfolders.map((folder) => ({ id: folder.id, name: folder.name })));
    const modifiedById = new Map(
      subfolders.map((folder) => [folder.id, folder.modifiedTime ? Date.parse(folder.modifiedTime) : 0]),
    );

    if (childrenAreWeekFolders(sorted)) {
      const weeks = weekSlug
        ? sorted.filter((week) => slugifyFolderName(week.name) === weekSlug)
        : [...sorted].reverse();
      for (const week of weeks) {
        const weekName = displayFolderName(week.name);
        const weekSeg = slugifyFolderName(week.name);
        const weekChildren = await listDriveFolderChildren(week.id);
        for (const style of weekChildren.filter((item) => item.mimeType === FOLDER_MIME)) {
          candidates.push({
            id: style.id,
            name: displayFolderName(style.name),
            slugSegments: [monthSeg, weekSeg, slugifyFolderName(style.name)],
            monthName,
            weekName,
            modifiedAt: style.modifiedTime ? Date.parse(style.modifiedTime) : modifiedById.get(week.id) ?? 0,
          });
        }
      }
    } else {
      for (const style of sorted) {
        candidates.push({
          id: style.id,
          name: displayFolderName(style.name),
          slugSegments: [monthSeg, slugifyFolderName(style.name)],
          monthName,
          weekName: null,
          modifiedAt: modifiedById.get(style.id) ?? 0,
        });
      }
    }
  }

  // Considera músicas adicionadas em subpastas de packs antigos, com limite de concorrência.
  const recentTimes = await mapPool(candidates, 4, async (candidate) => {
    const visited = new Set<string>();
    async function newestInFolder(id: string, depth: number): Promise<number> {
      if (depth > 4 || visited.has(id)) return 0;
      visited.add(id);
      try {
        const children = await listDriveFolderChildren(id);
        let newest = 0;
        const folders: string[] = [];
        for (const child of children) {
          if (child.mimeType === FOLDER_MIME) folders.push(child.id);
          else if (isDriveAudioFile(child)) {
            const timestamp = Date.parse(child.modifiedTime ?? child.createdTime ?? "");
            if (Number.isFinite(timestamp)) newest = Math.max(newest, timestamp);
          }
        }
        if (depth < 4 && folders.length) {
          const nested = await mapPool(folders, 4, (childId) => newestInFolder(childId, depth + 1));
          for (const timestamp of nested) newest = Math.max(newest, timestamp);
        }
        return newest;
      } catch {
        return 0;
      }
    }
    return newestInFolder(candidate.id, 0);
  });
  candidates.forEach((candidate, index) => {
    candidate.modifiedAt = Math.max(candidate.modifiedAt, recentTimes[index] ?? 0);
  });

  const hasTimestamps = candidates.some((item) => item.modifiedAt > 0);
  if (hasTimestamps) {
    candidates.sort((a, b) => b.modifiedAt - a.modifiedAt);
  }
  return candidates;
}

export async function getVipMusicUpdatesFeed(options?: {
  page?: number;
  pageSize?: number;
  monthSlug?: string;
  weekSlug?: string;
}): Promise<VipMusicFeedResponse> {
  const pageSizeRaw = options?.pageSize ?? VIP_MUSIC_FEED_PAGE_SIZE;
  const pageSize = Number.isInteger(pageSizeRaw) && pageSizeRaw > 0 ? Math.min(pageSizeRaw, 12) : VIP_MUSIC_FEED_PAGE_SIZE;
  const pageRaw = options?.page ?? 1;
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const candidates = await listVipMusicFeedCandidates({
    monthSlug: options?.monthSlug,
    weekSlug: options?.weekSlug,
  });
  const total = candidates.length;
  const start = (page - 1) * pageSize;
  const slice = candidates.slice(start, start + pageSize);

  const packs = await mapPool(slice, 3, async (candidate) => {
    const pageResult = await getVipMusicTracksPaginated(
      candidate.id,
      candidate.name,
      1,
      VIP_MUSIC_FEED_TRACKS_PAGE_SIZE,
    );
    const totalSizeBytes = pageResult.tracks.reduce((sum, track) => sum + (track.sizeBytes ?? 0), 0);
    return {
      id: candidate.id,
      name: candidate.name,
      slugSegments: candidate.slugSegments,
      monthName: candidate.monthName,
      weekName: candidate.weekName,
      modifiedAt: candidate.modifiedAt > 0 ? new Date(candidate.modifiedAt).toISOString() : null,
      coverUrl: null,
      tracks: pageResult.tracks,
      trackCount: pageResult.total,
      totalSizeBytes,
    } satisfies VipMusicFeedPack;
  });

  return {
    packs,
    page,
    pageSize,
    total,
    hasMore: start + packs.length < total,
  };
}

/**
 * Três pastas mais recentes do acervo VIP (estilo/pack) para o preview da home.
 * Ordena por `modifiedTime` do Drive quando disponível; senão prioriza meses/semanas mais novos.
 */
export async function getLatestVipPreviewPlaylists(limit = 3): Promise<PreviewPlaylist[]> {
  const { getPreviewPlaylists } = await import("./google-drive");

  if (!isVipMusicCatalogConfigured()) {
    return (await getPreviewPlaylists()).slice(0, limit);
  }

  const candidates = await listVipMusicFeedCandidates();
  if (!candidates.length) {
    return (await getPreviewPlaylists()).slice(0, limit);
  }

  const playlists: PreviewPlaylist[] = [];
  for (const candidate of candidates) {
    if (playlists.length >= limit) break;
    const tracks = await getVipMusicTracks(candidate.id, candidate.name);
    if (!tracks.length) continue;
    playlists.push({
      id: candidate.id,
      name: candidate.weekName ? `${candidate.weekName} · ${candidate.name}` : candidate.name,
      tracks: tracks.slice(0, 50),
    });
  }

  if (playlists.length) return playlists;
  return (await getPreviewPlaylists()).slice(0, limit);
}

/** Entrada de pasta navegável para sitemap/SEO de /musicas/atualizacoes. */
export type VipAtualizacoesSitemapEntry = {
  segments: string[];
  label: string;
  depth: number;
};

const SITEMAP_WALK_CONCURRENCY = 6;
/** Pack → mês → semana → estilo (máx. 4 níveis de URL). */
const SITEMAP_MAX_DEPTH = 4;
const SITEMAP_MAX_ENTRIES = 2500;

/**
 * Percorre o acervo VIP e devolve todos os paths de pasta indexáveis
 * (`/musicas/atualizacoes/...slug`). Falha vazia se o Drive estiver indisponível.
 */
export async function listVipMusicAtualizacoesSitemapPaths(): Promise<
  VipAtualizacoesSitemapEntry[]
> {
  if (!isVipMusicCatalogConfigured()) return [];

  async function walk(
    parentFolderId: string | undefined,
    parentSegments: string[],
    depth: number,
  ): Promise<VipAtualizacoesSitemapEntry[]> {
    if (depth > SITEMAP_MAX_DEPTH) return [];

    const folders = await listVipMusicFolders(parentFolderId);
    if (folders.length === 0) return [];

    const level: VipAtualizacoesSitemapEntry[] = [];
    const nextTargets: Array<{ id: string; segments: string[] }> = [];

    for (const folder of folders) {
      const slug = slugifyFolderName(folder.name);
      if (!slug) continue;
      const segments = [...parentSegments, slug];
      level.push({
        segments,
        label: displayFolderName(folder.name),
        depth,
      });
      if (depth < SITEMAP_MAX_DEPTH) {
        nextTargets.push({ id: folder.id, segments });
      }
    }

    if (nextTargets.length === 0) return level;

    const nested = await mapPool(nextTargets, SITEMAP_WALK_CONCURRENCY, (target) =>
      walk(target.id, target.segments, depth + 1),
    );

    return [...level, ...nested.flat()];
  }

  const all = await walk(undefined, [], 1);
  return all.slice(0, SITEMAP_MAX_ENTRIES);
}
