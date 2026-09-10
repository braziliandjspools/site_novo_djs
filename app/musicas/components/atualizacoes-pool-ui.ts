/** Classes compartilhadas — visual minimalista tipo DJ Pool / Spotify. */

export const poolPanelClass =
  "player-shell overflow-hidden rounded-[var(--radius-panel)] border border-white/[0.06]";

export const poolPanelHeaderClass =
  "flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-3 py-3 sm:px-4";

/** Alias: headers de pasta sem gradiente colorido. */
export const poolPanelHeaderBrClass = poolPanelHeaderClass;

export const poolTableHeadClass =
  "grid items-center gap-x-3 border-b border-white/[0.06] bg-[#0c0c0c]/90 px-3 py-2.5 text-[11px] font-medium tracking-[-0.01em] text-zinc-500 backdrop-blur-md sm:px-4";

export const poolRowBaseClass =
  "grid items-center gap-x-3 border-b border-white/[0.04] px-3 py-2.5 transition-colors last:border-b-0 sm:px-4";

export const folderActionSendClass =
  "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#1ed760] transition-colors hover:bg-[#1ed760]/15 hover:text-[#7dffb0] disabled:cursor-not-allowed disabled:opacity-50";

export const folderActionCopyClass =
  "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

/** Zebrado neutro — faixas e packs. */
export function poolRowTone(index: number, active = false) {
  if (active) return "bg-white/[0.06]";
  return index % 2 === 0
    ? "bg-transparent hover:bg-white/[0.04]"
    : "bg-white/[0.015] hover:bg-white/[0.045]";
}

/** Packs: só duas faixas neutras intercaladas (sem verde/azul). */
export function packListRowTone(index: number, active = false) {
  return poolRowTone(index, active);
}

export const packListAccentBarClass = "hidden";

export const packListPanelClass = poolPanelClass;
