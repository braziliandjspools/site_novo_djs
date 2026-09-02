"use client";

import { useEffect, useState } from "react";
import { getNewFolderIds, markFoldersRead } from "./read-state";

export function useNewFolderHighlights(storageKey: string, folderIds: string[]) {
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());
  const idsKey = folderIds.join("|");

  useEffect(() => {
    if (folderIds.length === 0) return;

    setNewIds(getNewFolderIds(storageKey, folderIds));

    const idsToSave = [...folderIds];
    return () => {
      markFoldersRead(storageKey, idsToSave);
    };
  }, [storageKey, idsKey]);

  return newIds;
}
