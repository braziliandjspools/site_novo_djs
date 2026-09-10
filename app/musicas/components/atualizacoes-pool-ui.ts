/** Classes compartilhadas — visual tipo DJ Pool (tema escuro/claro via CSS vars). */

export const poolPanelClass =
  "pool-shell overflow-hidden rounded-[var(--radius-panel)] border border-[color:var(--pool-border)] bg-[var(--pool-surface)] text-[color:var(--pool-text)] shadow-[var(--pool-shadow)]";

export const poolPanelHeaderClass =
  "flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--pool-border)] bg-[var(--pool-surface-2)] px-3 py-3 sm:px-4";

export const poolTableHeadClass =
  "grid items-center gap-x-3 border-b border-[color:var(--pool-border)] bg-[var(--pool-table-head)] px-3 py-2 text-[11px] font-medium tracking-[-0.01em] text-[color:var(--pool-text-muted)] sm:px-4";

export const poolRowBaseClass =
  "grid items-center gap-x-3 border-b border-[color:var(--pool-border)] px-3 py-2.5 transition-colors last:border-b-0 sm:px-4";

/** Botões de ação nas linhas de pasta (Downloader / copiar). */
export const folderActionSendClass =
  "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#1ed760]/45 bg-[#1ed760]/20 text-[#1ed760] transition-colors hover:bg-[#1ed760]/35 hover:text-[#7dffb0] disabled:cursor-not-allowed disabled:opacity-50";

export const folderActionCopyClass =
  "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-sky-500/45 bg-sky-500/20 text-sky-400 transition-colors hover:bg-sky-500/35 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50";

/** Zebrado adaptável ao tema. */
export function poolRowTone(index: number, active = false) {
  if (active) return "player-track-row-active";
  return index % 2 === 0
    ? "bg-[var(--pool-row-a)] hover:bg-[var(--pool-row-hover)]"
    : "bg-[var(--pool-row-b)] hover:bg-[var(--pool-row-hover)]";
}
