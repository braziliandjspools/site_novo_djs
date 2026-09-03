import { openUrl } from "@tauri-apps/plugin-opener";
import { BP_MUSICAS_URL } from "./site";

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function openPlatform(url: string = BP_MUSICAS_URL) {
  if (isTauriRuntime()) {
    await openUrl(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

/** @deprecated Use openPlatform */
export const openBrazilianPacks = openPlatform;
