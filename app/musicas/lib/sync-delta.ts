export type SyncItemSnapshot = {
  id: string;
  name: string;
};

export type SyncSnapshot = {
  folders: SyncItemSnapshot[];
  tracks: SyncItemSnapshot[];
};

export type SyncDelta = {
  newFolders: SyncItemSnapshot[];
  newTracks: SyncItemSnapshot[];
  removedFolderCount: number;
  removedTrackCount: number;
};

export function captureSyncSnapshot(input: {
  folders?: Array<{ id: string; name: string }> | null;
  tracks?: Array<{ id: string; title?: string; fileName?: string | null }> | null;
}): SyncSnapshot {
  return {
    folders: (input.folders ?? []).map((folder) => ({
      id: folder.id,
      name: folder.name.trim() || "Pasta",
    })),
    tracks: (input.tracks ?? []).map((track) => ({
      id: track.id,
      name: (track.title || track.fileName || "Faixa").trim(),
    })),
  };
}

export function diffSyncSnapshots(before: SyncSnapshot, after: SyncSnapshot): SyncDelta {
  const beforeFolderIds = new Set(before.folders.map((item) => item.id));
  const beforeTrackIds = new Set(before.tracks.map((item) => item.id));
  const afterFolderIds = new Set(after.folders.map((item) => item.id));
  const afterTrackIds = new Set(after.tracks.map((item) => item.id));

  return {
    newFolders: after.folders.filter((item) => !beforeFolderIds.has(item.id)),
    newTracks: after.tracks.filter((item) => !beforeTrackIds.has(item.id)),
    removedFolderCount: before.folders.filter((item) => !afterFolderIds.has(item.id)).length,
    removedTrackCount: before.tracks.filter((item) => !afterTrackIds.has(item.id)).length,
  };
}

function listNames(items: SyncItemSnapshot[], limit = 6) {
  if (items.length === 0) return "";
  const names = items.slice(0, limit).map((item) => item.name);
  const extra = items.length - names.length;
  if (extra > 0) return `${names.join(", ")} e mais ${extra}`;
  return names.join(", ");
}

/** Mensagem curta para toast. */
export function formatSyncDeltaToast(delta: SyncDelta, contextLabel = "neste nível"): string {
  const parts: string[] = [];
  if (delta.newFolders.length > 0) {
    parts.push(
      delta.newFolders.length === 1
        ? `1 pasta nova: ${delta.newFolders[0].name}`
        : `${delta.newFolders.length} pastas novas: ${listNames(delta.newFolders, 4)}`,
    );
  }
  if (delta.newTracks.length > 0) {
    parts.push(
      delta.newTracks.length === 1
        ? `1 música nova: ${delta.newTracks[0].name}`
        : `${delta.newTracks.length} músicas novas: ${listNames(delta.newTracks, 3)}`,
    );
  }

  if (parts.length > 0) {
    return `Sincronizado ${contextLabel} · ${parts.join(" · ")}`;
  }

  if (delta.removedFolderCount > 0 || delta.removedTrackCount > 0) {
    const removed: string[] = [];
    if (delta.removedFolderCount > 0) {
      removed.push(
        `${delta.removedFolderCount} pasta${delta.removedFolderCount === 1 ? "" : "s"} removida${delta.removedFolderCount === 1 ? "" : "s"}`,
      );
    }
    if (delta.removedTrackCount > 0) {
      removed.push(
        `${delta.removedTrackCount} música${delta.removedTrackCount === 1 ? "" : "s"} removida${delta.removedTrackCount === 1 ? "" : "s"}`,
      );
    }
    return `Sincronizado ${contextLabel} · ${removed.join(" · ")} (sem itens novos)`;
  }

  return `Sincronizado ${contextLabel} · nenhuma pasta ou música nova`;
}

export function hasSyncDeltaNews(delta: SyncDelta) {
  return delta.newFolders.length > 0 || delta.newTracks.length > 0;
}
