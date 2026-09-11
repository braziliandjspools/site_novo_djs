/** Classes compartilhadas — visual minimalista tipo DJ Pool / Spotify. */

export const poolPanelClass =
  "overflow-hidden rounded-[var(--radius-panel)] border border-white/[0.08] bg-[#0d0d0d]";

export const poolPanelHeaderClass =
  "flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#141414] px-3 py-3 sm:px-4";

/** Alias: headers de pasta. */
export const poolPanelHeaderBrClass = poolPanelHeaderClass;

export const poolTableHeadClass =
  "grid items-center gap-x-3 border-b border-white/10 bg-[#141414] px-3 py-2.5 text-[11px] font-medium tracking-[-0.01em] text-zinc-500 sm:px-4";

export const poolRowBaseClass =
  "grid items-center gap-x-3 border-b border-white/10 px-3 py-2.5 transition-colors last:border-b-0 sm:px-4";

export const folderActionSendClass =
  "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#1ed760]/45 bg-[#1ed760]/20 text-[#1ed760] transition-colors hover:bg-[#1ed760]/35 hover:text-[#7dffb0] disabled:cursor-not-allowed disabled:opacity-50";

export const folderActionCopyClass =
  "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

/** Título de pasta/subpasta — mesmo tamanho em todos os níveis. */
export const packListFolderTitleClass =
  "min-w-0 flex-1 break-words text-[15px] font-medium leading-snug text-zinc-100 group-hover:text-white sm:text-base";

/** Separador horizontal entre linhas. */
export const packListRowBorderClass = "border-b border-white/10 last:border-b-0";

/**
 * Zebrado alto contraste + linha entre itens.
 * Fundo sólido (sem depender do gradient do player-shell).
 */
export function poolRowTone(index: number, active = false) {
  if (active) {
    return `${packListRowBorderClass} bg-[#1ed760]/12 hover:bg-[#1ed760]/16`;
  }
  return index % 2 === 0
    ? `${packListRowBorderClass} bg-[#0a0a0a] hover:bg-[#151515]`
    : `${packListRowBorderClass} bg-[#1c1c1c] hover:bg-[#242424]`;
}

export function packListRowTone(index: number, active = false) {
  return poolRowTone(index, active);
}

export const packListAccentBarClass = "hidden";

export const packListPanelClass = poolPanelClass;
