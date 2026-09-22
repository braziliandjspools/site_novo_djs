"use client";

import { useEffect, useState } from "react";
import { getNewFolderIds } from "./read-state";

export function useNewFolderHighlights(storageKey: string, folderIds: string[]) {
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());
  const idsKey = folderIds.join("|");

  useEffect(() => {
    if (folderIds.length === 0) return;
    // Destaque expira à meia-noite (getNewFolderIds cuida do estado persistido).
    setNewIds(getNewFolderIds(storageKey, folderIds));
  }, [storageKey, idsKey]);

  return newIds;
}
